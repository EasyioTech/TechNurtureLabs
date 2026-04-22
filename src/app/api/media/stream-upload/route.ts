import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { createDirectUpload, createTusUpload, isStreamConfigured } from '@/lib/services/cloudflare-stream';

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
        const { fileName } = body;

        // Minimal metadata for Cloudflare Stream
        // Cloudflare handles transcoding/processing automatically
        const meta: Record<string, string> = {};
        if (fileName) meta.name = fileName;
        if (session.userId) meta.uploadedBy = session.userId;

        // Use createTusUpload for resumable uploads (supports >200MB)
        const result = await createTusUpload(body.fileSize || 0, Object.keys(meta).length > 0 ? meta : undefined);

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
