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

        if (!isCloudflareConfigured || !s3Client) {
            return new NextResponse('R2 not configured', { status: 503 });
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
        console.error('[Presign Error]:', err);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
