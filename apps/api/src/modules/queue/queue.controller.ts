import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Queue')
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles('ADMIN')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('cleanup-sessions-now')
  @ApiOperation({
    summary: 'Trigger session cleanup immediately',
    description:
      'Enqueues a job to delete all expired sessions from the database',
  })
  @ApiResponse({
    status: 201,
    description: 'Session cleanup job successfully enqueued',
    schema: {
      example: { message: 'Session cleanup job enqueued' },
    },
  })
  async triggerSessionCleanup() {
    await this.queueService.enqueueSessionCleanupNow();
    return { message: 'Session cleanup job enqueued' };
  }

  @Post('demo')
  @ApiOperation({
    summary: 'Trigger demo job',
    description: 'Enqueues a demo job for testing the queue system',
  })
  @ApiResponse({
    status: 201,
    description: 'Demo job successfully enqueued',
    schema: {
      example: { message: 'Demo job enqueued' },
    },
  })
  async triggerDemo() {
    await this.queueService.enqueueDemo();
    return { message: 'Demo job enqueued' };
  }
}
