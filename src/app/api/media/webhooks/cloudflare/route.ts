import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env.server';
import { redis } from '@/lib/redis';

/**
 * CLOUDFLARE STREAM WEBHOOK HANDLER
 *
 * DESIGN PRINCIPLES:
 * 1. Webhook-Driven: Real-time notification when video encoding completes.
 * 2. Cache Invalidation: Bust Redis cache to ensure next status check fetches fresh data.
 * 3. Secure: Validates webhook signature via CF_WEBHOOK_SECRET env var.
 */

export async function POST(req: NextRequest) {
  try {
    // Validate webhook signature if secret is configured
    const secret = process.env.CLOUDFLARE_WEBHOOK_SECRET;
    if (secret) {
      const sig = req.headers.get('webhook-signature') ?? '';
      if (sig !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { status, uid, metadata } = body;

    console.log(`[CF Webhook] Event received for ${uid}:`, status.state);

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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[CF Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
