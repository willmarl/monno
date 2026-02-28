import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  HttpCode,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { PrismaService } from '../../prisma.service';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all active sessions for the current user' })
  @ApiResponse({ status: 200, description: 'List of sessions' })
  async listSessions(@Req() req) {
    const userId = req.user.sub;

    const sessions = await this.prisma.session.findMany({
      where: { userId, isValid: true },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
        isValid: true,
        // Geolocation fields
        location: true,
        country: true,
        latitude: true,
        longitude: true,
        // Risk scoring fields
        riskScore: true,
        isNewLocation: true,
        isNewDevice: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return sessions;
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Revoke a specific session (log out from a device)',
  })
  @ApiResponse({ status: 204, description: 'Session revoked successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - session does not belong to user',
  })
  async revokeSingle(@Req() req, @Param('id') sessionId: string) {
    const userId = req.user.sub;

    // Ensure user owns this session
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to revoke this session',
      );
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isValid: false },
    });

    return { success: true, message: 'Session revoked' };
  }
}
