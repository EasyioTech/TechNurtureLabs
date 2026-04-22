import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { serverEnv } from '@/lib/env.server';

/**
 * VIDEO NORMALIZATION QUEUE (Distributed)
 * 
 * DESIGN PRINCIPLES:
 * 1. Distributed Concurrency: Multiple workers can process jobs from this queue.
 * 2. Persistence: Jobs are stored in Redis, surviving server restarts.
 * 3. Scalability: Scale workers independently of the web server.
 */

const QUEUE_NAME = 'video_normalization';

const isRedisDisabled = process.env.DISABLE_REDIS === 'true' || process.env.npm_lifecycle_event === 'build';

const connection = !isRedisDisabled 
  ? new Redis(serverEnv.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    })
  : undefined;

export const videoQueue = connection ? new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
}) : { add: () => Promise.resolve() } as any;

export interface NormalizationJob {
  tempInputPath: string;
  originalName: string;
  fileSize: number;
  userId: string;
  metadata?: any;
}

export async function addNormalizationJob(data: NormalizationJob) {
  return videoQueue.add('normalize', data);
}
