import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';

export interface AuditLogInput {
  adminId: number;
  action: string; // e.g., "USER_BANNED", "POST_DELETED"
  resource: string; // e.g., "USER", "POST", "CONTENT"
  resourceId?: string;
  targetId?: number;
  description?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Admin Service
 * Centralized service for all admin operations:
 * - Audit logging
 * - User statistics and server metrics (future)
 * - General admin operations
 */
@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ===== AUDIT LOGGING =====

  /**
   * Log an admin action
   */
  async log(input: AuditLogInput) {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminId: input.adminId,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          targetId: input.targetId,
          description: input.description,
          changes: input.changes,
          ipAddress: input.ipAddress,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit logging shouldn't break the operation
      console.error('[AuditLog] Failed to log action:', error);
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getLogs(
    pag: PaginationDto,
    filter?: {
      adminId?: number;
      targetId?: number;
      resource?: string;
      action?: string;
    },
  ) {
    const where: any = {};
    if (filter?.adminId) where.adminId = filter.adminId;
    if (filter?.targetId) where.targetId = filter.targetId;
    if (filter?.resource) where.resource = filter.resource;
    if (filter?.action) where.action = filter.action;

    const { items, pageInfo, isRedirected } = await offsetPaginate({
      model: this.prisma.auditLog,
      limit: pag.limit ?? 50,
      offset: pag.offset ?? 0,
      query: {
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, username: true, email: true },
          },
          target: {
            select: { id: true, username: true, email: true },
          },
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

  // ===== STATS & METRICS (Future) =====
  // Will add:
  // - getServerStats()
  // - getUserStats()
  // - getPostStats()
  // - getDashboardMetrics()
}
