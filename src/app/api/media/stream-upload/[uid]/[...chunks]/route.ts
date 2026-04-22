import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { redis } from '@/lib/redis';

/**
 * Proxy endpoint for TUS protocol uploads (>= 200MB files)
 *
 * POST /api/media/stream-upload/{uid}/chunk
 * PATCH /api/media/stream-upload/{uid}/chunk
 *
 * Proxies TUS requests to Cloudflare's API while keeping the token server-side
 */

async function proxyToCloudflare(
    method: string,
    tusEndpoint: string,
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

    return fetch(tusEndpoint, fetchOptions);
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

        // Get the TUS endpoint stored from initial upload request
        const tusData = await redis.get(`tusUpload:${uid}`);
        if (!tusData) {
            return NextResponse.json(
                { error: 'Upload session not found' },
                { status: 404 }
            );
        }

        const { tusEndpoint } = JSON.parse(tusData);

        // Forward headers (filter out hop-by-hop headers)
        const headers: Record<string, string> = {};
        req.headers.forEach((value, key) => {
            if (!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
                headers[key] = value;
            }
        });

        const cfResponse = await proxyToCloudflare(
            'POST',
            tusEndpoint,
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

        const { tusEndpoint } = JSON.parse(tusData);

        // Forward headers
        const headers: Record<string, string> = {};
        req.headers.forEach((value, key) => {
            if (!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
                headers[key] = value;
            }
        });

        const cfResponse = await proxyToCloudflare(
            'PATCH',
            tusEndpoint,
            headers,
            req.body
        );

        // Forward response
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
