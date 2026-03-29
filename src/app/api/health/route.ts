import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * PRODUCTION MONITORING ENDPOINT
 * Checks connectivity to Redis and PostgreSQL.
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
        }
    };

    try {
        // 1. Check Database
        const startDb = Date.now();
        await db.execute(sql`SELECT 1`);
        health.services.database = `healthy (${Date.now() - startDb}ms)`;
    } catch (err: any) {
        health.status = 'error';
        health.services.database = `unhealthy: ${err.message}`;
    }

    try {
        // 2. Check Redis
        const startRedis = Date.now();
        await redis.ping();
        health.services.redis = `healthy (${Date.now() - startRedis}ms)`;
    } catch (err: any) {
        health.status = 'error';
        health.services.redis = `unhealthy: ${err.message}`;
    }

    const statusCode = health.status === 'ok' ? 200 : 503;

    return NextResponse.json(health, { 
        status: statusCode,
        headers: {
            'Cache-Control': 'no-store, max-age=0'
        }
    });
}
