import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/common/redis/redis.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidAnonId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function getActiveNowWindowMs(): number {
  return parseInt(
    process.env.ACTIVE_NOW_WINDOW_MS || String(5 * 60 * 1000),
    10,
  );
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Refresh guest presence TTL in Redis. No-op if Redis is down.
   */
  async touchGuest(anonId: string): Promise<void> {
    if (!isValidAnonId(anonId)) return;

    const client = this.redis.getClient();
    if (!client) return;

    const ttlSeconds = Math.max(1, Math.round(getActiveNowWindowMs() / 1000));
    const key = this.redis.key('presence', 'guest', anonId);

    try {
      await client.set(key, '1', { EX: ttlSeconds });
    } catch (err: any) {
      this.logger.warn(`touchGuest failed: ${err?.message ?? err}`);
    }
  }

  /**
   * Count guest keys still within the active-now window (Redis TTL).
   */
  async countGuests(): Promise<number> {
    const client = this.redis.getClient();
    if (!client) return 0;

    const pattern = this.redis.key('presence', 'guest', '*');
    let count = 0;

    try {
      for await (const key of client.scanIterator({
        MATCH: pattern,
        COUNT: 100,
      })) {
        if (Array.isArray(key)) count += key.length;
        else count += 1;
      }
    } catch (err: any) {
      this.logger.warn(`countGuests failed: ${err?.message ?? err}`);
      return 0;
    }

    return count;
  }
}
