import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService implements OnModuleInit {
  public readonly jobsQueue: Queue;
  private readonly logger = new Logger(QueueService.name);

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
   * Initialize scheduled jobs on module startup
   */
  async onModuleInit() {
    await this.setupSessionCleanupJob();
  }

  /**
   * Setup recurring session cleanup job (runs every hour)
   * The actual cleanup logic is handled by the worker app
   */
  private async setupSessionCleanupJob() {
    try {
      // Remove existing job if it exists
      const existingJobs = await this.jobsQueue.getRepeatableJobs();
      const existingCleanup = existingJobs.find(
        (j) => j.name === 'session-cleanup',
      );
      if (existingCleanup) {
        await this.jobsQueue.removeRepeatableByKey(existingCleanup.key);
      }

      // Add new recurring job: cleanup expired sessions every hour
      await this.jobsQueue.add(
        'session-cleanup',
        {},
        {
          repeat: {
            pattern: '0 * * * *', // Every hour at :00
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(
        'Session cleanup job scheduled (every hour). Worker will process it.',
      );
    } catch (error) {
      this.logger.error('Failed to setup session cleanup job:', error);
    }
  }

  /**
   * Enqueue a session cleanup job immediately (for testing)
   */
  async enqueueSessionCleanupNow(): Promise<void> {
    await this.jobsQueue.add('session-cleanup', {});
  }

  /**
   * Enqueue an avatar processing job
   */
  async enqueueDemo(): Promise<void> {
    await this.jobsQueue.add('demo', {});
  }

  /**
   * Get the jobs queue instance (for Bull Board)
   */
  getJobsQueue(): Queue {
    return this.jobsQueue;
  }
}
