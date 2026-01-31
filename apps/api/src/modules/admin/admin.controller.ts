import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===== AUDIT LOGS =====

  @ApiOperation({ summary: 'Get audit logs (admin only)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({
    name: 'adminId',
    required: false,
    description: 'Filter by admin who performed action',
    type: Number,
  })
  @ApiQuery({
    name: 'targetId',
    required: false,
    description: 'Filter by target user',
    type: Number,
  })
  @ApiQuery({
    name: 'resource',
    required: false,
    description: 'Filter by resource type (USER, ADMIN, POST, etc)',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by action (USER_UPDATED, USER_DELETED, etc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get('logs')
  getLogs(
    @Query() pagination: PaginationDto,
    @Query('adminId') adminId?: string,
    @Query('targetId') targetId?: string,
    @Query('resource') resource?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getLogs(pagination, {
      adminId: adminId ? parseInt(adminId) : undefined,
      targetId: targetId ? parseInt(targetId) : undefined,
      resource,
      action,
    });
  }

  // ===== DASHBOARD STATS =====

  @ApiOperation({ summary: 'Get dashboard stats (admin only)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats including system, user, and post metrics',
    schema: {
      example: {
        system: {
          cpuUsage: 45.2,
          ramUsage: 62.1,
          totalRamGb: 15.75,
          usedRamGb: 9.78,
          uptime: 86400,
          cpuCores: 8,
        },
        users: {
          total: 1250,
          byStatus: {
            active: 1180,
            suspended: 35,
            banned: 30,
            deleted: 5,
          },
          unverifiedEmails: 48,
        },
        posts: {
          total: 5420,
          published: 5395,
          deleted: 25,
        },
        timestamp: '2026-01-31T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }
}
