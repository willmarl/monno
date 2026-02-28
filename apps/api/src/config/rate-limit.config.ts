/**
 * Rate Limiting Configuration
 * Define rate limit tiers that can be used across the application
 * All values are configurable via environment variables
 */

export const rateLimitConfig = {
  /**
   * Strict - For sensitive operations like payment, password changes
   * Default: 5 requests per minute
   */
  strict: {
    limit: parseInt(process.env.THROTTLE_STRICT_LIMIT || '5', 10),
    ttl: 60000,
  },

  /**
   * Normal - For standard authenticated endpoints
   * Default: 10 requests per minute
   */
  normal: {
    limit: parseInt(process.env.THROTTLE_NORMAL_LIMIT || '10', 10),
    ttl: 60000,
  },

  /**
   * Lenient - For read operations and user-generated content
   * Default: 20 requests per minute
   */
  lenient: {
    limit: parseInt(process.env.THROTTLE_LENIENT_LIMIT || '20', 10),
    ttl: 60000,
  },

  /**
   * Very Lenient - For frequent operations like likes and views
   * Default: 30 requests per minute
   */
  veryLenient: {
    limit: parseInt(process.env.THROTTLE_VERY_LENIENT_LIMIT || '30', 10),
    ttl: 60000,
  },
};
