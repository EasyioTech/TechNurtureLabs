import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env.server';
import Redis from 'ioredis';

/**
 * CLOUDFLARE STREAM WEBHOOK HANDLER
 * 
 * DESIGN PRINCIPLES:
 * 1. Event-Driven: Replaces expensive polling with immediate completion notification.
 * 2. Status Synchronization: Ensures the backend knows exactly when a video is ready.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { status, uid, metadata } = body;

    console.log(`[CF Webhook] Event received for ${uid}:`, status.state);

    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const cacheKey = `cf-stream:${uid}`;

    if (status.state === 'ready') {
        console.log(`[CF Webhook] ✓ Video ${uid} READY TO STREAM`);

        // Invalidate status cache so next poll fetches fresh Cloudflare data
        await redis.del(cacheKey);
        console.log(`[CF Webhook] Cache invalidated for ${uid}`);

        // Optionally update DB here when video is fully ready:
        // await db.update(lessons).set({ videoReady: true }).where(eq(lessons.videoUid, uid));
    }

    if (status.state === 'error') {
        console.error(`[CF Webhook] ✗ Video ${uid} failed:`, status.errorReasonText);

        // Invalidate cache on error too
        await redis.del(cacheKey);
    }

    await redis.quit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[CF Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
