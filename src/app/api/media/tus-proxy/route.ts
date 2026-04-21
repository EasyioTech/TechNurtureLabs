import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

/**
 * TUS Proxy Endpoint
 *
 * Relays all TUS protocol requests from browser to Cloudflare's TUS API.
 * This bypasses CORS restrictions by keeping all browser requests to same-origin server.
 *
 * Browser flow:
 * 1. POST /api/media/tus-proxy (upload initialization, gets sessionUrl)
 * 2. Browser uses sessionUrl for TUS chunk uploads
 * 3. All requests (POST, PATCH, HEAD) proxied through this endpoint
 *
 * Query params:
 *   ?method=patch|post|head - HTTP method to use
 *   ?url=<encoded-url> - Cloudflare TUS endpoint URL
 *   ?offset=N - For resumable offset tracking
 */

export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.text();
        const tusUrl = req.nextUrl.searchParams.get('url');

        if (!tusUrl) {
            return NextResponse.json({ error: 'Missing TUS URL' }, { status: 400 });
        }

        const decodedUrl = decodeURIComponent(tusUrl);

        // Forward POST request to Cloudflare TUS
        const response = await fetch(decodedUrl, {
            method: 'POST',
            headers: {
                'Tus-Resumable': '1.0.0',
                'Upload-Length': req.headers.get('upload-length') || '0',
                'Upload-Metadata': req.headers.get('upload-metadata') || '',
                'Content-Type': req.headers.get('content-type') || 'application/offset+octet-stream',
            },
        });

        const location = response.headers.get('Location');
        const tusServerUrl = response.headers.get('Tus-Version');

        return new NextResponse(null, {
            status: response.status,
            headers: {
                'Location': location ? location : '',
                'Tus-Resumable': '1.0.0',
                'Tus-Version': '1.0.0',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Upload-Length, Upload-Offset, Tus-Resumable, Tus-Version, Tus-Extension, Upload-Metadata',
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Proxy error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.arrayBuffer();
        const tusUrl = req.nextUrl.searchParams.get('url');

        if (!tusUrl) {
            return NextResponse.json({ error: 'Missing TUS URL' }, { status: 400 });
        }

        const decodedUrl = decodeURIComponent(tusUrl);

        // Forward PATCH (chunk upload) to Cloudflare
        const response = await fetch(decodedUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/offset+octet-stream',
                'Upload-Offset': req.headers.get('upload-offset') || '0',
                'Tus-Resumable': '1.0.0',
            },
            body: body,
        });

        const responseBody = await response.arrayBuffer();
        const uploadOffset = response.headers.get('Upload-Offset');

        return new NextResponse(responseBody, {
            status: response.status,
            headers: {
                'Upload-Offset': uploadOffset || '',
                'Tus-Resumable': '1.0.0',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Proxy error' }, { status: 500 });
    }
}

export async function HEAD(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const tusUrl = req.nextUrl.searchParams.get('url');

        if (!tusUrl) {
            return NextResponse.json({ error: 'Missing TUS URL' }, { status: 400 });
        }

        const decodedUrl = decodeURIComponent(tusUrl);

        // Check upload status
        const response = await fetch(decodedUrl, {
            method: 'HEAD',
            headers: {
                'Tus-Resumable': '1.0.0',
            },
        });

        const uploadOffset = response.headers.get('Upload-Offset');
        const uploadLength = response.headers.get('Upload-Length');

        return new NextResponse(null, {
            status: response.status,
            headers: {
                'Upload-Offset': uploadOffset || '0',
                'Upload-Length': uploadLength || '0',
                'Tus-Resumable': '1.0.0',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Proxy error' }, { status: 500 });
    }
}

export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Upload-Length, Upload-Offset, Tus-Resumable, Tus-Version, Tus-Extension, Upload-Metadata',
        },
    });
}
