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
