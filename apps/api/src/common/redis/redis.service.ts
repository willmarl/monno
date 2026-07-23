import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;
  private ready = false;

  get namespace(): string {
    return process.env.REDIS_NAMESPACE || 'app';
  }

  key(...parts: string[]): string {
    return [this.namespace, ...parts].join(':');
  }

  isReady(): boolean {
    return this.ready && !!this.client;
  }

  /** Raw client when connected; null if Redis is unavailable. */
  getClient(): RedisClientType | null {
    return this.ready ? this.client : null;
  }

  async onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;

    try {
      this.client = createClient({
        socket: { host, port },
      });
      this.client.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}`);
        this.ready = false;
      });
      await this.client.connect();
      this.ready = true;
      this.logger.log(`Redis connected (${host}:${port}, ns=${this.namespace})`);
    } catch (err: any) {
      this.logger.warn(
        `Redis unavailable — guest presence disabled (${err?.message ?? err})`,
      );
      this.client = null;
      this.ready = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // ignore
      }
      this.client = null;
      this.ready = false;
    }
  }
}
