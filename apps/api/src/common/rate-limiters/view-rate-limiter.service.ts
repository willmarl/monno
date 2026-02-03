import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

interface ViewCacheEntry {
  timestamp: number;
}

@Injectable()
export class ViewRateLimiterService implements OnModuleInit, OnModuleDestroy {
  private cache = new Map<string, ViewCacheEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly WINDOW_MS = 5 * 60 * 1000; // 5 minute window
  private readonly CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // Cleanup every 10 minutes

  onModuleInit() {
    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    // Clear the interval on app shutdown
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }

  /**
   * Check if a view should be counted based on rate limiting
   * Returns true if view should be counted, false if rate limited
   * Rate limit is PER RESOURCE per user/IP (not global)
   */
  isViewAllowed(
    userId: number | undefined,
    ipAddress: string,
    resourceType: string,
    resourceId: number,
  ): boolean {
    // Key includes resource to allow viewing different posts, prevent spam on same post
    const userKey = userId ? `user:${userId}` : `ip:${ipAddress}`;
    const key = `${userKey}:${resourceType}:${resourceId}`;
    const now = Date.now();
    const cached = this.cache.get(key);

    // If entry exists and still within window, it's rate limited
    if (cached && now - cached.timestamp < this.WINDOW_MS) {
      return false; // Don't count this view
    }

    // Update or create entry
    this.cache.set(key, { timestamp: now });
    return true; // Count this view
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.WINDOW_MS) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[ViewRateLimiter] Cleaned up ${removed} expired entries`);
    }
  }

  /**
   * Get cache stats (useful for debugging)
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      windowMinutes: this.WINDOW_MS / 60000,
      cleanupIntervalMinutes: this.CLEANUP_INTERVAL_MS / 60000,
    };
  }
}
