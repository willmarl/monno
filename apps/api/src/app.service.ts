import { QueueModule } from './modules/queue/queue.module';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { QueueService } from './modules/queue/queue.service';

@Injectable()
export class AppService {
  constructor(private queue: QueueService) {}
  getHello(): string {
    return 'Hello World!';
  }

  rateLimitTest(): string {
    return 'This request should be rate limited after 3 GETs';
  }

  async workerTest(): Promise<string> {
    await this.queue.enqueueDemo();
    return 'New job should be proccessed by bullMQ';
  }

  userOnlyTest(): string {
    return 'You should only read this if you are logged in';
  }

  adminOnlyTest(): string {
    return 'Only admin should be able to read this';
  }

  errorTest(): void {
    throw new HttpException(
      'This is a test error endpoint',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
