import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Keyv from 'keyv';
import KeyvRedis from 'keyv-redis';
import { createClient, RedisClientType } from 'redis';

/**
 * CacheService - Modern Redis caching using Keyv
 *
 * Features:
 * - Type-safe generic caching
 * - Automatic TTL management
 * - JSON serialization/deserialization
 * - Connection lifecycle management
 * - Easy invalidation patterns
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private keyv!: Keyv<any>;
  private redisClient!: RedisClientType;
  private logger = new Logger(CacheService.name);

  async onModuleInit() {
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = Number(process.env.REDIS_PORT) || 6379;
      const redisNamespace = process.env.REDIS_NAMESPACE || 'app';

      this.logger.log(`Connecting to Redis at ${redisHost}:${redisPort}`);
      this.logger.log(`Redis namespace: ${redisNamespace}`);

      // Create Redis client
      this.redisClient = createClient({
        socket: {
          host: redisHost,
          port: redisPort,
        },
      });

      // Connect to Redis
      await this.redisClient.connect();
      this.logger.log('✓ Redis connected successfully');

      // Test connection
      const pong = await this.redisClient.ping();
      this.logger.log(`✓ Redis ping response: ${pong}`);

      // Initialize Keyv with Redis adapter
      this.keyv = new Keyv({
        store: new KeyvRedis(this.redisClient),
        namespace: redisNamespace,
      });

      this.logger.log('✓ Keyv cache initialized with Redis adapter');
    } catch (error) {
      this.logger.error('Failed to initialize cache', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        this.logger.log('Redis connection closed');
      }
    } catch (error) {
      this.logger.error('Error closing Redis connection', error);
    }
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.keyv.get(key);
      if (value) {
        this.logger.debug(`✓ Cache HIT: ${key}`);
        return value;
      } else {
        this.logger.debug(`✗ Cache MISS: ${key}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      this.logger.log(`Attempting to SET cache key: ${key} with TTL: ${ttl}ms`);
      const result = await this.keyv.set(key, value, ttl);
      this.logger.log(
        `✓ Cache SET successful: ${key} (TTL: ${ttl ? ttl + 'ms' : 'none'})`,
      );
      this.logger.log(`SET result: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error(`❌ Cache SET FAILED for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Delete a key from cache
   * @param key - Cache key
   */
  async del(key: string): Promise<boolean> {
    try {
      return await this.keyv.delete(key);
    } catch (error) {
      this.logger.error(`Cache delete error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys from cache
   * @param keys - Array of cache keys
   */
  async delMany(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => this.keyv.delete(key)));
    } catch (error) {
      this.logger.error(`Cache delete many error`, error);
    }
  }

  /**
   * Delete all keys matching a pattern
   * @param pattern - Pattern to match (e.g., "posts:*")
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisClient.keys(
        `${process.env.REDIS_NAMESPACE || 'app'}:${pattern}`,
      );
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (error) {
      this.logger.error(
        `Cache delete by pattern error for pattern: ${pattern}`,
        error,
      );
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    try {
      await this.keyv.clear();
    } catch (error) {
      this.logger.error('Cache clear error', error);
    }
  }

  /**
   * Get or set pattern - get from cache or fetch via callback
   * @param key - Cache key
   * @param callback - Function to execute if not cached
   * @param ttl - Time to live in milliseconds (optional)
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const value = await callback();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Cache getOrSet error for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Check if key exists
   * @param key - Cache key
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.keyv.get(key);
      return value !== undefined;
    } catch (error) {
      this.logger.error(`Cache has error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Get Redis client for advanced operations
   */
  getRedisClient(): RedisClientType {
    return this.redisClient;
  }
}
