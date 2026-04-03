import { NextRequest, NextResponse } from 'next/server';
import { getSignedDownloadUrl, s3Client, isCloudflareConfigured } from '@/lib/storage';
import { verifySession } from '@/lib/auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { serverEnv } from '@/lib/env.server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * 🔒 SECURE PRESIGNED UPLOAD API
 * Allows client to upload large files (up to 2GB) directly to R2.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { fileName, fileType, folder = 'library' } = await req.json();

        if (!fileName || !fileType) {
            return new NextResponse('Missing filename or type', { status: 400 });
        }

        // SECURITY: MIME type allowlist
        const ALLOWED_MIME_TYPES = new Set([
            'video/mp4', 'video/quicktime', 'video/webm',
            'application/pdf',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
            'audio/mpeg'
        ]);
        if (!ALLOWED_MIME_TYPES.has(fileType)) {
            return new NextResponse('File type not permitted', { status: 400 });
        }

        // SECURITY: Folder allowlist — extract first path segment only
        const folderSegment = (folder as string).split('/')[0];
        const ALLOWED_FOLDERS = new Set(['library', 'courses', 'lessons', 'assignments', 'branding', 'avatars']);
        if (!ALLOWED_FOLDERS.has(folderSegment)) {
            return new NextResponse('Folder not permitted', { status: 400 });
        }

        if (!isCloudflareConfigured || !s3Client) {
            return new NextResponse(JSON.stringify({ error: 'R2 storage not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
        }

        // CRITICAL: Verify R2 connectivity by attempting a HEAD request to bucket
        try {
            const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
            const headCmd = new HeadBucketCommand({ Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME });
            await s3Client.send(headCmd);
        } catch (connErr: any) {
            const msg = `R2 connectivity failed: ${connErr?.message || 'Unknown error'}`;
            console.error('[Presign]', msg);
            return new NextResponse(JSON.stringify({ error: msg, code: 'R2_CONNECTIVITY_FAILED' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const ext = path.extname(fileName);
        const key = `${folder}/${uuidv4()}${ext}`;

        const command = new PutObjectCommand({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        // Generate URL valid for 10 minutes
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

        return NextResponse.json({
            uploadUrl,
            key,
            publicUrl: `/api/media/r2/${key}` // We use our proxy prefix for runtime URL consistency
        });

    } catch (err: any) {
        const errorMsg = err?.message || 'Internal Server Error';
        console.error('[Presign] Error:', {
            message: errorMsg,
            code: err?.$metadata?.httpStatusCode || err?.code,
            name: err?.name
        });
        return new NextResponse(JSON.stringify({
            error: errorMsg,
            code: err?.$metadata?.httpStatusCode || err?.code,
            details: process.env.NODE_ENV === 'development' ? err?.message : undefined
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
