import { redis } from './redis';
import { NextResponse } from 'next/server';

/**
 * Basic rate limiting helper using Redis.
 * @param key The unique key for rate limiting (e.g., ip:action).
 * @param limit Max attempts allowed in the window.
 * @param windowSeconds Time window in seconds.
 */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number) {
    const rateLimitKey = `rate-limit:${key}`;
    const reqCount = await redis.incr(rateLimitKey);

    if (reqCount === 1) {
        await redis.expire(rateLimitKey, windowSeconds);
    }

    if (reqCount > limit) {
        return {
            isRateLimited: true,
            response: NextResponse.json(
                { error: 'Too many attempts. Please try again later.' },
                {
                    status: 429,
                    headers: { 'Retry-After': windowSeconds.toString() }
                }
            )
        };
    }

    return { isRateLimited: false };
}
