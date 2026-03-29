import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PlatformEvent } from '../services/event-service';
import { serverEnv } from '@/lib/env.server';

/**
 * SCALE BREAKER B: Robust Event Queue (BullMQ)
 * 
 * Replaces simple BRPOP with a professional queue that supports:
 * - Automatic retries with exponential backoff
 * - Job persistence (no data loss if worker crashes)
 * - Monitoring and concurrency control
 */

const QUEUE_NAME = 'platform_events';

// SCALE BREAKER B: BullMQ requires a dedicated connection with maxRetriesPerRequest: null
const queueConnection = new Redis(serverEnv.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const platformQueue = new Queue(QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep failed jobs for inspection
  },
});

export async function pushPlatformEvent(type: PlatformEvent, payload: any) {
  return platformQueue.add(type, { ...payload, type, timestamp: new Date() });
}
