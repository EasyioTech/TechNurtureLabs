
import { redis } from './redis';

/**
 * SCALE BREAKER C: Global Cache Invalidation Strategy
 * 
 * Implements a "Cache Tagging" pattern on top of Redis.
 * Allows invalidating groups of keys (e.g., all dashboard-related data for a user)
 * without knowing the exact keys or using expensive KEYS * scans.
 */

export const cacheService = {
  /**
   * Sets a value in cache and associates it with one or more tags.
   */
  set: async (key: string, data: any, tags: string[], ttlSeconds: number = 3600) => {
    try {
      const pipeline = redis.pipeline();
      pipeline.set(key, JSON.stringify(data), 'EX', ttlSeconds);
      
      // Map each tag to this key
      tags.forEach(tag => {
        pipeline.sadd(`tag:${tag}`, key);
        pipeline.expire(`tag:${tag}`, ttlSeconds * 2); // Tags should outlive the data
      });
      
      await pipeline.exec();
    } catch (err) {
      console.error('[Cache] Set failed:', err);
    }
  },

  /**
   * Invalidates all keys associated with a specific tag.
   */
  invalidateTag: async (tag: string) => {
    try {
      const tagKey = `tag:${tag}`;
      const keys = await redis.smembers(tagKey);
      
      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        pipeline.del(...keys);
        pipeline.del(tagKey);
        await pipeline.exec();
        console.log(`[Cache] Invalidated tag: ${tag} (${keys.length} keys)`);
      }
    } catch (err) {
      console.error('[Cache] Invalidation failed:', err);
    }
  },

  /**
   * Convenience for user-specific data invalidation
   */
  invalidateUser: (userId: string) => cacheService.invalidateTag(`user:${userId}`),
  
  /**
   * Convenience for course-specific data invalidation
   */
  invalidateCourse: (courseId: string) => cacheService.invalidateTag(`course:${courseId}`),
};
