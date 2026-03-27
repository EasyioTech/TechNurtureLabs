import { NextRequest, NextResponse } from 'next/server';
import { s3Client, isCloudflareConfigured } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';
import { serverEnv } from '@/lib/env.server';
import { verifySession } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { path: filePathParams } = await params;

        if (!isCloudflareConfigured || !s3Client) {
            return new NextResponse('Cloudflare R2 not configured', { status: 501 });
        }

        if (!filePathParams || filePathParams.length === 0) {
            return new NextResponse('File path not provided', { status: 400 });
        }

        const key = filePathParams.join('/');
        const range = request.headers.get('range');

        const commandInput: any = {
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Key: key,
        };

        if (range) {
            commandInput.Range = range;
        }

        const command = new GetObjectCommand(commandInput);
        const response = await s3Client.send(command);

        if (!response.Body) {
            return new NextResponse('File not found', { status: 404 });
        }

        const ext = path.extname(key).toLowerCase();
        const MIME_MAP: Record<string, string> = {
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
            '.m3u8': 'application/x-mpegURL',
            '.ts': 'video/MP2T',
            '.pdf': 'application/pdf',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
        };
        const mimeType = response.ContentType || MIME_MAP[ext] || 'application/octet-stream';

        const stream = response.Body.transformToWebStream();

        const headers = new Headers();
        headers.set('Content-Type', mimeType);
        if (response.ContentLength) headers.set('Content-Length', response.ContentLength.toString());
        if (response.ContentRange) headers.set('Content-Range', response.ContentRange);
        if (response.AcceptRanges) headers.set('Accept-Ranges', response.AcceptRanges);
        // private: browser may cache but CDNs must not — content is auth-gated per user
        headers.set('Cache-Control', 'private, max-age=3600, must-revalidate');
        headers.set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length');

        const isPartial = range && !!response.ContentRange;

        return new Response(stream as any, {
            status: isPartial ? 206 : 200,
            headers,
        });
    } catch (error: any) {
        if (error.name === 'NoSuchKey') {
            const ext = request.nextUrl.pathname.split('.').pop()?.toLowerCase();
            // Handle missing favicons gracefully - serve standard favicon from public folder
            if (ext === 'ico') {
                try {
                    const fallbackPath = path.join(process.cwd(), 'public', 'favicon.ico');
                    if (fs.existsSync(fallbackPath)) {
                        const fileBuffer = fs.readFileSync(fallbackPath);
                        return new Response(fileBuffer, { 
                            headers: { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=3600' } 
                        });
                    }
                } catch (e) { /* Fall through to 404 */ }
            }
            
            // For other missing images, return a tiny transparent pixel to avoid layout breakages and noise
            if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext || '')) {
                return new Response(
                    Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
                    { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'public, max-age=60' } }
                );
            }
            return new NextResponse('File not found', { status: 404 });
        }
        console.error('[R2 Proxy] Serving error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
