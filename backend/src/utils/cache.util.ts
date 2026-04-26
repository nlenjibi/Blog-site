import { redis } from '@/config/redis';
import { logger } from './logger.util';

/**
 * Redis Cache Service
 * Provides standardized caching with TTL support
 */
export class CacheService {
  private prefix: string = 'cache:';

  /**
   * Generate cache key with prefix
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  /**
   * Set item in cache with TTL (seconds)
   */
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(this.getKey(key), ttl, serialized);
    } catch (error) {
      logger.error('Cache set error:', { key, error });
    }
  }

  /**
   * Delete specific cache key
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(this.getKey(key));
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(this.getKey(pattern));
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', { pattern, error });
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', { key, error });
      return false;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    try {
      return await redis.incr(this.getKey(key));
    } catch (error) {
      logger.error('Cache increment error:', { key, error });
      return 0;
    }
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(this.getKey(key));
    } catch (error) {
      logger.error('Cache TTL error:', { key, error });
      return -1;
    }
  }

  /**
   * Clear all cache keys with prefix
   */
  async flush(): Promise<void> {
    try {
      const keys = await redis.keys(this.getKey('*'));
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Flushed ${keys.length} cache keys`);
      }
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }
}

/**
 * Cache key generators for common queries
 */
export const cacheKeys = {
  // Post keys
  post: (slug: string) => `post:${slug}`,
  postsList: (page: number, limit: number, category?: string) =>
    `posts:page=${page}:limit=${limit}:category=${category || 'all'}`,

  // User keys
  user: (userId: string) => `user:${userId}`,
  userProfile: (email: string) => `profile:${email}`,

  // AI keys
  aiSummary: (postId: string) => `ai:summary:${postId}`,
  aiRecommendations: (userId: string) => `ai:recommendations:${userId}`,

  // Category keys
  categories: () => 'categories:all',

  // Tag keys
  tags: () => 'tags:all',

  // Popular content
  popularPosts: (period: 'week' | 'month' | 'all') => `posts:popular:${period}`,
};

export const cacheService = new CacheService();
