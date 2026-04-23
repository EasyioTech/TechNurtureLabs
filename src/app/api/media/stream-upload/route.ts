import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { createDirectUpload, createTusUploadUrl, isStreamConfigured } from '@/lib/services/cloudflare-stream';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import crypto from 'crypto';

/**
 * POST /api/media/stream-upload
 *
 * Initiates video upload to Cloudflare Stream with comprehensive validation.
 *
 * For files < 200MB: Returns direct upload URL (basic POST)
 * For files >= 200MB: Returns proxy endpoint URL (TUS protocol via server)
 *
 * Creates media_assets row with status 'processing' for tracking.
 *
 * Request body:
 *   { fileName: string, fileSize?: number }
 *
 * Response:
 *   { uploadURL: string, uid: string, assetId: string, isTus?: boolean }
 */

const MAX_FILE_SIZE = 30 * 1024 * 1024 * 1024; // 30GB
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska', 'application/octet-stream'];
const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'mkv', 'webm', 'avi', 'flv', 'wmv', 'm4v', 'mts', 'ts', 'mpg', 'mpeg'];

function calculateMaxDurationSeconds(fileSizeBytes: number): number {
    const fileSizeGB = fileSizeBytes / (1024 ** 3);
    const baseSeconds = Math.ceil((fileSizeGB * 8) / 2.5); // 2.5 Mbps bitrate assumption
    const withBuffer = Math.ceil(baseSeconds * 1.2); // 20% buffer for network overhead
    // Floor: 1 hour minimum, Ceiling: 24 hours maximum
    return Math.max(3600, Math.min(86400, withBuffer));
}

function validateVideoFile(fileName: string, mimeType: string): boolean {
    // Check extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        return false;
    }

    // Check MIME type (allow application/octet-stream for edge cases)
    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
        return false;
    }

    return true;
}

export async function POST(req: NextRequest) {
    try {
        // Auth: only authenticated users can upload videos
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
        const { fileName, fileSize, mimeType } = body;

        // 1. GUARD: 30GB max file size
        const fileSizeBytes = fileSize || 0;
        if (fileSizeBytes > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File exceeds 30GB maximum. Got ${(fileSizeBytes / 1024 / 1024 / 1024).toFixed(2)}GB` },
                { status: 400 }
            );
        }

        // 2. GUARD: Validate video format by extension and MIME type
        if (!validateVideoFile(fileName || '', mimeType || '')) {
            return NextResponse.json(
                { error: 'Only video files are supported (MP4, MOV, MKV, WebM, AVI, FLV, WMV)' },
                { status: 400 }
            );
        }

        // 3. Calculate dynamic maxDurationSeconds based on file size
        const maxDurationSeconds = calculateMaxDurationSeconds(fileSizeBytes);

        // Metadata for Cloudflare Stream
        const meta: Record<string, string> = {};
        if (fileName) meta.name = fileName;
        if (session.userId) meta.uploadedBy = session.userId;

        const isTusUpload = fileSizeBytes >= 200 * 1024 * 1024;

        if (!isTusUpload) {
            // Small files: direct POST to Cloudflare
            const result = await createDirectUpload(fileSizeBytes, maxDurationSeconds, meta);

            // Create media_assets row with processing status
            let assetId: string | undefined;
            try {
                // Insert returns inserted rows array
                const inserted = await db.insert(mediaAssets).values({
                    file_name: `${result.uid}.mp4`,
                    original_name: fileName,
                    file_url: `cf-stream://${result.uid}`,
                    file_path: result.uid,
                    mime_type: mimeType || 'video/mp4',
                    file_size: fileSizeBytes, // Drizzle expects number (not BigInt) — schema has mode: 'number'
                    storage_type: 'cloudflare_stream',
                    asset_type: 'video',
                    processing_status: 'processing',
                    uploaded_by: session.userId,
                }).returning({ id: mediaAssets.id });
                assetId = inserted[0]?.id;
            } catch (dbErr) {
                console.warn('[Stream Upload] Failed to create media_assets row:', dbErr);
                // Continue anyway — upload is already initiated
            }

            console.log(`[Stream Upload] UID: ${result.uid}, direct upload, asset: ${assetId}`);

            return NextResponse.json({
                uploadURL: result.uploadUrl,
                uid: result.uid,
                assetId,
                isTus: false,
            });
        }

        // Large files: TUS protocol via server proxy
        const result = await createTusUploadUrl(fileSizeBytes, maxDurationSeconds, meta);

        // Create media_assets row with processing status
        let assetId: string | undefined;
        try {
            const inserted = await db.insert(mediaAssets).values({
                file_name: `${result.uid}.mp4`,
                original_name: fileName,
                file_url: `cf-stream://${result.uid}`,
                file_path: result.uid,
                mime_type: mimeType || 'video/mp4',
                file_size: fileSizeBytes, // Drizzle expects number (not BigInt)
                storage_type: 'cloudflare_stream',
                asset_type: 'video',
                processing_status: 'processing',
                uploaded_by: session.userId,
            }).returning({ id: mediaAssets.id });
            assetId = inserted[0]?.id;
        } catch (dbErr) {
            console.warn('[Stream Upload] Failed to create media_assets row:', dbErr);
            // Continue anyway — upload is already initiated
        }

        console.log(`[Stream Upload] UID: ${result.uid}, TUS direct, asset: ${assetId}`);

        return NextResponse.json({
            uploadURL: result.uploadUrl,
            uid: result.uid,
            assetId,
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
