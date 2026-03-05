import { NextRequest, NextResponse } from 'next/server';
import { s3Client, isCloudflareConfigured } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: filePathParams } = await params;

        if (!isCloudflareConfigured || !s3Client) {
            return new NextResponse('Cloudflare R2 not configured', { status: 501 });
        }

        if (!filePathParams || filePathParams.length === 0) {
            return new NextResponse('File path not provided', { status: 400 });
        }

        const key = filePathParams.join('/');

        const command = new GetObjectCommand({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME as string,
            Key: key,
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            return new NextResponse('File not found', { status: 404 });
        }

        // MIME type lookup (fallback)
        const ext = path.extname(key).toLowerCase();
        const MIME_MAP: Record<string, string> = {
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
            '.pdf': 'application/pdf',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
        };
        const mimeType = response.ContentType || MIME_MAP[ext] || 'application/octet-stream';

        // Convert the SDK stream to a Web Stream that Next.js understands
        // Note: response.Body.transformToWebStream() is available in @aws-sdk/client-s3 v3.x
        const stream = response.Body.transformToWebStream();

        return new NextResponse(stream as any, {
            headers: {
                'Content-Type': mimeType,
                'Content-Length': response.ContentLength?.toString() || '',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error: any) {
        if (error.name === 'NoSuchKey') {
            return new NextResponse('File not found', { status: 404 });
        }
        console.error('[R2 Proxy] Serving error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
