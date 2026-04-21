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

const connection = new Redis(serverEnv.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const videoQueue = new Queue(QUEUE_NAME, {
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
});

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
