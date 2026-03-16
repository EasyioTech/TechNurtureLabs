import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { lessons } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getObjectStream } from '@/lib/storage';
import { redis } from '@/lib/redis';

/**
 * Streaming Proxy: Verifies lesson sessions before piping the R2 stream directly.
 * Native support for Range requests (Partial Content) to ensure smooth playback and seeking.
 */
async function handleStream(req: NextRequest, context: { params: Promise<{ lessonId: string }> }, method: 'GET' | 'HEAD') {
    try {
        const { lessonId } = await context.params;
        const searchParams = req.nextUrl.searchParams;
        const token = searchParams.get('token');

        if (!token) {
            return new NextResponse('Missing session token', { status: 401 });
        }

        // 1. Authenticate the User
        const userSession = await verifySession();
        if (!userSession) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 2. Validate the Learning Session
        let sessionData: string | null = null;
        try {
            sessionData = await redis.get(`learning:session:${token}`);
        } catch (redisErr) {
            console.error('[Video Stream] Redis connection error:', redisErr);
            // Fallback: If redis is down, we might want to check the DB session as a last resort,
            // but for streaming security, we prefer a hard fail with 503 instead of 500.
            return new NextResponse('Authentication Service Unavailable', { status: 503 });
        }

        if (!sessionData) {
            return new NextResponse('Invalid or expired learning session', { status: 403 });
        }

        const lSession = JSON.parse(sessionData);
        if (lSession.userId !== userSession.userId || lSession.lessonId !== lessonId) {
            return new NextResponse('Session mismatch', { status: 403 });
        }

        // 3. Fetch Lesson Content + Asset Metadata
        const lesson = await db.query.lessons.findFirst({
            where: eq(lessons.id, lessonId),
            with: {
                asset: true
            }
        });

        if (!lesson || !lesson.content_url) {
            return new NextResponse('Content not found', { status: 404 });
        }

        const storageType = (lesson as any).asset?.storage_type || (lesson.content_url.includes('/api/media/r2/') ? 'r2' : 'local');
        let key = lesson.content_url;
        
        // Normalize key
        if (key.includes('/api/media/r2/')) {
            key = key.split('/api/media/r2/')[1];
        } else if (key.includes('/api/media/')) {
            key = key.split('/api/media/')[1];
        } else if (key.startsWith('http')) {
            try {
                const url = new URL(key);
                key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            } catch (e) {}
        }

        const range = req.headers.get('range');

        // 4. Handle Local Storage 
        if (storageType === 'local') {
            const { getLocalObjectStream } = await import('@/lib/storage');
            try {
                const { body, contentType, contentLength, contentRange, acceptRanges } = await getLocalObjectStream(key, range || undefined);
                
                const resHeaders = new Headers();
                if (contentType) resHeaders.set('Content-Type', contentType);
                if (contentLength) resHeaders.set('Content-Length', contentLength.toString());
                if (contentRange) resHeaders.set('Content-Range', contentRange);
                if (acceptRanges) resHeaders.set('Accept-Ranges', acceptRanges);
                
                return new Response(method === 'HEAD' ? null : body as any, {
                    status: range ? 206 : 200,
                    headers: resHeaders
                });
            } catch (err: any) {
                console.error('[Video Stream Local Error]:', err);
                return new NextResponse('File not found in local storage', { status: 404 });
            }
        }

        // 5. Handle Cloudflare R2
        if (method === 'HEAD') {
            const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
            const { s3Client, isCloudflareConfigured } = await import('@/lib/storage');
            
            if (!s3Client || !isCloudflareConfigured) {
                return new NextResponse('Cloud Storage not configured', { status: 501 });
            }

            try {
                const headCommand = new HeadObjectCommand({
                    Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
                    Key: key
                });
                const headRes = await s3Client.send(headCommand);
                
                const resHeaders = new Headers();
                if (headRes.ContentType) resHeaders.set('Content-Type', headRes.ContentType);
                if (headRes.ContentLength) resHeaders.set('Content-Length', headRes.ContentLength.toString());
                if (headRes.AcceptRanges) resHeaders.set('Accept-Ranges', headRes.AcceptRanges);
                
                return new Response(null, {
                    status: 200,
                    headers: resHeaders
                });
            } catch (headErr: any) {
                if (headErr.name === 'NoSuchKey' || headErr.name === 'NotFound') {
                    return new NextResponse('File not found in R2', { status: 404 });
                }
                throw headErr;
            }
        }

        try {
            const { getObjectStream } = await import('@/lib/storage');
            const { body, contentType, contentLength, contentRange, acceptRanges } = await getObjectStream(key, range || undefined);

            if (!body) {
                return new NextResponse('Empty stream from storage', { status: 404 });
            }

            const resHeaders = new Headers();
            if (contentType) resHeaders.set('Content-Type', contentType);
            if (contentLength) resHeaders.set('Content-Length', contentLength.toString());
            if (contentRange) resHeaders.set('Content-Range', contentRange);
            if (acceptRanges) resHeaders.set('Accept-Ranges', acceptRanges);
            
            resHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            resHeaders.set('Connection', 'keep-alive');

            return new Response(body as any, {
                status: range ? 206 : 200,
                headers: resHeaders
            });
        } catch (streamErr: any) {
            console.error('[Video Stream R2 Error]:', streamErr);
            if (streamErr.name === 'NoSuchKey' || streamErr.name === 'NotFound') {
                return new NextResponse('File not found in R2', { status: 404 });
            }
            return new NextResponse(streamErr.message || 'Stream Error', { status: 502 });
        }
        
    } catch (error: any) {
        console.error(`[Video Stream ${method} Fatal Error]:`, error);
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
    }
}

export async function GET(req: NextRequest, context: { params: Promise<{ lessonId: string }> }) {
    return handleStream(req, context, 'GET');
}

export async function HEAD(req: NextRequest, context: { params: Promise<{ lessonId: string }> }) {
    return handleStream(req, context, 'HEAD');
}
