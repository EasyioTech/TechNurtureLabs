import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getVideoStatus } from '@/lib/services/cloudflare-stream';
import { redis } from '@/lib/redis';

/**
 * GET /api/media/stream-status/[uid]
 *
 * Returns the processing status of a Cloudflare Stream video.
 * Uses Redis cache (5 min TTL) to avoid hammering Cloudflare API.
 * Webhook updates cache on video ready.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { uid } = await params;
        const cacheKey = `cf-stream:${uid}`;

        // Try Redis cache first (5 min TTL)
        let cachedStatus = await redis.get(cacheKey);

        if (cachedStatus) {
            return NextResponse.json(JSON.parse(cachedStatus));
        }

        // Cache miss: fetch from Cloudflare
        const status = await getVideoStatus(uid);

        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(status));

        return NextResponse.json(status);
    } catch (err: any) {
        console.error('[Stream Status Error]:', err);
        return NextResponse.json(
            { error: err?.message || 'Failed to get stream status' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/media/stream-status/[uid]
 *
 * Deletes a video from Cloudflare Stream.
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { uid } = await params;
        const { deleteStreamVideo } = await import('@/lib/services/cloudflare-stream');
        
        await deleteStreamVideo(uid);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Stream Delete Error]:', err);
        return NextResponse.json(
            { error: err?.message || 'Failed to delete stream video' },
            { status: 500 }
        );
    }
}
