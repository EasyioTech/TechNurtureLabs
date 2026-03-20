import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { createDirectUpload, isStreamConfigured } from '@/lib/services/cloudflare-stream';

/**
 * POST /api/media/stream-upload
 *
 * Generates a Cloudflare Stream Direct Creator Upload URL.
 * The client will upload the video directly to Cloudflare's servers,
 * bypassing our Node.js API entirely.
 *
 * Request body:
 *   { fileName: string, maxDurationSeconds?: number }
 *
 * Response:
 *   { uploadUrl: string, uid: string }
 */
export async function POST(req: NextRequest) {
    try {
        // Auth: only admins can upload videos
        const session = await verifySession();
        if (
            !session ||
            (session.role !== 'super_admin' &&
                session.role !== 'school_admin' &&
                session.userType !== 'super_admin')
        ) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!isStreamConfigured()) {
            return NextResponse.json(
                { error: 'Cloudflare Stream is not configured on this server.' },
                { status: 503 }
            );
        }

        const body = await req.json();
        const { fileName, maxDurationSeconds = 36000 } = body;

        const meta: Record<string, string> = {};
        if (fileName) meta.name = fileName;
        if (session.userId) meta.uploadedBy = session.userId;

        const result = await createDirectUpload(maxDurationSeconds, meta);

        return NextResponse.json({
            uploadUrl: result.uploadUrl,
            uid: result.uid,
        });
    } catch (err: any) {
        console.error('[Stream Upload Error]:', err);
        return NextResponse.json(
            { error: err?.message || 'Failed to create stream upload' },
            { status: 500 }
        );
    }
}
