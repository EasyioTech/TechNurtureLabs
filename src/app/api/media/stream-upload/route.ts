import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { createDirectUpload, createTusUploadUrl, isStreamConfigured } from '@/lib/services/cloudflare-stream';
import { redis } from '@/lib/redis';

/**
 * POST /api/media/stream-upload
 *
 * Initiates video upload to Cloudflare Stream.
 *
 * For files < 200MB: Returns direct upload URL (basic POST)
 * For files >= 200MB: Returns proxy endpoint URL (TUS protocol via server)
 *
 * Request body:
 *   { fileName: string, fileSize?: number }
 *
 * Response:
 *   { uploadURL: string, uid: string, isTus?: boolean }
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
        const meta: Record<string, string> = {};
        if (fileName) meta.name = fileName;
        if (session.userId) meta.uploadedBy = session.userId;

        const fileSizeBytes = fileSize || 0;
        const isTusUpload = fileSizeBytes >= 200 * 1024 * 1024;

        if (!isTusUpload) {
            // Small files: direct POST to Cloudflare
            const result = await createDirectUpload(fileSizeBytes, meta);
            console.log(`[Stream Upload] UID: ${result.uid}, direct upload`);

            return NextResponse.json({
                uploadURL: result.uploadUrl,
                uid: result.uid,
                isTus: false,
            });
        }

        // Large files: TUS protocol via server proxy
        const result = await createTusUploadUrl(fileSizeBytes, meta);

        try {
            // For TUS, use base API endpoint (not the signed URL which is for direct uploads)
            // tus-js-client will send to our proxy, which adds auth and forwards to Cloudflare's API
            const tusEndpoint = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream`;

            // Store TUS config in Redis with 1 hour expiry
            await redis.setex(
                `tusUpload:${result.uid}`,
                3600,
                JSON.stringify({
                    tusEndpoint,
                    fileName,
                    fileSize: fileSizeBytes,
                    createdAt: new Date().toISOString(),
                })
            );
        } catch (err) {
            console.warn('[Stream Upload] Redis unavailable, proxy will not work', err);
        }

        // Return our proxy URL instead of Cloudflare's endpoint
        const proxyUrl = `/api/media/stream-upload/${result.uid}/chunk`;
        console.log(`[Stream Upload] UID: ${result.uid}, TUS via proxy`);

        return NextResponse.json({
            uploadURL: proxyUrl,
            uid: result.uid,
            isTus: true,
        });
    } catch (err: any) {
        console.error('[Stream Upload Error]:', err);
        return NextResponse.json(
            { error: err?.message || 'Failed to create stream upload' },
            { status: 500 }
        );
    }
}
