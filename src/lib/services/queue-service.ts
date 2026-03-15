import { redis } from '../redis';

const VIDEO_QUEUE = 'queue:video_transcode';

export interface TranscodeJob {
    assetId: string;
    filePath: string;
    folder: string;
    timestamp: number;
}

export const queueService = {
    /**
     * Add a video to the transcoding queue.
     */
    async enqueueVideo(job: TranscodeJob) {
        console.log(`[Queue] Enqueueing video transcode for asset: ${job.assetId}`);
        await redis.lpush(VIDEO_QUEUE, JSON.stringify(job));
    },

    /**
     * Retrieve the next job from the queue (Blocking RPOP).
     * This is intended for the standalone worker process.
     */
    async getNextJob(timeout: number = 30): Promise<TranscodeJob | null> {
        const result = await redis.brpop(VIDEO_QUEUE, timeout);
        if (!result) return null;
        
        // brpop returns [key, value]
        try {
            return JSON.parse(result[1]);
        } catch (e) {
            console.error('[Queue] Failed to parse job data:', e);
            return null;
        }
    },

    /**
     * Get queue length for monitoring.
     */
    async getQueueLength() {
        return await redis.llen(VIDEO_QUEUE);
    }
};
