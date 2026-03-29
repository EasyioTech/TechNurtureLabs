
import { redis } from './redis';

/**
 * Simple Redis-based rate limiter for Node.js environments.
 * 
 * Usage:
 *   const { success } = await rateLimit(`api:auth:${ip}`, 5, 60);
 *   if (!success) return { error: "Too many requests" };
 */
export async function rateLimit(key: string, limit: number, windowSecs: number) {
  try {
    const rateKey = `rl:${key}`;
    
    // Atomic increment and expire using a Lua script to avoid race conditions
    const res = await redis.eval(
      `
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
          redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      return current
      `,
      1,
      rateKey,
      windowSecs
    ) as number;

    return {
      success: res <= limit,
      remaining: Math.max(0, limit - res),
      current: res,
    };
  } catch (err) {
    console.error('[RateLimit] Redis error:', err);
    // Fail-open: if Redis is down, we don't want to block legit users
    return { success: true, remaining: 1, current: 1 };
  }
}

/**
 * Higher-level rate limit for specific user actions (e.g. login attempts)
 */
export async function rateLimitUser(userId: string, action: string, limit: number, windowSecs: number) {
  return rateLimit(`user:${userId}:${action}`, limit, windowSecs);
}

/**
 * Global API rate limit by IP (Node.js runtime only)
 */
export async function rateLimitIp(ip: string, limit: number = 100, windowSecs: number = 60) {
  return rateLimit(`ip:${ip}`, limit, windowSecs);
}
