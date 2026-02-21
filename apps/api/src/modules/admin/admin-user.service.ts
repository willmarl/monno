import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
import {
  UserSearchDto,
  UserSearchCursorDto,
} from '../users/dto/search-user.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { FileProcessingService } from '../../common/file-processing/file-processing.service';
import { uploadLocation } from '../../common/file-processing/upload-location';

/**
 * Admin User Service
 * Handles admin operations for user management
 */

const DEFAULT_USER_SELECT = {
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

@Injectable()
export class AdminUserService {
  constructor(
    private prisma: PrismaService,
    private adminService: AdminService,
    private usersService: UsersService,
    private fileProcessing: FileProcessingService,
  ) {}

  // ===== USER MANAGEMENT =====

  /**
   * Get single user by ID with full details
   */
  async findById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        posts: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Log the view action
    await this.adminService.log({
      adminId: 0, // Will be set by controller
      action: 'USER_VIEWED',
      resource: 'USER',
      resourceId: userId.toString(),
      description: `Admin viewed user profile for ${user.username}`,
    });

    return user;
  }

  /**
   * Search users with offset pagination
   * Supports filtering by text search (username, email) and categorical filters (role, status)
   */
  async search(searchDto: UserSearchDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const roles = searchDto.getRoles();
    const statuses = searchDto.getStatuses();
    const orderBy = searchDto.getOrderBy();

    // Build text search conditions
    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    // Build filter conditions
    const filterConditions: any[] = [];

    if (roles.length > 0) {
      filterConditions.push({ role: { in: roles as any } });
    }

    if (statuses.length > 0) {
      filterConditions.push({ status: { in: statuses as any } });
    }

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.user,
      limit: searchDto.limit ?? 10,
      offset: searchDto.offset ?? 0,
      query: {
        where,
        orderBy,
        select: DEFAULT_USER_SELECT,
      },
      countQuery: { where },
    });

    return {
      items,
      pageInfo,
      ...(isRedirected && { isRedirected: true }),
    };
  }

  /**
   * Search users with cursor pagination
   * Supports filtering by text search (username, email) and categorical filters (role, status)
   */
  async searchCursor(searchDto: UserSearchCursorDto) {
    const searchFields = searchDto.getSearchFields();
    const searchOptions = searchDto.getSearchOptions();
    const roles = searchDto.getRoles();
    const statuses = searchDto.getStatuses();
    const orderBy = searchDto.getOrderBy();

    // Build text search conditions
    const textSearchWhere = buildSearchWhere({
      query: searchDto.query ?? '',
      fields: searchFields,
      options: searchOptions,
    });

    // Build filter conditions
    const filterConditions: any[] = [];

    if (roles.length > 0) {
      filterConditions.push({ role: { in: roles as any } });
    }

    if (statuses.length > 0) {
      filterConditions.push({ status: { in: statuses as any } });
    }

    // Combine text search and filters
    const where = {
      ...(Object.keys(textSearchWhere).length > 0 && textSearchWhere),
      ...(filterConditions.length > 0 && {
        AND: filterConditions,
      }),
    };

    const { items, nextCursor } = await cursorPaginate({
      model: this.prisma.user,
      limit: searchDto.limit ?? 10,
      cursor: searchDto.cursor,
      query: {
        where,
        orderBy,
        select: DEFAULT_USER_SELECT,
      },
    });

    return {
      items,
      nextCursor,
    };
  }

  /**
   * Update user (handles role, status, and general fields)
   */
  async update(
    userId: number,
    data: UpdateUserAdminDto,
    file?: any,
    adminId?: number,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // Handle avatar file upload
    if (file) {
      try {
        if (user.avatarPath) {
          await this.fileProcessing.deleteFile(user.avatarPath);
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

    const updateData: any = { ...data };

    // Track changes for audit log
    const changes: Record<string, any> = {};

    if (data.username && data.username !== user.username) {
      changes.username = { from: user.username, to: data.username };

      // Log old username to history
      await this.prisma.usernameHistory.create({
        data: {
          userId,
          username: user.username,
          reason: 'admin_change',
        },
      });
    }

    if (data.role && data.role !== user.role) {
      changes.role = { from: user.role, to: data.role };
    }

    if (data.status && data.status !== user.status) {
      changes.status = { from: user.status, to: data.status };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: DEFAULT_USER_SELECT,
    });

    // Log the update if any changes were made
    if (adminId && Object.keys(changes).length > 0) {
      await this.adminService.log({
        adminId,
        action: 'USER_UPDATED',
        resource: 'USER',
        resourceId: userId.toString(),
        targetId: userId,
        description: `Admin updated user ${user.username}`,
        changes,
      });
    }

    return updated;
  }

  /**
   * Delete user (soft delete with cascade)
   */
  async delete(userId: number, adminId: number, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const deleted = await this.usersService.softDeleteUserWithCascade(
      userId,
      reason || 'admin_deletion',
    );

    // Log the deletion
    await this.adminService.log({
      adminId,
      action: 'USER_DELETED',
      resource: 'USER',
      resourceId: userId.toString(),
      targetId: userId,
      description: `Admin deleted user ${user.username}`,
      changes: {
        status: { from: user.status, to: 'DELETED' },
      },
    });

    return deleted;
  }

  /**
   * Reset user password (generates temporary password)
   */
  async resetPassword(
    userId: number,
    adminId: number,
    ipAddress?: string,
  ): Promise<{ tempPassword: string; message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Generate temporary password
    const tempPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all sessions to force re-login
    await this.prisma.session.updateMany({
      where: { userId },
      data: { isValid: false },
    });

    // Log the action
    await this.adminService.log({
      adminId,
      action: 'USER_PASSWORD_RESET',
      resource: 'USER',
      resourceId: userId.toString(),
      targetId: userId,
      description: `Admin reset password for user ${user.username}`,
      ipAddress,
    });

    return {
      tempPassword,
      message: `Temporary password generated. User must change it on next login.`,
    };
  }

  // ===== UTILITY METHODS ====

  /**
   * Generate a secure random password
   */
  private generatePassword(length: number = 16): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
