import { Controller, Post } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('cleanup-sessions-now')
  async triggerSessionCleanup() {
    await this.queueService.enqueueSessionCleanupNow();
    return { message: 'Session cleanup job enqueued' };
  }

  @Post('demo')
  async triggerDemo() {
    await this.queueService.enqueueDemo();
    return { message: 'Demo job enqueued' };
  }
}
