import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { serverEnv } from '@/lib/env.server';
import { analyzeVideo, normalizeVideo } from '../services/video-processor';
import { createTusUpload } from '../services/cloudflare-stream';
import * as tus from 'tus-js-client';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import { NormalizationJob } from '../queue/video-queue';

/**
 * VIDEO NORMALIZATION WORKER
 * 
 * Handles the heavy lifting of FFmpeg re-encoding and Cloudflare ingestion.
 */

const connection = new Redis(serverEnv.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const videoWorker = new Worker(
  'video_normalization',
  async (job: Job<NormalizationJob>) => {
    const { tempInputPath, originalName, fileSize, metadata } = job.data;
    let tempOutputPath = '';

    console.log(`[VideoWorker] Processing job ${job.id} for ${originalName}`);

    try {
      // 1. Analyze
      // 1. Analyze for risks (VFR, Codec)
      const analysis = await analyzeVideo(tempInputPath);
      console.log(`[Worker] Analysis for ${originalName}:`, analysis);

      // Detection logic: VFR or non-H264 are high risk for Cloudflare
      const isVFR = analysis.details.r_frame_rate !== analysis.details.avg_frame_rate;
      const isNotH264 = !analysis.details.codec_name?.includes('h264');
      const needsNormalization = isVFR || isNotH264;

      // 2. Normalize if risky (Guaranteed Fix)
      let finalFilePath = tempInputPath;
      if (needsNormalization) {
        console.log(`[Worker] Normalizing ${originalName} (VFR: ${isVFR}, Codec: ${analysis.details.codec_name})...`);
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

      await new Promise<void>((resolve, reject) => {
        const stream = createReadStream(finalFilePath);
        const upload = new tus.Upload(stream as any, {
          uploadUrl,
          chunkSize: 10 * 1024 * 1024,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          metadata: {
            filename: originalName,
            filetype: 'video/mp4',
          },
          onError: reject,
          onSuccess: () => resolve(),
        });
        upload.start();
      });

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
);

videoWorker.on('completed', (job) => {
  console.log(`[VideoWorker] Job ${job.id} completed successfully`);
});

videoWorker.on('failed', (job, err) => {
  console.error(`[VideoWorker] Job ${job?.id} failed:`, err);
});
