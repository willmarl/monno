import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { offsetPaginate } from 'src/common/pagination/offset-pagination';
import * as os from 'os';

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
   * Get audit logs with pagination
   */
  async getLogs(pag: PaginationDto) {
    const where: any = {};

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

  // ===== STATS & METRICS =====

  /**
   * Get system metrics (CPU, RAM, uptime)
   */
  private getSystemStats() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Get CPU load average
    const loadAverage = os.loadavg();
    const cpuCount = os.cpus().length;
    const cpuUsagePercent = (loadAverage[0] / cpuCount) * 100;

    // Get uptime in seconds
    const uptime = process.uptime();

    return {
      cpuUsage: Math.round(cpuUsagePercent * 10) / 10, // 1 decimal place
      ramUsage: Math.round(memoryUsagePercent * 10) / 10,
      totalRamGb: Math.round((totalMemory / 1024 / 1024 / 1024) * 100) / 100,
      usedRamGb: Math.round((usedMemory / 1024 / 1024 / 1024) * 100) / 100,
      uptime,
      cpuCores: cpuCount,
    };
  }

  /**
   * Get user statistics broken down by status and other metrics
   */
  private async getUserStats() {
    const [total, active, suspended, banned, deleted, unverified] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: 'ACTIVE' } }),
        this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
        this.prisma.user.count({ where: { status: 'BANNED' } }),
        this.prisma.user.count({ where: { status: 'DELETED' } }),
        this.prisma.user.count({ where: { isEmailVerified: false } }),
      ]);

    return {
      total,
      byStatus: {
        active,
        suspended,
        banned,
        deleted,
      },
      unverifiedEmails: unverified,
    };
  }

  /**
   * Get post statistics including published and deleted counts
   * Deleted posts can indicate content moderation/removal patterns
   */
  private async getPostStats() {
    const [total, published, deletedCount] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.count({ where: { deleted: false } }),
      this.prisma.post.count({ where: { deleted: true } }),
    ]);

    return {
      total,
      published,
      deleted: deletedCount,
    };
  }

  /**
   * Get all dashboard stats (system metrics + user stats + post stats)
   */
  async getStats() {
    const [systemStats, userStats, postStats] = await Promise.all([
      Promise.resolve(this.getSystemStats()),
      this.getUserStats(),
      this.getPostStats(),
    ]);

    return {
      system: systemStats,
      users: userStats,
      posts: postStats,
      timestamp: new Date().toISOString(),
    };
  }

  // ===== FUTURE ADDITIONS =====
  // - getUserStats()
  // - getPostStats()
}
