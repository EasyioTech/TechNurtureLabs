import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { createDirectUpload, createTusUploadUrl, isStreamConfigured } from '@/lib/services/cloudflare-stream';

/**
 * POST /api/media/stream-upload
 *
 * Generates a Cloudflare Stream Direct Creator Upload URL.
 * Follows CF Stream best practices:
 * - Direct upload from browser to Cloudflare (no proxy relay)
 * - Minimal metadata
 * - Fast one-time URL generation
 *
 * Request body:
 *   { fileName: string, fileSize?: number }
 */
export async function POST(req: NextRequest) {
    try {
        // Auth: only admins can upload videos
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!isStreamConfigured()) {
            return NextResponse.json(
                { error: 'Cloudflare Stream is not configured on this server.' },
                { status: 503 }
            );
        }

        const body = await req.json();
        const { fileName, fileSize } = body;

        // Minimal metadata for Cloudflare Stream
        // Cloudflare handles transcoding/processing automatically
        const meta: Record<string, string> = {};
        if (fileName) meta.name = fileName;
        if (session.userId) meta.uploadedBy = session.userId;

        // Choose upload method based on file size
        // < 200MB: basic POST (simple, fast)
        // >= 200MB: TUS protocol (resumable, chunked)
        const fileSizeBytes = fileSize || 0;
        const result = fileSizeBytes < 200 * 1024 * 1024
            ? await createDirectUpload(fileSizeBytes, meta)
            : await createTusUploadUrl(fileSizeBytes, meta);

        console.log(`[Stream Upload] UID: ${result.uid}, TUS upload URL ready`);

        return NextResponse.json({
            uploadURL: result.uploadUrl,
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
