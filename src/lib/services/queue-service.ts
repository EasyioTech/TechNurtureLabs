import { redis } from '../redis';

/**
 * Queue Service — Redis-backed job queue for background tasks.
 * 
 * Video transcoding has been migrated to Cloudflare Stream.
 * This service now only handles event queue operations for
 * platform events (achievements, challenges, etc).
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export const queueService = {
    /**
     * Set job status in Redis (30-day TTL for observability). Non-critical.
     */
    async setJobStatus(type: string, id: string, status: JobStatus) {
        try {
            await redis.set(`job:${type}:${id}:status`, status, 'EX', 60 * 60 * 24 * 30);
        } catch (_) { /* status tracking is non-critical */ }
    },

    /**
     * Get current job status.
     */
    async getJobStatus(type: string, id: string): Promise<JobStatus | null> {
        try {
            const status = await redis.get(`job:${type}:${id}:status`);
            return status as JobStatus | null;
        } catch (_) {
            return null;
        }
    },
};
