import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { lessons } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

        // SECURITY: Validate lessonId is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!lessonId || !uuidRegex.test(lessonId)) {
            return new NextResponse('Invalid lesson ID format', { status: 400 });
        }

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

        // 5. Handle Cloudflare R2 — generate a short-lived signed URL and redirect.
        //
        // Previously the server proxied the entire video stream, holding a Node.js
        // worker open for the full video duration. At 100 concurrent viewers that
        // exhausts all worker slots and makes the rest of the site unresponsive.
        //
        // A 307 redirect hands the transfer off to R2/Cloudflare directly. The
        // Node.js worker is freed as soon as the redirect is returned (~1ms).
        // Range requests work natively: the browser re-sends the Range header to R2
        // when following the redirect, so seeking/buffering is unaffected.
        //
        // The signed URL expires in 30 minutes. Even if captured, it cannot be used
        // beyond that window — and the learning-session gate still controls issuance.
        const { getSignedDownloadUrl, isCloudflareConfigured } = await import('@/lib/storage');

        if (!isCloudflareConfigured) {
            return new NextResponse('Cloud Storage not configured', { status: 501 });
        }

        try {
            const signedMethod = method === 'HEAD' ? 'HEAD' : 'GET';
            const signedUrl = await getSignedDownloadUrl(key, 1800, signedMethod);
            // 307 Temporary Redirect preserves the HTTP method (GET stays GET, HEAD stays HEAD)
            return NextResponse.redirect(signedUrl, { status: 307 });
        } catch (signErr: any) {
            console.error('[Video Stream R2 Sign Error]:', signErr);
            if (signErr.name === 'NoSuchKey' || signErr.name === 'NotFound') {
                return new NextResponse('File not found in R2', { status: 404 });
            }
            return new NextResponse(signErr.message || 'Failed to generate stream URL', { status: 502 });
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
