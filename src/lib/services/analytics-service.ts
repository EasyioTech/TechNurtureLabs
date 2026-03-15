import { redis } from '../redis';

const STATS_KEY = 'stats:global';

export const analyticsService = {
    /**
     * Increment a global metric (e.g., total_students, total_courses)
     */
    async incrementMetric(metric: string, amount: number = 1) {
        await redis.hincrby(STATS_KEY, metric, amount);
    },

    /**
     * Decrement a global metric
     */
    async decrementMetric(metric: string, amount: number = 1) {
        await redis.hincrby(STATS_KEY, metric, -amount);
    },

    /**
     * Set a metric directly (useful for periodic re-syncing)
     */
    async setMetric(metric: string, value: number) {
        await redis.hset(STATS_KEY, metric, value);
    },

    /**
     * Fetch all global metrics
     */
    async getGlobalStats() {
        return await redis.hgetall(STATS_KEY);
    },

    /**
     * Sync metrics from DB to Redis (Central Source of Truth alignment)
     * Should be run during off-peak hours or via a maintenance task.
     */
    async syncFromDb(metrics: Record<string, number>) {
        const pipeline = redis.pipeline();
        for (const [key, val] of Object.entries(metrics)) {
            pipeline.hset(STATS_KEY, key, val);
        }
        await pipeline.exec();
    }
};
