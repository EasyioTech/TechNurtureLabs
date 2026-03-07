import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

import { serverEnv } from '@/lib/env.server';

export const redis =
    globalForRedis.redis ||
    new Redis(serverEnv.REDIS_URL);

if (serverEnv.NODE_ENV !== 'production') globalForRedis.redis = redis;
