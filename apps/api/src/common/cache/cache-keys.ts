/**
 * Centralized cache key patterns
 *
 * This file defines all cache keys used throughout the application.
 * Makes invalidation predictable and prevents key collisions.
 *
 * Usage:
 *  - CacheKeys.postsAll → "posts:all"
 *  - CacheKeys.postById("123") → "posts:123"
 *  - CacheKeys.userByUsername("john") → "users:john"
 */

export const CacheKeys = {
  // ============ POSTS ============
  posts: {
    all: 'posts:all',
    byId: (id: number) => `posts:${id}`,
    byUserId: (userId: number) => `posts:user:${userId}`,
    search: (query: string) => `posts:search:${query}`,
    searchFeed: (offset: number, limit: number) =>
      `posts:feed:offset:${offset}:limit:${limit}`,
  },

  // ============ USERS ============
  users: {
    byUsername: (username: string) => `users:${username}`,
    byId: (id: number) => `users:id:${id}`,
    profile: (username: string) => `users:profile:${username}`,
  },

  //   // ============ LIKES ============
  //   likes: {
  //     postLikeCount: (postId: number) => `likes:post:${postId}:count`,
  //     userLikes: (userId: number) => `likes:user:${userId}`,
  //     isLiked: (postId: number, userId: number) =>
  //       `likes:post:${postId}:user:${userId}`,
  //   },

  //   // ============ FEED ============
  //   feed: {
  //     all: 'feed:all',
  //     user: (userId: number) => `feed:user:${userId}`,
  //   },

  //   // ============ SESSIONS ============
  //   sessions: {
  //     user: (userId: number) => `sessions:user:${userId}`,
  //   },
};

/**
 * Cache TTL constants (in milliseconds)
 * Organize by frequency of change
 */
export const CacheTTL = {
  // Very frequently changing data
  SHORT: 30 * 1000, // 30 seconds

  // Moderately changing data
  MEDIUM: 5 * 60 * 1000, // 5 minutes

  // Slowly changing data
  LONG: 1 * 60 * 60 * 1000, // 1 hour

  // Almost never changes
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Invalidation patterns for cache.delByPattern()
 * Use these to clear related cache entries at once
 */
export const CacheInvalidationPatterns = {
  posts: 'posts:*',
  postsAll: 'posts:all',
  users: 'users:*',
  //   likes: 'likes:*',
  //   feed: 'feed:*',
  //   sessions: 'sessions:*',
};
