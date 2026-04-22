import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { serverEnv } from '@/lib/env.server';

/**
 * Proxy endpoint for TUS protocol uploads (>= 200MB files)
 *
 * Supports all TUS protocol methods:
 * - POST: Create upload session
 * - PATCH: Upload chunk
 * - HEAD: Get upload offset (for resumability)
 * - OPTIONS: TUS capability discovery
 */

const PROXY_TIMEOUT_MS = 300000; // 5 minutes for chunk proxying (accommodates slow uploads)

async function proxyToCloudflare(
    method: string,
    tusUploadUrl: string,
    headers: Record<string, string>,
    body: ReadableStream<Uint8Array> | null
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    try {
        const fetchOptions: RequestInit & { duplex?: string } = {
            method,
            headers,
            signal: controller.signal,
        };

        if (body && (method === 'PATCH' || method === 'POST')) {
            fetchOptions.body = body;
            fetchOptions.duplex = 'half';
        }

        return await fetch(tusUploadUrl, fetchOptions);
    } finally {
        clearTimeout(timeoutId);
    }
}

function buildProxyHeaders(req: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {};

    // Forward all headers except client-specific or hop-by-hop ones
    req.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        if (![
            'host', 
            'connection', 
            'transfer-encoding', 
            'authorization',
            'cookie', // CRITICAL: Do not forward our site's cookies to Cloudflare
            'referer',
            'origin',
            'sec-fetch-dest',
            'sec-fetch-mode',
            'sec-fetch-site',
            'priority'
        ].includes(k)) {
            headers[key] = value;
        }
    });

    // Inject Cloudflare Authentication
    headers['Authorization'] = `Bearer ${serverEnv.CLOUDFLARE_STREAM_API_TOKEN}`;
    headers['Tus-Resumable'] = '1.0.0';

    return headers;
}

/**
 * OPTIONS /api/media/stream-upload/[uid]/chunk
 * TUS protocol capability discovery
 */
export async function OPTIONS() {
    const session = await verifySession();
    if (!session) {
        return new NextResponse(null, { status: 401 });
    }

    return new NextResponse(null, {
        status: 204,
        headers: {
            'Tus-Resumable': '1.0.0',
            'Tus-Version': '1.0.0',
            'Tus-Extension': 'creation,expiration',
            'Tus-Max-Chunk-Size': '52428800', // 50MB
        },
    });
}

/**
 * POST /api/media/stream-upload/[uid]/chunk
 * TUS protocol creation (simulated as session is already created server-side)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    const { uid } = await params;

    try {
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const tusData = await redis.get(`tusUpload:${uid}`);
        if (!tusData) {
            return new NextResponse(null, { status: 404 });
        }

        let tusUploadUrl: string;
        try {
            const parsed = JSON.parse(tusData);
            tusUploadUrl = parsed.tusUploadUrl;
        } catch (e) {
            console.error(`[TUS Proxy] Corrupted Redis data for ${uid}`);
            return new NextResponse('Internal Server Error: Session Data Corrupted', { status: 500 });
        }

        if (!tusUploadUrl) {
            return new NextResponse('Internal Server Error: Missing Upload URL', { status: 500 });
        }

        const proxyLocationUrl = `/api/media/stream-upload/${uid}/chunk`;

        return new NextResponse(null, {
            status: 201,
            headers: {
                'Location': proxyLocationUrl,
                'Tus-Resumable': '1.0.0',
                'Tus-Version': '1.0.0',
            },
        });
    } catch (error: any) {
        console.error('[TUS Proxy POST Error]:', error);
        return new NextResponse('Proxy request failed', { status: 500 });
    }
}

/**
 * PATCH /api/media/stream-upload/[uid]/chunk
 * Proxy chunk data to Cloudflare
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    const { uid } = await params;

    try {
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const tusData = await redis.get(`tusUpload:${uid}`);
        if (!tusData) {
            return new NextResponse(null, { status: 404 });
        }

        let tusUploadUrl: string;
        try {
            const parsed = JSON.parse(tusData);
            tusUploadUrl = parsed.tusUploadUrl;
        } catch (e) {
            return new NextResponse('Session data corrupted', { status: 500 });
        }

        if (!tusUploadUrl) {
            return new NextResponse('Missing upload session URL', { status: 500 });
        }

        const headers = buildProxyHeaders(req);
        const cfResponse = await proxyToCloudflare('PATCH', tusUploadUrl, headers, req.body);

        const responseHeaders: Record<string, string> = {
            'Access-Control-Expose-Headers': 'Upload-Offset, Upload-Length, Tus-Resumable, Location',
        };
        
        cfResponse.headers.forEach((value, key) => {
            if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
                responseHeaders[key] = value;
            }
        });

        return new NextResponse(cfResponse.body, {
            status: cfResponse.status,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error('[TUS Proxy PATCH Error]:', error);
        return new NextResponse('Proxy request failed', { status: 500 });
    }
}

/**
 * HEAD /api/media/stream-upload/[uid]/chunk
 * Check upload offset for resumability
 */
export async function HEAD(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    const { uid } = await params;

    try {
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const tusData = await redis.get(`tusUpload:${uid}`);
        if (!tusData) {
            return new NextResponse(null, { status: 404 });
        }

        let tusUploadUrl: string;
        try {
            const parsed = JSON.parse(tusData);
            tusUploadUrl = parsed.tusUploadUrl;
        } catch (e) {
            return new NextResponse('Session data corrupted', { status: 500 });
        }

        if (!tusUploadUrl) {
            return new NextResponse('Missing upload session URL', { status: 500 });
        }
        const headers = buildProxyHeaders(req);
        const cfResponse = await proxyToCloudflare('HEAD', tusUploadUrl, headers, null);

        const responseHeaders: Record<string, string> = {
            'Access-Control-Expose-Headers': 'Upload-Offset, Upload-Length, Tus-Resumable, Location',
        };
        
        cfResponse.headers.forEach((value, key) => {
            if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
                responseHeaders[key] = value;
            }
        });

        return new NextResponse(null, {
            status: cfResponse.status,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error('[TUS Proxy HEAD Error]:', error);
        return new NextResponse('Proxy request failed', { status: 500 });
    }
}
