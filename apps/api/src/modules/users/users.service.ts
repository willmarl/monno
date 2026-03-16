import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileProcessingService } from '../../common/file-processing/file-processing.service';
import { uploadLocation } from '../../common/file-processing/upload-location';
import { EmailVerificationService } from '../auth/email-verification.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
import { UserSearchDto, UserSearchCursorDto } from './dto/search-user.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';

const DEFAULT_ADMIN_USER_SELECT = {
  id: true,
  username: true,
  avatarPath: true,
  email: true,
  tempEmail: true,
  createdAt: true,
  updatedAt: true,
  role: true,
  isEmailVerified: true,
  status: true,
  statusExpireAt: true,
  statusReason: true,
  deleted: true,
  deletedAt: true,
  subscription: {
    select: { status: true, tier: true, nextTier: true },
  },
  credits: true,
};

const DEFAULT_PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  avatarPath: true,
  createdAt: true,
  status: true,
  deleted: true,
  deletedAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private fileProcessing: FileProcessingService,
    private emailVerification: EmailVerificationService,
  ) {}

  /**
   * Restore user and cascade restore all their deleted content
   * - Restores all user's soft-deleted posts
   * - Checks if original username is available (from usernameHistory)
   * - If available, restores user to original username
   * - If not available, keeps the current d_ prefixed username
   * - Sets status back to ACTIVE
   */
  async restoreUserWithCascade(userId: number) {
    const now = new Date();

    // Get the user's current state
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        status: true,
        deleted: true,
        email: true,
        tempEmail: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is not deleted
    if (!user.deleted || user.status !== 'DELETED') {
      throw new BadRequestException(
        'User is not deleted and cannot be restored',
      );
    }

    // Get the original username from usernameHistory
    const usernameHistory = await this.prisma.usernameHistory.findFirst({
      where: { userId },
      orderBy: { freedAt: 'desc' },
      select: { username: true },
    });

    let restoredUsername = user.username; // Default: keep current d_ prefixed username

    // Check if original username is available
    if (usernameHistory) {
      const originalUsername = usernameHistory.username;
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: originalUsername },
      });

      // If original username is available, use it
      if (!usernameExists) {
        restoredUsername = originalUsername;
      }
    }

    // Restore all user's posts
    await this.prisma.post.updateMany({
      where: { creatorId: userId },
      data: { deleted: false, deletedAt: null },
    });

    // Restore original email if it was mangled on deletion.
    // tempEmail holds the original; check it's not taken by another user first.
    let restoredEmail: string | null | undefined;
    if (user.tempEmail && user.email?.startsWith(`deleted_${userId}_`)) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: user.tempEmail },
      });
      restoredEmail = emailTaken ? null : user.tempEmail;
    }

    // Restore the user and set status to ACTIVE
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        username: restoredUsername,
        status: 'ACTIVE',
        statusReason: null,
        deleted: false,
        deletedAt: null,
        ...(restoredEmail !== undefined && {
          email: restoredEmail, // restored original, or null if claimed by someone else
          tempEmail: null,
        }),
      },
      select: DEFAULT_ADMIN_USER_SELECT,
    });
  }

  /**
   * Soft delete user and cascade to all their created content
   * - Soft deletes all user's posts
   * - Logs username to history (username becomes available for reuse)
   * - Renames user to d_{username} (or d_{username} sliced to 32 chars if too long)
   * - Sets status to DELETED
   */
  async softDeleteUserWithCascade(userId: number, reason?: string) {
    const now = new Date();

    // Get the user's current username, status, and email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, status: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already deleted
    if (user.status === 'DELETED') {
      return { message: 'User was already deleted' };
    }

    // Generate renamed username: d_{username}
    // Max username length is 32, so calculate how much room we have for the original username
    const prefix = 'd_';
    let maxUsernameLength = 32 - prefix.length; // 30 chars for username
    let renamedUsername = prefix + user.username;
    if (renamedUsername.length > 32) {
      renamedUsername = prefix + user.username.slice(0, maxUsernameLength);
    }

    // Check if renamed username already exists (including normal usernames), if so prepend a counter
    let counter = 1;
    let existingUser = await this.prisma.user.findUnique({
      where: { username: renamedUsername },
    });
    while (existingUser) {
      const counterPrefix = `d${counter}_`;
      maxUsernameLength = 32 - counterPrefix.length;
      renamedUsername = counterPrefix + user.username;
      if (renamedUsername.length > 32) {
        renamedUsername =
          counterPrefix + user.username.slice(0, maxUsernameLength);
      }
      existingUser = await this.prisma.user.findUnique({
        where: { username: renamedUsername },
      });
      counter++;
    }

    // Soft delete all user's posts
    await this.prisma.post.updateMany({
      where: { creatorId: userId },
      data: { deleted: true, deletedAt: now },
    });

    // Log the username to history (username becomes available for reuse)
    await this.prisma.usernameHistory.create({
      data: {
        userId,
        username: user.username,
        reason: reason || 'account_deletion',
      },
    });

    // Mangle email so the original address is freed for reuse (e.g. by a new sign-up).
    // Original email is preserved in tempEmail for audit / restore purposes.
    let mangledEmail: string | undefined;
    if (user.email) {
      // Format: "deleted_<userId>_<original_email>" — unique, auditable, clearly invalid
      const prefix = `deleted_${userId}_`;
      const maxLen = 256; // stay within typical email column limits
      mangledEmail = (prefix + user.email).slice(0, maxLen);
    }

    // Soft delete the user and rename to d_{username}
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        username: renamedUsername,
        status: 'DELETED',
        statusReason: reason,
        deleted: true,
        deletedAt: now,
        ...(mangledEmail !== undefined && {
          email: mangledEmail, // freed original; mangled value stays for audit
          tempEmail: user.email, // original preserved here for restore
        }),
      },
      select: DEFAULT_ADMIN_USER_SELECT,
    });
  }

  //==============
  //   User Management
  //==============
  async create(data: CreateUserDto) {
    // Check if another user has already VERIFIED this email
    if (data.email) {
      const existingVerifiedUser = await this.prisma.user.findFirst({
        where: {
          email: data.email,
          isEmailVerified: true, // Only block verified emails
        },
      });

      if (existingVerifiedUser) {
        throw new BadRequestException('Email is already in use');
      }
      // Unverified emails can be reused - will be claimed by whoever verifies first
    }

    const hashed = await bcrypt.hash(data.password, 10);

    try {
      // Use transaction to create user and default favorites collection atomically
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            ...data,
            password: hashed,
          },
          select: DEFAULT_ADMIN_USER_SELECT,
        });

        // Create default "favorites" collection
        await tx.collection.create({
          data: {
            creatorId: user.id,
            name: 'favorites',
            description: 'Your favorite posts, videos, and articles',
          },
        });

        return user;
      });

      return result;
    } catch (error: any) {
      // Handle Prisma unique constraint errors
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException('Email is already in use');
      }
      throw error;
    }
  }

  //==============
  //   Auth
  //==============

  findByUsernameAuth(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  //==============
  //   Public
  //==============

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: DEFAULT_PUBLIC_USER_SELECT,
    });

    // Only return if user is active (public endpoint)
    if (user && user.status !== 'ACTIVE') {
      return null;
    }

    return user;
  }

  // # get all endpoint uses search. findAll is redundant as empty search gives same result
  //
  // async findAll(pag: PaginationDto) {
  //   const where = { status: 'ACTIVE' };
  //   const { items, pageInfo, isRedirected } = await offsetPaginate({
  //     model: this.prisma.user,
  //     limit: pag.limit ?? 10,
  //     offset: pag.offset ?? 0,
  //     query: {
  //       where,
  //       orderBy: { createdAt: 'desc' },
  //       select: DEFAULT_PUBLIC_USER_SELECT,
  //     },
  //     countQuery: { where },
  //   });
  //
  //   return {
  //     items,
  //     pageInfo,
  //     ...(isRedirected && { isRedirected: true }),
  //   };
  // }
  //
  // async findAllCursor(userId: number | null, pag: CursorPaginationDto) {
  //   const { cursor, limit } = pag;
  //
  //   const { items, nextCursor } = await cursorPaginate({
  //     model: this.prisma.user,
  //     limit: limit ?? 10,
  //     cursor,
  //     query: {
  //       where: { status: 'ACTIVE' },
  //       orderBy: { createdAt: 'desc' },
  //       select: DEFAULT_PUBLIC_USER_SELECT,
  //     },
  //   });
  //
  //   return {
  //     items,
  //     nextCursor: nextCursor,
  //   };
  // }

  //--------------
  //   Search
  //--------------

  async searchSuggest(q: string, limit: number) {
    if (!q) return [];

    return this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ username: { contains: q, mode: 'insensitive' } }],
      },
      select: DEFAULT_PUBLIC_USER_SELECT,
      take: limit,
    });
  }

  async searchAll(searchDto: UserSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const whereWithStatus = { ...where, status: 'ACTIVE' };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.user,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where: whereWithStatus,
        orderBy,
        select: DEFAULT_PUBLIC_USER_SELECT,
      },
      countQuery: { where: whereWithStatus },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  async searchAllCursor(searchDto: UserSearchCursorDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const orderBy = searchDto.getOrderBy();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { cursor, limit } = searchDto;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.user,
      limit: limit ?? 10,
      cursor,
      query: {
        where: { ...where, status: 'ACTIVE' },
        orderBy,
        select: DEFAULT_PUBLIC_USER_SELECT,
      },
    });

    return {
      items,
      nextCursor,
    };
  }

  //==============
  //   Self
  //==============

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: DEFAULT_ADMIN_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateProfile(userId: number, data: UpdateProfileDto, file?: any) {
    // Get current user to check if email is being changed and if it's verified
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        // Get the current user to retrieve old avatar path
        const currentUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { avatarPath: true },
        });

        // Delete old avatar if it exists
        if (currentUser?.avatarPath) {
          await this.fileProcessing.deleteFile(currentUser.avatarPath);
        }

        const fileType = uploadLocation('/avatars');
        const avatarPath = await this.fileProcessing.processFile(
          file,
          fileType,
          userId,
        );
        data.avatarPath = avatarPath;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to process avatar file';
        throw new BadRequestException(errorMessage);
      }
    }

    // Email change validation and claiming logic
    const emailChanged =
      data.email &&
      data.email !== currentUser.email &&
      data.email !== currentUser.tempEmail;

    // Check if user is canceling pending email verification
    const cancelingVerification =
      data.email && data.email === currentUser.email;

    if (cancelingVerification) {
      // User is reverting to current email - cancel pending verification
      (data as any).tempEmail = null;
    } else if (emailChanged) {
      // Check if new email is already verified by another user
      const existingVerifiedUser = await this.prisma.user.findFirst({
        where: {
          email: data.email,
          isEmailVerified: true,
          id: { not: userId }, // Different user
        },
      });

      if (existingVerifiedUser) {
        throw new BadRequestException('Email is already in use');
      }

      // Check if new email is in another user's verified or temp email
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            {
              email: data.email,
              isEmailVerified: true,
              id: { not: userId },
            },
            {
              tempEmail: data.email,
              id: { not: userId },
            },
          ],
        },
      });

      if (existingUser) {
        throw new BadRequestException('Email is already in use');
      }
    }

    // Update user profile
    const updateData: any = { ...data };

    // If email is being changed, store it in tempEmail and mark for verification
    // Don't change the primary email until verification
    if (emailChanged) {
      updateData.tempEmail = (data as any).email;
      delete updateData.email; // Don't update primary email yet
    } else if (cancelingVerification) {
      // Keep tempEmail null to clear pending verification
      updateData.tempEmail = null;
      delete updateData.email; // Don't send email in update data
    } else {
      // No email change
      delete updateData.email;
    }

    // Check if username is being changed and log to history
    if (data.username && data.username !== currentUser.username) {
      // Log old username to history (username becomes available for reuse)
      await this.prisma.usernameHistory.create({
        data: {
          userId,
          username: currentUser.username,
          reason: 'profile_update',
        },
      });
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: DEFAULT_ADMIN_USER_SELECT,
      });

      // If email was changed, send verification email for new email
      if (emailChanged) {
        try {
          await this.emailVerification.sendVerificationEmail(userId);
        } catch (error) {
          console.error(
            '[UsersService] Failed to send verification email for new email:',
            error instanceof Error ? error.message : 'Unknown error',
          );
          // Don't throw - email was updated, just verification email delivery failed
        }
      }

      return updatedUser;
    } catch (error: any) {
      // Handle Prisma unique constraint errors
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        // This shouldn't happen since we check above, but just in case
        throw new BadRequestException(
          'Email is already in use. Please verify your email to claim it.',
        );
      }
      throw error;
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
      select: DEFAULT_ADMIN_USER_SELECT,
    });
  }

  async deleteAccount(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete user and cascade to their posts
    return this.softDeleteUserWithCascade(userId);
  }
}
