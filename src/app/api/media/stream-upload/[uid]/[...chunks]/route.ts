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
 *
 * Proxies requests to Cloudflare's TUS endpoint while injecting authentication
 * and maintaining session data server-side.
 *
 * CRITICAL FIXES:
 * 1. Injects Authorization: Bearer token (was missing, causing 401)
 * 2. Stores/retrieves actual TUS URL from Cloudflare (not list endpoint)
 * 3. Adds HEAD handler for resumable uploads
 * 4. Adds OPTIONS handler for TUS discovery
 */

async function proxyToCloudflare(
    method: string,
    tusUploadUrl: string,
    headers: Record<string, string>,
    body: ReadableStream<Uint8Array> | null
): Promise<Response> {
    const fetchOptions: RequestInit & { duplex?: string } = {
        method,
        headers,
    };

    if (body && (method === 'PATCH' || method === 'POST')) {
        fetchOptions.body = body;
        // Required for streaming body in fetch
        fetchOptions.duplex = 'half';
    }

    return fetch(tusUploadUrl, fetchOptions);
}

function buildProxyHeaders(req: NextRequest): Record<string, string> {
    const headers: Record<string, string> = {};

    // Forward all headers except hop-by-hop ones and authorization
    req.headers.forEach((value, key) => {
        if (!['host', 'connection', 'transfer-encoding', 'authorization'].includes(key.toLowerCase())) {
            headers[key] = value;
        }
    });

    // NOTE: We do NOT inject Authorization: Bearer here because the tusUploadUrl 
    // from Cloudflare Stream direct_upload is already a SIGNED URL.
    // Adding an Authorization header can cause conflicts or "Decoding Errors".

    // TUS protocol requirements
    headers['Tus-Resumable'] = '1.0.0';

    return headers;
}

export async function OPTIONS(): Promise<NextResponse> {
    // TUS capability discovery
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

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string; chunks: string[] }> }
) {
    const { uid } = await params;

    try {
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get the TUS upload URL stored from initial upload request
        const tusData = await redis.get(`tusUpload:${uid}`);
        if (!tusData) {
            return NextResponse.json(
                { error: 'Upload session not found' },
                { status: 404 }
            );
        }

        // CRITICAL FIX: Use actual TUS upload URL (not list endpoint)
        const { tusUploadUrl } = JSON.parse(tusData);
        if (!tusUploadUrl) {
            console.error('[TUS Proxy] Missing tusUploadUrl in Redis data');
            return NextResponse.json(
                { error: 'Upload configuration corrupted' },
                { status: 500 }
            );
        }

        // CRITICAL REVERSION: POST should NOT forward to Cloudflare
        // TUS session was already created server-side by createTusUploadUrl()
        // tus-js-client expects POST to return 201 Created with Location header
        // Location header MUST point to our proxy (not Cloudflare), so PATCH goes through proxy
        // We use a relative path to ensure the browser resolves it against the public origin
        // instead of internal Docker/0.0.0.0 addresses.
        const proxyLocationUrl = `/api/media/stream-upload/${uid}/chunk`;

        console.log(`[TUS Proxy] POST for ${uid}: returning 201 with relative location: ${proxyLocationUrl}`);

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
        return NextResponse.json(
            { error: error?.message || 'Proxy request failed' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string; chunks: string[] }> }
) {
    const { uid } = await params;

    try {
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const tusData = await redis.get(`tusUpload:${uid}`);
        if (!tusData) {
            return NextResponse.json(
                { error: 'Upload session not found' },
                { status: 404 }
            );
        }

        // CRITICAL FIX: Use actual TUS upload URL (not list endpoint)
        const { tusUploadUrl } = JSON.parse(tusData);
        if (!tusUploadUrl) {
            console.error('[TUS Proxy] Missing tusUploadUrl in Redis data');
            return NextResponse.json(
                { error: 'Upload configuration corrupted' },
                { status: 500 }
            );
        }

        const headers = buildProxyHeaders(req);

        const cfResponse = await proxyToCloudflare(
            'PATCH',
            tusUploadUrl,
            headers,
            req.body
        );

        // Forward response headers
        const responseHeaders: Record<string, string> = {};
        cfResponse.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        return new NextResponse(cfResponse.body, {
            status: cfResponse.status,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error('[TUS Proxy PATCH Error]:', error);
        return NextResponse.json(
            { error: error?.message || 'Proxy request failed' },
            { status: 500 }
        );
    }
}

export async function HEAD(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string; chunks: string[] }> }
) {
    const { uid } = await params;

    try {
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const tusData = await redis.get(`tusUpload:${uid}`);
        if (!tusData) {
            return NextResponse.json(
                { error: 'Upload session not found' },
                { status: 404 }
            );
        }

        // CRITICAL FIX: Use actual TUS upload URL (not list endpoint)
        const { tusUploadUrl } = JSON.parse(tusData);
        if (!tusUploadUrl) {
            console.error('[TUS Proxy] Missing tusUploadUrl in Redis data');
            return NextResponse.json(
                { error: 'Upload configuration corrupted' },
                { status: 500 }
            );
        }

        const headers = buildProxyHeaders(req);

        const cfResponse = await proxyToCloudflare(
            'HEAD',
            tusUploadUrl,
            headers,
            null
        );

        // Forward response headers (especially Upload-Offset for resumability)
        const responseHeaders: Record<string, string> = {};
        cfResponse.headers.forEach((value, key) => {
            responseHeaders[key] = value;
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
