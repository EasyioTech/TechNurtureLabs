import { redis } from '../redis';

export const leaderboardService = {
    /**
     * Get cached serialized leaderboard. Returns null on Redis error (triggers DB fallback in caller).
     */
    async getCachedLeaderboard(scope: string, schoolId?: string) {
        const key = `lb:cache:${scope}:${schoolId || 'global'}`;
        try {
            const cached = await redis.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (_) {
            return null; // Cache miss — caller falls back to DB
        }
    },

    /**
     * Cache the serialized leaderboard (best-effort).
     */
    async setCachedLeaderboard(scope: string, data: any, schoolId?: string) {
        const key = `lb:cache:${scope}:${schoolId || 'global'}`;
        try {
            await redis.set(key, JSON.stringify(data), 'EX', 900); // 15 minutes cache
        } catch (_) { /* non-critical — leaderboard will be re-fetched from DB next time */ }
    },

    /**
     * Invalidate leaderboard cache (best-effort).
     */
    async invalidateCache(scope: string, schoolId?: string) {
        const key = `lb:cache:${scope}:${schoolId || 'global'}`;
        try {
            await redis.del(key);
        } catch (_) { /* non-critical — cache will expire naturally */ }
    }
};
