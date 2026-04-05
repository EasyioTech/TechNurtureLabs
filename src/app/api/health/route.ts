import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { s3Client, isCloudflareConfigured } from '@/lib/storage';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';

/**
 * PRODUCTION MONITORING ENDPOINT
 * Checks connectivity to Redis, PostgreSQL, and R2 Storage.
 * Used by external uptime monitors (UptimeRobot, BetterStack, etc.)
 */
export async function GET(req: NextRequest) {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            database: 'unknown',
            redis: 'unknown',
            storage: 'unknown',
        }
    };

    // 1. Check Database
    try {
        const startDb = Date.now();
        await db.execute(sql`SELECT 1`);
        health.services.database = `healthy (${Date.now() - startDb}ms)`;
    } catch (err: any) {
        health.status = 'error';
        health.services.database = `unhealthy: ${err.message}`;
    }

    // 2. Check Redis
    try {
        const startRedis = Date.now();
        await redis.ping();
        health.services.redis = `healthy (${Date.now() - startRedis}ms)`;
    } catch (err: any) {
        health.status = 'error';
        health.services.redis = `unhealthy: ${err.message}`;
    }

    // 3. Check Storage (S3/R2)
    if (isCloudflareConfigured && s3Client) {
        try {
            const startS3 = Date.now();
            const command = new ListObjectsV2Command({
                Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                MaxKeys: 1
            });
            await s3Client.send(command);
            health.services.storage = `healthy (${Date.now() - startS3}ms)`;
        } catch (err: any) {
            health.status = 'error';
            health.services.storage = `unhealthy: ${err.message}`;
        }
    } else {
        health.services.storage = 'unconfigured (R2 credentials missing)';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;

    return NextResponse.json(health, { 
        status: statusCode,
        headers: {
            'Cache-Control': 'no-store, max-age=0'
        }
    });
}
