import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getVideoStatus } from '@/lib/services/cloudflare-stream';

/**
 * GET /api/media/stream-status/[uid]
 *
 * Returns the processing status of a Cloudflare Stream video.
 * Used by the client to poll until the video is ready to stream.
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

        const status = await getVideoStatus(uid);

        return NextResponse.json({
            ...status
        });
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
