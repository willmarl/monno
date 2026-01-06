import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private fileProcessing: FileProcessingService,
    private emailVerification: EmailVerificationService,
  ) {}
  //==============
  //   Admin
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
      return await this.prisma.user.create({
        data: {
          ...data,
          password: hashed,
        },
        select: {
          id: true,
          username: true,
          avatarPath: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          isEmailVerified: true,
        },
      });
    } catch (error: any) {
      // Handle Prisma unique constraint errors
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        throw new BadRequestException('Email is already in use');
      }
      throw error;
    }
  }

  async findAll(pag: PaginationDto) {
    const { items, pageInfo } = await offsetPaginate({
      model: this.prisma.user,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          avatarPath: true,
          email: true,
          tempEmail: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          isEmailVerified: true,
        },
      },
    });

    return {
      items,
      pageInfo,
    };
  }

  async findAllCursor(userId: number | null, pag: CursorPaginationDto) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.user,
      limit: limit ?? 10,
      cursor,
      query: {
        orderBy: { createdAt: 'desc' },

        select: {
          id: true,
          username: true,
          avatarPath: true,
          email: true,
          tempEmail: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          isEmailVerified: true,
        },
      },
    });

    return {
      items,
      nextCursor: nextCursor,
    };
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        tempEmail: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: number, data: UpdateUserDto, file?: any) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // If file is provided, process it using FileProcessingService
    if (file) {
      try {
        // Get the current user to retrieve old avatar path
        const currentUser = await this.prisma.user.findUnique({
          where: { id },
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
          id,
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

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        tempEmail: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isEmailVerified: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        tempEmail: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isEmailVerified: true,
      },
    });
  }

  //--------------
  //   Search
  //--------------

  async searchAll(searchDto: UserSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { items, pageInfo } = await offsetPaginate({
      model: this.prisma.user,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          avatarPath: true,
          email: true,
          tempEmail: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          isEmailVerified: true,
        },
      },
    });

    return {
      items,
      pageInfo,
    };
  }

  async searchAllCursor(searchDto: UserSearchCursorDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { cursor, limit } = searchDto;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.post,
      limit: limit ?? 10,
      cursor,
      query: {
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          avatarPath: true,
          email: true,
          tempEmail: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          isEmailVerified: true,
        },
      },
    });

    return {
      items,
      nextCursor,
    };
  }

  async searchSuggest(q: string, limit: number) {
    if (!q) return [];

    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        tempEmail: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        isEmailVerified: true,
      },
      take: limit,
    });
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

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarPath: true,
      },
    });
  }

  async findAllPublic(pag: PaginationDto) {
    const { items, pageInfo } = await offsetPaginate({
      model: this.prisma.user,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          avatarPath: true,
        },
      },
    });

    return {
      items,
      pageInfo,
    };
  }

  async findAllCursorPublic(userId: number | null, pag: CursorPaginationDto) {
    const { cursor, limit } = pag;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.user,
      limit: limit ?? 10,
      cursor,
      query: {
        orderBy: { createdAt: 'desc' },

        select: {
          id: true,
          username: true,
          avatarPath: true,
        },
      },
    });

    return {
      items,
      nextCursor: nextCursor,
    };
  }

  //--------------
  //   Search
  //--------------

  async searchSuggestPublic(q: string, limit: number) {
    if (!q) return [];

    return this.prisma.user.findMany({
      where: {
        OR: [{ username: { contains: q, mode: 'insensitive' } }],
      },
      select: {
        id: true,
        username: true,
        avatarPath: true,
      },
      take: limit,
    });
  }

  async searchAllPublic(searchDto: UserSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { items, pageInfo } = await offsetPaginate({
      model: this.prisma.user,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          avatarPath: true,
        },
      },
    });

    return {
      items,
      pageInfo,
    };
  }

  async searchAllCursorPublic(searchDto: UserSearchCursorDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();

    const where = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    const { cursor, limit } = searchDto;

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.post,
      limit: limit ?? 10,
      cursor,
      query: {
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          avatarPath: true,
        },
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
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          avatarPath: true,
          email: true,
          tempEmail: true,
          createdAt: true,
          role: true,
          isEmailVerified: true,
        },
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
      select: {
        id: true,
        username: true,
        avatarPath: true,
        email: true,
        tempEmail: true,
        createdAt: true,
        role: true,
        isEmailVerified: true,
      },
    });
  }
}
