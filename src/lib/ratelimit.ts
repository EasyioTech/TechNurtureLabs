import { redis } from './redis';

/**
 * PRODUCTION-GRADE RATE LIMITER
 * 
 * In development, we fail-open immediately if Redis is not available,
 * ensuring no network overhead or log-spam occurs.
 */
export async function rateLimit(key: string, limit: number, windowSecs: number) {
  // If Redis is not initialized or disconnected, bypass rate-limiting
  if (!redis || (redis as any).status !== 'ready') {
    return { success: true, remaining: limit, current: 0 };
  }

  try {
    const rateKey = `rl:${key}`;
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
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[RateLimit] Redis action skipped due to connection status: ${redis ? (redis as any).status : 'null'}`);
    } else {
      console.error('[RateLimit Error]:', err);
    }
    // Fail-open strategy
    return { success: true, remaining: 1, current: 1 };
  }
}

/**
 * Specific action limit (e.g. login attempts)
 */
export async function rateLimitUser(userId: string, action: string, limit: number, windowSecs: number) {
  return rateLimit(`user:${userId}:${action}`, limit, windowSecs);
}

/**
 * Global IP-based rate limit
 */
export async function rateLimitIp(ip: string, limit: number = 100, windowSecs: number = 60) {
  return rateLimit(`ip:${ip}`, limit, windowSecs);
}
