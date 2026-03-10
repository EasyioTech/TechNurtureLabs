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
    // Use Lua script for atomic increment + initial expiry
    const reqCount = await redis.eval(
        `
        local current = redis.call("INCR", KEYS[1])
        if tonumber(current) == 1 then
            redis.call("EXPIRE", KEYS[1], ARGV[1])
        end
        return current
        `,
        1,
        rateLimitKey,
        windowSeconds
    ) as number;

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
