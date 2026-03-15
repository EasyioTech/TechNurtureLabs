import { redis } from '../redis';

export interface RateLimitConfig {
    key: string;
    limit: number;
    windowSeconds: number;
}

export const rateLimitService = {
    /**
     * Check if a request should be rate limited.
     * Returns { allowed: boolean, remaining: number, reset: number }
     */
    async check(config: RateLimitConfig) {
        const { key, limit, windowSeconds } = config;
        const fullKey = `ratelimit:${key}`;

        // Atomic Lua script to prevent race conditions and ensure accuracy
        const results = await redis.eval(
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

        const [count, ttl] = results;

        return {
            allowed: count <= limit,
            remaining: Math.max(0, limit - count),
            reset: ttl > 0 ? ttl : windowSeconds
        };
    },

    /**
     * Helper for school-level rate limiting
     */
    async checkSchoolLimit(schoolId: string, action: string, limit: number = 1000, window: number = 60) {
        return this.check({
            key: `school:${schoolId}:${action}`,
            limit,
            windowSeconds: window
        });
    },

    /**
     * Helper for user-level rate limiting (e.g., login attempts, heartbeats)
     */
    async checkUserLimit(userId: string, action: string, limit: number = 20, window: number = 60) {
        return this.check({
            key: `user:${userId}:${action}`,
            limit,
            windowSeconds: window
        });
    }
};
