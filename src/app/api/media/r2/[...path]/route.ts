import { NextRequest, NextResponse } from 'next/server';
import { s3Client, isCloudflareConfigured, getSignedDownloadUrl } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { serverEnv } from '@/lib/env.server';
import { verifySession } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: filePathParams } = await params;
        const key = filePathParams.join('/');
        const ext = path.extname(key).toLowerCase();
        const isHls = ext === '.m3u8' || ext === '.ts';

        // 1. Authentication Check
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 2. Deployment Integrity Check
        if (!isCloudflareConfigured || !s3Client) {
            return new NextResponse('Cloudflare R2 not configured', { status: 501 });
        }

        // 3. SECURE REDIRECTION Strategy (M-10)
        // For non-HLS assets, we stop proxying immediately and redirect to a direct 
        // short-lived signed R2 URL. This offloads bandwidth from Next.js.
        if (!isHls) {
            try {
                const url = await getSignedDownloadUrl(key, 3600);
                return NextResponse.redirect(url, 302);
            } catch (err) {
                console.error('[R2 Proxy] Signed URL generation failed:', err);
                // Fall back to proxying if signing fails for some reason
            }
        }

        // 4. HLS Proxy with HMAC Validation
        // HLS segments are hard to sign individually. We use an HMAC token for the folder.
        const token = request.nextUrl.searchParams.get('token');
        const mediaSecret = process.env.MEDIA_SECRET;

        if (mediaSecret) {
            const signTarget = key.split('/').slice(0, -1).join('/'); // Check the parent folder signature
            const expectedHash = crypto
                .createHmac('sha256', mediaSecret)
                .update(signTarget)
                .digest('hex')
                .slice(0, 16);

            if (token !== expectedHash) {
                return new NextResponse('Forbidden: Invalid Media Token', { status: 403 });
            }
        } else {
            console.warn('[R2 Proxy] MEDIA_SECRET not set. Access is loosely guarded by session only.');
        }

        // Continue proxying for HLS segments (so relative paths in .m3u8 work)
        const range = request.headers.get('range');
        const commandInput: any = {
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Key: key,
        };
        if (range) commandInput.Range = range;

        const command = new GetObjectCommand(commandInput);
        const response = await s3Client.send(command);

        if (!response.Body) {
            return new NextResponse('File not found', { status: 404 });
        }

        const MIME_MAP: Record<string, string> = {
            '.m3u8': 'application/x-mpegURL',
            '.ts': 'video/MP2T',
        };
        const mimeType = response.ContentType || MIME_MAP[ext] || 'application/octet-stream';

        const stream = response.Body.transformToWebStream();
        const headers = new Headers();
        headers.set('Content-Type', mimeType);
        if (response.ContentLength) headers.set('Content-Length', response.ContentLength.toString());
        if (response.ContentRange) headers.set('Content-Range', response.ContentRange);
        headers.set('Cache-Control', 'private, max-age=3600');
        headers.set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length');

        const isPartial = range && !!response.ContentRange;
        return new Response(stream as any, { status: isPartial ? 206 : 200, headers });

    } catch (error: any) {
        if (error.name === 'NoSuchKey') {
            return new NextResponse('File not found', { status: 404 });
        }
        console.error('[R2 Proxy] Serving error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

