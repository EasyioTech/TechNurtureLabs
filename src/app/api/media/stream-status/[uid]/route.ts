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
            uid: status.uid,
            readyToStream: status.readyToStream,
            state: status.status.state,
            pctComplete: status.status.pctComplete,
            duration: status.duration,
            thumbnail: status.thumbnail,
            playback: status.playback,
        });
    } catch (err: any) {
        console.error('[Stream Status Error]:', err);
        return NextResponse.json(
            { error: err?.message || 'Failed to get stream status' },
            { status: 500 }
        );
    }
}
