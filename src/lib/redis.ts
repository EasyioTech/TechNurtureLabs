import Redis from 'ioredis';
import { serverEnv } from '@/lib/env.server';

const globalForRedis = global as unknown as { redis: Redis | null };

/**
 * PRODUCTION-GRADE REDIS CONFIGURATION
 * 
 * In development, Redis is optional. If REDIS_URL is missing or the connection fails,
 * we fail-open gracefully to ensure developer productivity isn't halted.
 */

const isBuild = process.env.NEXT_SKIP_TYPECHECK === '1' || process.env.npm_lifecycle_event === 'build';
const isDev = process.env.NODE_ENV === 'development';

// Skip Redis entirely if disabled via env or if we are in dev and want it off
const forceDisable = process.env.DISABLE_REDIS === 'true';
const isDevSkip = isDev && process.env.REDIS_DEV_ENABLED !== 'true';
const isRedisDisabled = forceDisable || isDevSkip || !serverEnv.REDIS_URL || (typeof serverEnv.REDIS_URL === 'string' && serverEnv.REDIS_URL.trim() === '');

let redisInstance: Redis | null = null;

if (!isBuild && !isRedisDisabled) {
    if (globalForRedis.redis) {
        redisInstance = globalForRedis.redis;
    } else {
        const redisUrl = serverEnv.REDIS_URL || 'redis://localhost:6379';
        
        try {
            redisInstance = new Redis(redisUrl, {
                // Exponential backoff: 200ms, 400ms, 800ms … up to 2s, then give up in dev.
                retryStrategy: (times: number) => {
                    const maxRetries = isDev ? 3 : 8;
                    if (times > maxRetries) {
                        if (isDev) {
                            console.warn(`[Redis] Giving up on connection in development. Middleware will skip Redis logic.`);
                        } else {
                            console.error(`[Redis] Connection failed after ${times} retries — giving up`);
                        }
                        return null; // Stop retrying
                    }
                    return Math.min(times * 200, 2000);
                },
                reconnectOnError: (err: Error) => {
                    return err.message.includes('READONLY') || err.message.includes('ECONNRESET');
                },
                enableOfflineQueue: false, // Don't queue commands if down to avoid memory spikes
                connectTimeout: isDev ? 2000 : 5000,
                maxRetriesPerRequest: 0, // Fail immediately if not connected
            });

            // CRITICAL: Handle the 'error' event to prevent process crashes
            // or "Unhandled error event" log spam in the terminal.
            redisInstance.on('error', (err) => {
                // Only log errors in production or if it's not a connection refused error
                if (!isDev) {
                    console.error('[Redis Error]:', err.message);
                }
            });

            if (isDev) globalForRedis.redis = redisInstance;
        } catch (err) {
            console.error('[Redis Init Error]:', err);
            redisInstance = null;
        }
    }
}

/**
 * REDIS FAIL-SAFE PROXY
 * If Redis is disabled (common in dev), we return a Proxy that follows
 * the ioredis interface but performs no-ops. This prevents "Cannot read properties of null"
 * crashes project-wide.
 * 
 * NOTE: It also handles .pipeline() by returning itself, ensuring all chained calls are safe.
 */
const createSafeProxy = (target: any = { _isPipeline: false }): any => {
    return new Proxy(target, {
        get: (o, prop) => {
            if (prop === 'status') return 'disabled';
            if (prop === 'on' || prop === 'off' || prop === 'once') return () => o;
            if (prop === 'quit' || prop === 'disconnect') return () => Promise.resolve();
            if (prop === 'pipeline' || prop === 'multi') return () => createSafeProxy({ _isPipeline: true });
            if (prop === 'exec') return () => Promise.resolve([]);
            // For any other Redis command (get, set, del, etc.) from standard calls OR 'o' for chained calls (pipelines).
            return (...args: any[]) => {
                if (o._isPipeline) return createSafeProxy({ _isPipeline: true });
                return Promise.resolve(null);
            };
        }
    });
};

export const redis = (redisInstance || createSafeProxy()) as Redis;
// Export a boolean for consumers to quickly check status without triggering a connection
export const isRedisAvailable = !!redisInstance && redisInstance.status === 'ready';

/**
 * PRODUCTION-GRADE REDIS UTILITIES
 */
const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB Guard

export const safeRedis = {
    set: async (key: string, value: any, ttlSeconds: number = 300) => {
        if (!redisInstance) return false;
        try {
            const stringified = typeof value === 'string' ? value : JSON.stringify(value);
            if (stringified.length > MAX_PAYLOAD_SIZE) {
                console.warn(`[Redis Guard] Payload for key ${key} skipped (${Math.round(stringified.length / 1024)}KB > 1MB)`);
                return false;
            }
            await redisInstance.set(key, stringified, 'EX', ttlSeconds);
            return true;
        } catch (err) {
            return false;
        }
    },

    get: async <T>(key: string): Promise<T | null> => {
        if (!redisInstance) return null;
        try {
            const val = await redisInstance.get(key);
            if (!val) return null;
            return JSON.parse(val) as T;
        } catch (err) {
            return null;
        }
    },

    trackEvent: async (category: 'security' | 'performance', type: string) => {
        if (!redisInstance) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const key = `metrics:${category}:${today}`;
            await redisInstance.hincrby(key, type, 1);
            await redisInstance.expire(key, 86400 * 14); // 2 weeks retention
        } catch (err) { }
    }
};
