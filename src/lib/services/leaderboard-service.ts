import { redis } from '../redis';

export const leaderboardService = {
    /**
     * Get cached serialized leaderboard
     */
    async getCachedLeaderboard(scope: string, schoolId?: string) {
        const key = `lb:cache:${scope}:${schoolId || 'global'}`;
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    },

    /**
     * Cache the serialized leaderboard
     */
    async setCachedLeaderboard(scope: string, data: any, schoolId?: string) {
        const key = `lb:cache:${scope}:${schoolId || 'global'}`;
        await redis.set(key, JSON.stringify(data), 'EX', 900); // 15 minutes cache
    },

    /**
     * Invalidate leaderboard cache
     */
    async invalidateCache(scope: string, schoolId?: string) {
        const key = `lb:cache:${scope}:${schoolId || 'global'}`;
        await redis.del(key);
    }
};
