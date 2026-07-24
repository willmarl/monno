import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { AdminService } from '../admin.service';
import { UsersService } from '../../users/users.service';
import { UpdateUserAdminDto } from '../dto/update-user-admin.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import { CursorPaginationDto } from 'src/common/pagination/dto/cursor-pagination.dto';
import { cursorPaginate } from 'src/common/pagination/cursor-pagination';
import {
  UserSearchDto,
  UserSearchCursorDto,
} from '../../users/dto/search-user.dto';
import { buildSearchWhere } from 'src/common/search/search.utils';
import { FileProcessingService } from '../../../common/file-processing/file-processing.service';
import { AlreadyDeletedException } from 'src/common/exceptions/already-deleted.exception';
import { AdminViewHistoryQueryDto } from './dto/admin-view-history-query.dto';
import { AccountStatusEmailService } from '../../../common/email/account-status-email.service';

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
    private accountStatusEmail: AccountStatusEmailService,
  ) {}

  // ===== USER MANAGEMENT =====

  /**
   * Lightweight username suggestions for admin pickers.
   * Includes any account status (ACTIVE / SUSPENDED / BANNED / DELETED).
   */
  async searchSuggest(q: string, limit: number) {
    if (!q?.trim()) return [];

    const take = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 20) : 5;

    return this.prisma.user.findMany({
      where: {
        username: { contains: q.trim(), mode: 'insensitive' },
      },
      select: {
        id: true,
        username: true,
        avatarPath: true,
        status: true,
        deleted: true,
      },
      orderBy: { username: 'asc' },
      take,
    });
  }

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
    let avatarPath: string | undefined;
    if (file) {
      try {
        if (user.avatarPath) {
          await this.fileProcessing.deleteFile(user.avatarPath);
        }

        avatarPath = await this.fileProcessing.processFile(
          file,
          'avatar',
          userId,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to process avatar file';
        throw new BadRequestException(errorMessage);
      }
    }

    const updateData: any = { ...data };
    if (avatarPath) {
      updateData.avatarPath = avatarPath;
    }
    if (data.statusExpireAt !== undefined) {
      updateData.statusExpireAt =
        data.statusExpireAt === null ? null : new Date(data.statusExpireAt);
    }

    // Track changes for audit log
    const changes: Record<string, any> = {};
    const usernameChanging =
      !!data.username && data.username !== user.username;

    if (usernameChanging) {
      changes.username = { from: user.username, to: data.username };
      const taken = await this.prisma.user.findUnique({
        where: { username: data.username! },
        select: { id: true },
      });
      if (taken) {
        throw new ConflictException('Username is already taken');
      }
    }

    if (data.email && data.email !== user.email) {
      const emailTaken = await this.prisma.user.findFirst({
        where: {
          email: { equals: data.email, mode: 'insensitive' },
          NOT: { id: userId },
        },
        select: { id: true },
      });
      if (emailTaken) {
        throw new ConflictException('Email is already in use');
      }
    }

    if (data.role && data.role !== user.role) {
      changes.role = { from: user.role, to: data.role };
    }

    if (data.status && data.status !== user.status) {
      changes.status = { from: user.status, to: data.status };
    }

    let updated;
    try {
      updated = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: DEFAULT_USER_SELECT,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error?.meta?.target;
        if (
          (Array.isArray(target) && target.includes('username')) ||
          target === 'username'
        ) {
          throw new ConflictException('Username is already taken');
        }
        if (
          (Array.isArray(target) && target.includes('email')) ||
          target === 'email'
        ) {
          throw new ConflictException('Email is already in use');
        }
      }
      throw error;
    }

    // Log old username after a successful rename (avoid orphan history on conflict)
    if (usernameChanging) {
      await this.prisma.usernameHistory.create({
        data: {
          userId,
          username: user.username,
          reason: 'admin_change',
        },
      });
    }

    // Restrictive status changes kill existing sessions immediately
    if (
      data.status &&
      data.status !== 'ACTIVE' &&
      data.status !== user.status
    ) {
      await this.prisma.session.updateMany({
        where: { userId, isValid: true },
        data: { isValid: false },
      });
    }

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

    if (data.status && data.status !== user.status) {
      await this.accountStatusEmail.sendIfPossible({
        username: updated.username,
        email: updated.email ?? user.email,
        previousStatus: user.status,
        newStatus: data.status,
        reason:
          data.statusReason !== undefined
            ? data.statusReason
            : updated.statusReason,
        expireAt: updated.statusExpireAt,
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

    // Check if user is already deleted
    if (user.status === 'DELETED') {
      throw new AlreadyDeletedException('User was already deleted');
    }

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

    await this.accountStatusEmail.sendIfPossible({
      username: user.username,
      email: user.email,
      previousStatus: user.status,
      newStatus: 'DELETED',
      reason: reason || 'admin_deletion',
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

  async fetchUsernameHistory(userId: number, pag: PaginationDto) {
    const where = { userId: userId };
    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.usernameHistory,
      limit: pag.limit ?? 10,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { id: 'desc' } as const,
        select: {
          id: true,
          freedAt: true,
          reason: true,
          username: true,
          userId: true,
        },
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
   * Admin audit view of a user's ViewHistory (includes soft-deleted rows).
   * No visibility filter — private/deleted resources still surface when present.
   */
  async fetchViewHistory(userId: number, queryDto: AdminViewHistoryQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const { resourceType } = queryDto;
    const limit = queryDto.limit ?? 10;
    const offset = queryDto.offset ?? 0;
    const status = queryDto.status ?? 'all';

    const historyRows = await this.prisma.viewHistory.findMany({
      where: {
        userId,
        resourceType,
        ...(status === 'active'
          ? { deleted: false }
          : status === 'cleared'
            ? { deleted: true }
            : {}),
      },
      orderBy: { viewedAt: 'desc' },
      select: {
        id: true,
        resourceId: true,
        resourceType: true,
        viewedAt: true,
        createdAt: true,
        deleted: true,
        deletedAt: true,
      },
    });

    if (historyRows.length === 0) {
      return {
        user: { id: user.id, username: user.username },
        items: [],
        pageInfo: {
          totalItems: 0,
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      };
    }

    const ids = historyRows.map((row) => row.resourceId);
    const search = (queryDto.query ?? '').trim().toLowerCase();

    const resourceById = new Map<number, any>();

    if (resourceType === 'POST') {
      const posts = await this.prisma.post.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          deleted: true,
          deletedAt: true,
          visibility: true,
          viewCount: true,
          likeCount: true,
          creator: {
            select: { id: true, username: true, avatarPath: true },
          },
        },
      });
      for (const post of posts) resourceById.set(post.id, post);
    } else {
      const articles = await this.prisma.article.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          title: true,
          content: true,
          status: true,
          createdAt: true,
          deleted: true,
          deletedAt: true,
          viewCount: true,
          likeCount: true,
          creator: {
            select: { id: true, username: true, avatarPath: true },
          },
        },
      });
      for (const article of articles) resourceById.set(article.id, article);
    }

    let items = historyRows.map((row) => ({
      historyId: row.id,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      viewedAt: row.viewedAt,
      createdAt: row.createdAt,
      deleted: row.deleted,
      deletedAt: row.deletedAt,
      resource: resourceById.get(row.resourceId) ?? null,
    }));

    if (search) {
      items = items.filter((item) => {
        const title = item.resource?.title?.toLowerCase() ?? '';
        const content = item.resource?.content?.toLowerCase() ?? '';
        return title.includes(search) || content.includes(search);
      });
    }

    const total = items.length;
    const pageItems = items.slice(offset, offset + limit);

    return {
      user: { id: user.id, username: user.username },
      items: pageItems,
      pageInfo: {
        totalItems: total,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async restore(userId: number, adminId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already active
    if (user.status !== 'DELETED' || !user.deleted) {
      throw new BadRequestException(
        'User is not deleted and cannot be restored',
      );
    }

    const restored = await this.usersService.restoreUserWithCascade(userId);

    // Log the restoration
    await this.adminService.log({
      adminId,
      action: 'USER_RESTORED',
      resource: 'USER',
      resourceId: userId.toString(),
      targetId: userId,
      description: `Admin restored user ${user.username}`,
      changes: {
        status: { from: user.status, to: 'ACTIVE' },
        username: { from: user.username, to: restored.username },
      },
    });

    await this.accountStatusEmail.sendIfPossible({
      username: restored.username,
      email: restored.email ?? user.email,
      previousStatus: user.status,
      newStatus: 'ACTIVE',
      reason: 'admin_restore',
    });

    return restored;
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
