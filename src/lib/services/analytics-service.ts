import { redis } from '../redis';

const STATS_KEY = 'stats:global';

export const analyticsService = {
    /**
     * Increment a global metric (e.g., total_students, total_courses)
     */
    async incrementMetric(metric: string, amount: number = 1) {
        try {
            await redis.hincrby(STATS_KEY, metric, amount);
        } catch (_) { /* non-critical — analytics are best-effort */ }
    },

    /**
     * Decrement a global metric
     */
    async decrementMetric(metric: string, amount: number = 1) {
        try {
            await redis.hincrby(STATS_KEY, metric, -amount);
        } catch (_) { /* non-critical */ }
    },

    /**
     * Set a metric directly (useful for periodic re-syncing)
     */
    async setMetric(metric: string, value: number) {
        try {
            await redis.hset(STATS_KEY, metric, value);
        } catch (_) { /* non-critical */ }
    },

    /**
     * Fetch all global metrics
     */
    async getGlobalStats() {
        try {
            return await redis.hgetall(STATS_KEY);
        } catch (_) {
            console.warn('[Analytics] Redis unavailable — returning empty stats');
            return {};
        }
    },

    /**
     * Sync metrics from DB to Redis (Central Source of Truth alignment)
     * Should be run during off-peak hours or via a maintenance task.
     */
    async syncFromDb(metrics: Record<string, number>) {
        try {
            const pipeline = redis.pipeline();
            for (const [key, val] of Object.entries(metrics)) {
                pipeline.hset(STATS_KEY, key, val);
            }
            await pipeline.exec();
        } catch (e) {
            console.warn('[Analytics] Redis unavailable for DB sync:', (e as Error).message);
        }
    }
};
