// import 'server-only';
import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

import { serverEnv } from '@/lib/env.server';

// Prevent redis from crashing Next.js static build process when REDIS_URL is a placeholder
const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';

let redisUrl = serverEnv.REDIS_URL || 'redis://localhost:6379';
if (process.env.NODE_ENV === 'production') {
    redisUrl = redisUrl.replace('localhost', 'redis').replace('127.0.0.1', 'redis');
}

export const redis =
    globalForRedis.redis ||
    (isBuild
        ? new Redis(redisUrl, { lazyConnect: true })
        : new Redis(redisUrl)
    );

if (serverEnv.NODE_ENV !== 'production') globalForRedis.redis = redis;

/**
 * PRODUCTION-GRADE REDIS UTILITIES
 * Implements Large Payload Guard and Safe Serialization
 */
const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB Guard

export const safeRedis = {
    /** Sets a value with a 1MB size safety check to prevent memory spikes */
    set: async (key: string, value: any, ttlSeconds: number = 300) => {
        try {
            const stringified = typeof value === 'string' ? value : JSON.stringify(value);
            if (stringified.length > MAX_PAYLOAD_SIZE) {
                console.warn(`[Redis Guard] Payload for key ${key} skipped (${Math.round(stringified.length / 1024)}KB > 1MB)`);
                return false;
            }
            await redis.set(key, stringified, 'EX', ttlSeconds);
            return true;
        } catch (err) {
            console.error(`[Redis Error] Failed to set key ${key}:`, err);
            return false;
        }
    },

    get: async <T>(key: string): Promise<T | null> => {
        try {
            const val = await redis.get(key);
            if (!val) return null;
            return JSON.parse(val) as T;
        } catch (err) {
            console.error(`[Redis Error] Failed to get/parse key ${key}:`, err);
            return null;
        }
    },

    /** Tracks security and performance indicators for observability */
    trackEvent: async (category: 'security' | 'performance', type: string) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const key = `metrics:${category}:${today}`;
            await redis.hincrby(key, type, 1);
            await redis.expire(key, 86400 * 14); // 2 weeks retention
        } catch (err) {
            console.error(`[Metrics Error] Failed to track ${category}:${type}:`, err);
        }
    }
};
