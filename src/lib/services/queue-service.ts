import { redis } from '../redis';

const VIDEO_QUEUE = 'queue:video_transcode';
const PPTX_QUEUE = 'queue:pptx_convert';
const VIDEO_DLQ = 'queue:dlq:video_transcode';
const PPTX_DLQ = 'queue:dlq:pptx_convert';

const MAX_RETRIES = 3;

export interface TranscodeJob {
    assetId: string;
    filePath: string;
    folder: string;
    timestamp: number;
    /** Internal — set by queue service, not by callers */
    _attempts?: number;
    _enqueuedAt?: number;
    _lastError?: string;
}

export interface PptxJob {
    assetId: string;
    filePath: string;
    storageType: 'r2' | 'local';
    folder: string;
    timestamp: number;
    /** Internal — set by queue service, not by callers */
    _attempts?: number;
    _enqueuedAt?: number;
    _lastError?: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export const queueService = {
    /**
     * Add a video to the transcoding queue.
     * Throws if Redis is unavailable — callers must handle this.
     */
    async enqueueVideo(job: TranscodeJob) {
        console.log(`[Queue] Enqueueing video transcode for asset: ${job.assetId}`);
        const payload: TranscodeJob = { ...job, _attempts: 0, _enqueuedAt: Date.now() };
        await redis.lpush(VIDEO_QUEUE, JSON.stringify(payload));
        this.setJobStatus('video', job.assetId, 'pending'); // fire-and-forget
    },

    /**
     * Add a PPTX file to the slide-conversion queue.
     * Replaces the previous setImmediate() approach — jobs survive server restarts.
     * Throws if Redis is unavailable — callers must handle this.
     */
    async enqueuePptx(job: PptxJob) {
        console.log(`[Queue] Enqueueing PPTX conversion for asset: ${job.assetId}`);
        const payload: PptxJob = { ...job, _attempts: 0, _enqueuedAt: Date.now() };
        await redis.lpush(PPTX_QUEUE, JSON.stringify(payload));
        this.setJobStatus('pptx', job.assetId, 'pending'); // fire-and-forget
    },

    /**
     * Retrieve the next video transcode job (blocking RPOP).
     * Returns null on timeout or Redis error (worker loop continues).
     */
    async getNextJob(timeout: number = 30): Promise<TranscodeJob | null> {
        try {
            const result = await redis.brpop(VIDEO_QUEUE, timeout);
            if (!result) return null;
            const job = JSON.parse(result[1]) as TranscodeJob;
            this.setJobStatus('video', job.assetId, 'processing'); // fire-and-forget
            return job;
        } catch (e) {
            console.error('[Queue] Error fetching video job:', e);
            return null;
        }
    },

    /**
     * Retrieve the next PPTX conversion job (blocking RPOP).
     * Returns null on timeout or Redis error (worker loop continues).
     */
    async getNextPptxJob(timeout: number = 30): Promise<PptxJob | null> {
        try {
            const result = await redis.brpop(PPTX_QUEUE, timeout);
            if (!result) return null;
            const job = JSON.parse(result[1]) as PptxJob;
            this.setJobStatus('pptx', job.assetId, 'processing'); // fire-and-forget
            return job;
        } catch (e) {
            console.error('[Queue] Error fetching PPTX job:', e);
            return null;
        }
    },

    /**
     * Mark a video job as succeeded.
     */
    async completeVideoJob(job: TranscodeJob) {
        await this.setJobStatus('video', job.assetId, 'completed');
    },

    /**
     * Mark a PPTX job as succeeded.
     */
    async completePptxJob(job: PptxJob) {
        await this.setJobStatus('pptx', job.assetId, 'completed');
    },

    /**
     * Retry a failed video job or move it to the dead letter queue after MAX_RETRIES.
     */
    async retryVideoJob(job: TranscodeJob, error: string) {
        const attempts = (job._attempts ?? 0) + 1;
        if (attempts >= MAX_RETRIES) {
            console.error(`[Queue] Video job ${job.assetId} failed permanently after ${attempts} attempts. Moving to DLQ.`);
            try {
                await redis.lpush(VIDEO_DLQ, JSON.stringify({ ...job, _attempts: attempts, _lastError: error }));
            } catch (_) { console.error('[Queue] Failed to push video job to DLQ'); }
            await this.setJobStatus('video', job.assetId, 'failed');
        } else {
            const delayMs = Math.pow(3, attempts) * 5000; // 5s, 15s, 45s
            console.warn(`[Queue] Retrying video job ${job.assetId} (attempt ${attempts}/${MAX_RETRIES}) in ${delayMs}ms`);
            setTimeout(async () => {
                try {
                    await redis.lpush(VIDEO_QUEUE, JSON.stringify({ ...job, _attempts: attempts, _lastError: error }));
                } catch (_) { console.error(`[Queue] Failed to re-enqueue video job ${job.assetId}`); }
            }, delayMs);
        }
    },

    /**
     * Retry a failed PPTX job or move it to the dead letter queue after MAX_RETRIES.
     */
    async retryPptxJob(job: PptxJob, error: string) {
        const attempts = (job._attempts ?? 0) + 1;
        if (attempts >= MAX_RETRIES) {
            console.error(`[Queue] PPTX job ${job.assetId} failed permanently after ${attempts} attempts. Moving to DLQ.`);
            try {
                await redis.lpush(PPTX_DLQ, JSON.stringify({ ...job, _attempts: attempts, _lastError: error }));
            } catch (_) { console.error('[Queue] Failed to push PPTX job to DLQ'); }
            await this.setJobStatus('pptx', job.assetId, 'failed');
        } else {
            const delayMs = Math.pow(3, attempts) * 5000;
            console.warn(`[Queue] Retrying PPTX job ${job.assetId} (attempt ${attempts}/${MAX_RETRIES}) in ${delayMs}ms`);
            setTimeout(async () => {
                try {
                    await redis.lpush(PPTX_QUEUE, JSON.stringify({ ...job, _attempts: attempts, _lastError: error }));
                } catch (_) { console.error(`[Queue] Failed to re-enqueue PPTX job ${job.assetId}`); }
            }, delayMs);
        }
    },

    /**
     * Set job status in Redis (30-day TTL for observability). Non-critical.
     */
    async setJobStatus(type: 'video' | 'pptx', assetId: string, status: JobStatus) {
        try {
            await redis.set(`job:${type}:${assetId}:status`, status, 'EX', 60 * 60 * 24 * 30);
        } catch (_) { /* status tracking is non-critical */ }
    },

    /**
     * Get current job status.
     */
    async getJobStatus(type: 'video' | 'pptx', assetId: string): Promise<JobStatus | null> {
        try {
            const status = await redis.get(`job:${type}:${assetId}:status`);
            return status as JobStatus | null;
        } catch (_) {
            return null;
        }
    },

    /** Queue lengths for monitoring */
    async getQueueLength() {
        try { return await redis.llen(VIDEO_QUEUE); } catch (_) { return 0; }
    },

    async getPptxQueueLength() {
        try { return await redis.llen(PPTX_QUEUE); } catch (_) { return 0; }
    },

    async getDlqLength(type: 'video' | 'pptx') {
        try { return await redis.llen(type === 'video' ? VIDEO_DLQ : PPTX_DLQ); } catch (_) { return 0; }
    },
};
