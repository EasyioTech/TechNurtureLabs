import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { serverEnv } from '@/lib/env.server';
import { analyzeVideo, normalizeVideo } from '../services/video-processor';
import { createTusUpload } from '../services/cloudflare-stream';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { NormalizationJob } from '../queue/video-queue';

/**
 * VIDEO NORMALIZATION WORKER
 *
 * Production-grade worker with:
 * - File existence validation at every step
 * - Detailed error logging with context
 * - Atomic cleanup on failure
 * - Proper resource management
 */

const isRedisDisabled =
    process.env.DISABLE_REDIS === 'true' || process.env.npm_lifecycle_event === 'build';

const connection = !isRedisDisabled
    ? new Redis(serverEnv.REDIS_URL || 'redis://localhost:6379', {
          maxRetriesPerRequest: null,
      })
    : undefined;

/**
 * Safely verify a file exists and is readable before attempting to use it.
 */
async function validateFileSafely(
    filePath: string,
    description: string
): Promise<{ exists: true; size: number }> {
    try {
        const stats = await fs.stat(filePath);

        if (!stats.isFile()) {
            throw new Error(`Not a regular file: ${filePath}`);
        }

        if (stats.size === 0) {
            throw new Error(`File is empty (0 bytes): ${filePath}`);
        }

        // Verify readable
        try {
            await fs.access(filePath, fsConstants.R_OK);
        } catch (e) {
            throw new Error(`File exists but is not readable: ${filePath}`);
        }

        console.log(`[Worker:${description}] ✓ File valid: ${filePath} (${stats.size} bytes)`);
        return { exists: true, size: stats.size };
    } catch (err: any) {
        console.error(
            `[Worker:${description}] ✗ File validation failed: ${err.message}`
        );
        throw err;
    }
}

export const videoWorker = connection
    ? new Worker(
          'video_normalization',
          async (job: Job<NormalizationJob>) => {
              const { tempInputPath, originalName, fileSize, metadata } = job.data;
              let tempOutputPath = '';
              let finalFilePath = '';

              console.log(`\n${'='.repeat(60)}`);
              console.log(`[VideoWorker] JOB START: ${job.id}`);
              console.log(`  Original filename: ${originalName}`);
              console.log(`  Expected size: ${fileSize} bytes`);
              console.log(`  Temp input path: ${tempInputPath}`);
              console.log(`${'='.repeat(60)}\n`);

              try {
                  // STEP 1: Validate input file exists
                  console.log(`[VideoWorker:${job.id}] Step 1/5: Validating input file...`);
                  const inputInfo = await validateFileSafely(
                      tempInputPath,
                      'INPUT_VALIDATION'
                  );

                  // Verify file size matches expectation (within 1% tolerance for different filesystems)
                  if (inputInfo.size < fileSize * 0.99 || inputInfo.size > fileSize * 1.01) {
                      console.warn(
                          `[VideoWorker:${job.id}] Size mismatch warning: expected ~${fileSize} bytes, got ${inputInfo.size} bytes`
                      );
                  }

                  // STEP 2: Analyze video for issues
                  console.log(`[VideoWorker:${job.id}] Step 2/5: Analyzing video with FFprobe...`);
                  const analysis = await analyzeVideo(tempInputPath);
                  console.log(
                      `[VideoWorker:${job.id}] Analysis result: ${analysis.reason || 'CLEAN (no issues detected)'}`
                  );

                  // STEP 3: Normalize if needed
                  finalFilePath = tempInputPath;

                  if (analysis.isRisky) {
                      console.log(`[VideoWorker:${job.id}] Step 3/5: Video is RISKY. Running FFmpeg normalization...`);
                      console.log(`  Reason: ${analysis.reason}`);

                      try {
                          tempOutputPath = await normalizeVideo(tempInputPath);
                          finalFilePath = tempOutputPath;

                          // Verify normalized output exists and has content
                          const outputInfo = await validateFileSafely(
                              tempOutputPath,
                              'NORMALIZED_OUTPUT'
                          );

                          console.log(
                              `[VideoWorker:${job.id}] ✓ Normalization successful: ${tempOutputPath} (${outputInfo.size} bytes)`
                          );
                      } catch (normErr: any) {
                          console.error(
                              `[VideoWorker:${job.id}] ✗ Normalization failed: ${normErr.message}`
                          );
                          throw new Error(`Normalization pipeline failed: ${normErr.message}`);
                      }
                  } else {
                      console.log(`[VideoWorker:${job.id}] Step 3/5: Video is CLEAN. Skipping normalization.`);
                      finalFilePath = tempInputPath;
                  }

                  // STEP 4: Upload to Cloudflare Stream
                  console.log(`[VideoWorker:${job.id}] Step 4/5: Uploading to Cloudflare Stream...`);

                  const fileStats = await validateFileSafely(finalFilePath, 'FINAL_FILE');

                  console.log(`  Creating TUS upload URL for ${fileStats.size} bytes...`);
                  const { uploadUrl, uid } = await createTusUpload(fileStats.size, {
                      ...metadata,
                      name: originalName,
                      normalized: tempOutputPath ? 'true' : 'false',
                      jobId: job.id,
                  });

                  console.log(`[VideoWorker:${job.id}] ✓ Got TUS endpoint. Stream UID: ${uid}`);
                  console.log(`  Uploading to: ${uploadUrl}`);

                  // Direct PATCH upload to Cloudflare
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
                      // @ts-ignore - duplex required for streaming
                      duplex: 'half',
                  });

                  if (!uploadRes.ok) {
                      const errorText = await uploadRes.text().catch(() => 'no error text');
                      throw new Error(
                          `Cloudflare Stream upload failed (${uploadRes.status}): ${errorText}`
                      );
                  }

                  console.log(`[VideoWorker:${job.id}] ✓ Upload to Cloudflare Stream successful`);
                  console.log(`  Video UID: cf-stream://${uid}`);

                  // STEP 5: Cleanup
                  console.log(`[VideoWorker:${job.id}] Step 5/5: Cleaning up temporary files...`);

                  const cleanupPromises = [];

                  // Clean input file
                  if (tempInputPath && tempInputPath !== finalFilePath) {
                      cleanupPromises.push(
                          fs.unlink(tempInputPath)
                              .then(() =>
                                  console.log(
                                      `[VideoWorker:${job.id}] ✓ Cleaned up input temp file: ${tempInputPath}`
                                  )
                              )
                              .catch((e) =>
                                  console.warn(
                                      `[VideoWorker:${job.id}] ⚠ Failed to delete input: ${e.message}`
                                  )
                              )
                      );
                  }

                  // Clean output file (if we created a normalized version)
                  if (tempOutputPath) {
                      cleanupPromises.push(
                          fs.unlink(tempOutputPath)
                              .then(() =>
                                  console.log(
                                      `[VideoWorker:${job.id}] ✓ Cleaned up normalized temp file: ${tempOutputPath}`
                                  )
                              )
                              .catch((e) =>
                                  console.warn(
                                      `[VideoWorker:${job.id}] ⚠ Failed to delete output: ${e.message}`
                                  )
                              )
                      );
                  }

                  await Promise.all(cleanupPromises);

                  console.log(`\n${'='.repeat(60)}`);
                  console.log(`[VideoWorker] JOB COMPLETE: ${job.id}`);
                  console.log(`  Cloudflare Stream UID: ${uid}`);
                  console.log(`  Status: SUCCESS`);
                  console.log(`${'='.repeat(60)}\n`);

                  return { uid, success: true };
              } catch (error: any) {
                  const errorMsg = error.message || String(error);

                  console.error(`\n${'='.repeat(60)}`);
                  console.error(`[VideoWorker] JOB FAILED: ${job.id}`);
                  console.error(`  Original filename: ${originalName}`);
                  console.error(`  Error: ${errorMsg}`);
                  console.error(`  Input file: ${tempInputPath}`);
                  console.error(`  Normalized file: ${tempOutputPath || 'none'}`);
                  console.error(`${'='.repeat(60)}\n`);

                  // Atomic cleanup on failure
                  console.log(`[VideoWorker:${job.id}] Performing cleanup after failure...`);
                  const cleanupPromises = [];

                  if (tempInputPath) {
                      cleanupPromises.push(
                          fs.unlink(tempInputPath)
                              .catch(() => {}) // Silently ignore cleanup errors
                      );
                  }

                  if (tempOutputPath) {
                      cleanupPromises.push(
                          fs.unlink(tempOutputPath)
                              .catch(() => {}) // Silently ignore cleanup errors
                      );
                  }

                  await Promise.all(cleanupPromises);

                  // Re-throw with context
                  throw new Error(
                      `Video processing failed for "${originalName}": ${errorMsg}`
                  );
              }
          },
          {
              connection,
              concurrency: 2, // Reduced from 3 to avoid resource contention
              limiter: {
                  max: 2,
                  duration: 1000,
              },
          }
      )
    : null;

if (videoWorker) {
    videoWorker.on('completed', (job) => {
        console.log(`[VideoWorker] ✓ Job ${job.id} completed`);
    });

    videoWorker.on('failed', (job, err) => {
        console.error(`[VideoWorker] ✗ Job ${job?.id} failed: ${err?.message}`);
    });

    videoWorker.on('error', (err) => {
        console.error(`[VideoWorker] CRITICAL ERROR: ${err?.message}`);
    });
}
