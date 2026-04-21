import { NextRequest, NextResponse } from 'next/server';

/**
 * TUS Proxy Route
 * Resolves CORS issues by relaying TUS protocol requests from the browser 
 * to Cloudflare Stream via the server.
 */

async function handleProxy(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new NextResponse('Missing target URL', { status: 400 });
    }

    // Prepare headers for Cloudflare
    const forwardHeaders = new Headers();
    const headersToForward = [
        'tus-resumable',
        'upload-offset',
        'upload-length',
        'upload-metadata',
        'content-type',
        'authorization'
    ];

    headersToForward.forEach(header => {
        const val = req.headers.get(header);
        if (val) forwardHeaders.set(header, val);
    });

    try {
        const fetchOptions: RequestInit = {
            method: req.method,
            headers: forwardHeaders,
            // @ts-ignore - duplex is required for streaming bodies in some node versions
            duplex: 'half'
        };

        // Forward body for PATCH requests
        if (req.method === 'PATCH') {
            fetchOptions.body = await req.arrayBuffer();
        }

        const cfRes = await fetch(targetUrl, fetchOptions);

        // Prepare response headers for the browser
        const responseHeaders = new Headers();
        
        // Forward critical TUS response headers
        const headersToReturn = [
            'tus-resumable',
            'upload-offset',
            'upload-expires',
            'stream-media-id',
            'location'
        ];

        headersToReturn.forEach(header => {
            const val = cfRes.headers.get(header);
            if (val) responseHeaders.set(header, val);
        });

        // Add permissive CORS headers to satisfy the browser
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS, HEAD');
        responseHeaders.set('Access-Control-Allow-Headers', '*');
        responseHeaders.set('Access-Control-Expose-Headers', '*');

        return new NextResponse(cfRes.body, {
            status: cfRes.status,
            headers: responseHeaders
        });
    } catch (error) {
        console.error('[TUS Proxy Error]:', error);
        return new NextResponse('Proxy failed to communicate with Cloudflare', { status: 502 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS, HEAD',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Expose-Headers': '*',
        }
    });
}

export async function HEAD(req: NextRequest) { return handleProxy(req); }
export async function PATCH(req: Request) { return handleProxy(req as NextRequest); }
export async function GET(req: NextRequest) { return handleProxy(req); }
export async function POST(req: NextRequest) { return handleProxy(req); }
