import { redis } from '../redis';

export interface RateLimitConfig {
    key: string;
    limit: number;
    windowSeconds: number;
    strict?: boolean; // If true, fail-closed (block on Redis error)
}

export const rateLimitService = {
    /**
     * Check if a request should be rate limited.
     * Returns { allowed: boolean, remaining: number, reset: number }
     */
    async check(config: RateLimitConfig) {
        const { key, limit, windowSeconds, strict = false } = config;
        const fullKey = `ratelimit:${key}`;

        try {
            if (!redis || (redis as any).status !== 'ready') {
                throw new Error('Redis not available');
            }

            // Atomic Lua script to prevent race conditions and ensure accuracy
            const res = await redis.eval(
                `
                local current = redis.call("INCR", KEYS[1])
                if tonumber(current) == 1 then
                    redis.call("EXPIRE", KEYS[1], ARGV[1])
                end
                return {current, redis.call("TTL", KEYS[1])}
                `,
                1,
                fullKey,
                windowSeconds
            ) as [number, number];

            const [count, ttl] = res;

            return {
                allowed: count <= limit,
                remaining: Math.max(0, limit - count),
                reset: ttl > 0 ? ttl : windowSeconds
            };
        } catch (err) {
            // Redis is unavailable
            if (strict) {
                console.error(`[RateLimit] Redis error for key ${key} — FAILING CLOSED (STRICT):`, err);
                return { allowed: false, remaining: 0, reset: windowSeconds };
            }
            
            // Fail-open: if Redis is down, we don't want to block legit users
            console.error(`[RateLimit] Redis error for key ${key} — failing open:`, err);
            return { allowed: true, remaining: limit, reset: windowSeconds };
        }
    },

    /**
     * Helper for school-level rate limiting
     */
    async checkSchoolLimit(schoolId: string, action: string, limit: number = 1000, window: number = 60, strict: boolean = false) {
        return this.check({
            key: `school:${schoolId}:${action}`,
            limit,
            windowSeconds: window,
            strict
        });
    },

    /**
     * Helper for user-level rate limiting (e.g., login attempts, heartbeats)
     */
    async checkUserLimit(userId: string, action: string, limit: number = 20, window: number = 60, strict: boolean = false) {
        return this.check({
            key: `user:${userId}:${action}`,
            limit,
            windowSeconds: window,
            strict
        });
    }
};
