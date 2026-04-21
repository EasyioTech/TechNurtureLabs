import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { createDirectUpload, createTusUpload, isStreamConfigured } from '@/lib/services/cloudflare-stream';

/**
 * POST /api/media/stream-upload
 *
 * Generates a Cloudflare Stream Upload URL.
 * Supports both TUS (resumable) and Direct Creator Upload.
 *
 * Request body:
 *   { fileName: string, fileSize?: number, maxDurationSeconds?: number }
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
        const { fileName, fileSize, durationHint, maxDurationSeconds = 36000 } = body;

        // Use durationHint as a guide if available (fixes "infinite loop" for videos with moov at end)
        // We add a 20s buffer to ensure we don't cut off genuine content
        const finalMaxDuration = durationHint && durationHint > 0 
            ? Math.ceil(durationHint) + 20 
            : maxDurationSeconds;

        const meta: Record<string, string> = {
            maxDurationSeconds: finalMaxDuration.toString(),
        };
        if (fileName) meta.name = fileName;
        if (session.userId) meta.uploadedBy = session.userId;

        // Initialize TUS resumable upload (browser will use server proxy)
        const result = await createTusUpload(fileSize || 1024, meta);

        return NextResponse.json({
            uploadUrl: result.uploadUrl,
            uid: result.uid,
            isResumable: true,
            tusEndpoint: '/api/media/tus-proxy',
        });
    } catch (err: any) {
        console.error('[Stream Upload Error]:', err);
        return NextResponse.json(
            { error: err?.message || 'Failed to create stream upload' },
            { status: 500 }
        );
    }
}
