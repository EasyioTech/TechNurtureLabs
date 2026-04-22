import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { serverEnv } from '@/lib/env.server';
import { analyzeVideo, normalizeVideo } from '../services/video-processor';
import { createTusUpload } from '../services/cloudflare-stream';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import { NormalizationJob } from '../queue/video-queue';

/**
 * VIDEO NORMALIZATION WORKER
 * 
 * Handles the heavy lifting of FFmpeg re-encoding and Cloudflare ingestion.
 */

const isRedisDisabled = process.env.DISABLE_REDIS === 'true' || process.env.npm_lifecycle_event === 'build';

const connection = !isRedisDisabled 
  ? new Redis(serverEnv.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    })
  : undefined;

export const videoWorker = connection ? new Worker(
  'video_normalization',
  async (job: Job<NormalizationJob>) => {
    const { tempInputPath, originalName, fileSize, metadata } = job.data;
    let tempOutputPath = '';

    console.log(`[VideoWorker] Processing job ${job.id} for ${originalName}`);

    try {
      // 1. Analyze
      // 1. Analyze for risks (VFR, Codec)
      const analysis = await analyzeVideo(tempInputPath);
      console.log(`[Worker] Analysis for ${originalName}:`, analysis.reason || 'Clean');

      // 2. Normalize if risky (Guaranteed Fix)
      let finalFilePath = tempInputPath;
      if (analysis.isRisky) {
        console.log(`[Worker] Normalizing ${originalName}: ${analysis.reason}...`);
        tempOutputPath = await normalizeVideo(tempInputPath);
        finalFilePath = tempOutputPath;
      } else {
        console.log(`[Worker] Video ${originalName} is clean. Skipping normalization.`);
        finalFilePath = tempInputPath;
      }

      // 3. Push to Cloudflare
      const fileStats = await fs.stat(finalFilePath);
      const { uploadUrl, uid } = await createTusUpload(fileStats.size, {
        ...metadata,
        name: originalName,
        normalized: 'true',
        jobId: job.id
      });

      console.log(`[VideoWorker] S2S Push for ${job.id} -> CF UID: ${uid}`);

      // 3. Direct PATCH upload to Cloudflare (Native Node logic)
      // We bypass tus-js-client because it performs a HEAD check that Cloudflare rejects in this mode.
      const fileStream = createReadStream(finalFilePath);
      const uploadRes = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Tus-Resumable': '1.0.0',
          'Upload-Offset': '0',
          'Upload-Length': fileStats.size.toString(),
          'Content-Type': 'application/offset+octet-stream',
        },
        body: fileStream as any,
        // @ts-ignore - duplex is required for streaming bodies in fetch
        duplex: 'half'
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text().catch(() => '');
        throw new Error(`Cloudflare upload failed (${uploadRes.status}): ${errorText}`);
      }

      console.log(`[VideoWorker] Successfully ingested ${uid} for job ${job.id}`);

      // Cleanup
      await fs.unlink(tempInputPath).catch(() => {});
      if (tempOutputPath) await fs.unlink(tempOutputPath).catch(() => {});

      return { uid, success: true };
    } catch (error) {
      console.error(`[VideoWorker] Job ${job.id} failed:`, error);
      // Cleanup on failure
      await fs.unlink(tempInputPath).catch(() => {});
      if (tempOutputPath) await fs.unlink(tempOutputPath).catch(() => {});
      throw error;
    }
  },
  {
    connection,
    concurrency: 3, // Safe local concurrency
    limiter: {
      max: 3,
      duration: 1000,
    },
  }
) : null;

if (videoWorker) {
  videoWorker.on('completed', (job) => {
    console.log(`[VideoWorker] Job ${job.id} completed successfully`);
  });

  videoWorker.on('failed', (job, err) => {
    console.error(`[VideoWorker] Job ${job?.id} failed:`, err);
  });
}
