import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  public readonly jobsQueue: Queue;

  constructor() {
    // Single generic 'jobs' queue that handles all job types
    // Worker listens to this queue and dispatches based on job.name
    this.jobsQueue = new Queue('jobs', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    });
  }

  /**
   * Enqueue an avatar processing job
   */
  async enqueueDemo(): Promise<void> {
    await this.jobsQueue.add('demo', {});
  }
}
