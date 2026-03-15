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
        const sessionData = await redis.get(`learning:session:${token}`);
        if (!sessionData) {
            return new NextResponse('Invalid or expired learning session', { status: 403 });
        }

        const lSession = JSON.parse(sessionData);
        if (lSession.userId !== userSession.userId || lSession.lessonId !== lessonId) {
            return new NextResponse('Session mismatch', { status: 403 });
        }

        // 3. Fetch Lesson Content
        const lesson = await db.query.lessons.findFirst({
            where: eq(lessons.id, lessonId)
        });

        if (!lesson || !lesson.content_url) {
            return new NextResponse('Content not found', { status: 404 });
        }

        let key = lesson.content_url;
        
        // Remove local proxy prefix if present
        if (key.includes('/api/media/r2/')) {
            key = key.split('/api/media/r2/')[1];
        } else if (key.startsWith('http')) {
            try {
                const url = new URL(key);
                key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            } catch (e) {}
        }

        // 4. Pipe the R2 stream / Get Metadata
        const range = req.headers.get('range');
        
        // Use HeadObjectCommand for HEAD requests to save bandwidth and prevent body errors
        if (method === 'HEAD') {
            const { getSignedDownloadUrl } = await import('@/lib/storage');
            const headUrl = await getSignedDownloadUrl(key, 60, 'HEAD');
            const headRes = await fetch(headUrl, { method: 'HEAD' });
            
            return new Response(null, {
                status: headRes.status,
                headers: headRes.headers
            });
        }

        const { body, contentType, contentLength, contentRange, acceptRanges } = await getObjectStream(key, range || undefined);

        if (!body) {
            return new NextResponse('Empty stream', { status: 404 });
        }

        // Forward appropriate headers
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
        
    } catch (error: any) {
        console.error(`[Video Stream ${method} Error]:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function GET(req: NextRequest, context: { params: Promise<{ lessonId: string }> }) {
    return handleStream(req, context, 'GET');
}

export async function HEAD(req: NextRequest, context: { params: Promise<{ lessonId: string }> }) {
    return handleStream(req, context, 'HEAD');
}
