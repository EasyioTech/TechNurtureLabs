import { NextRequest, NextResponse } from 'next/server';

/**
 * TUS Proxy Route
 * Resolves CORS issues by relaying TUS protocol requests from the browser 
 * to Cloudflare Stream via the server.
 */

async function handleProxy(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    let targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new NextResponse('Missing target URL', { status: 400 });
    }

    // Ensure targetUrl is absolute (important for TUS redirects)
    if (!targetUrl.startsWith('http')) {
        targetUrl = `https://api.cloudflare.com${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
    }

    // Forward ALL relevant headers except Host/Origin to maintain protocol integrity
    const forwardHeaders = new Headers();
    const headersToSkip = ['host', 'origin', 'referer', 'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site'];
    req.headers.forEach((val, key) => {
        if (!headersToSkip.includes(key.toLowerCase())) {
            forwardHeaders.set(key, val);
        }
    });

    try {
        console.log(`[TUS Proxy] [${req.method}] -> ${targetUrl}`);
        
        const fetchOptions: RequestInit = {
            method: req.method,
            headers: forwardHeaders,
            // @ts-ignore
            duplex: req.method !== 'GET' && req.method !== 'HEAD' ? 'half' : undefined
        };

        if (['PATCH', 'POST', 'PUT'].includes(req.method)) {
            const body = await req.arrayBuffer();
            if (body.byteLength > 0) {
                fetchOptions.body = body;
                // Ensure content-length is set if we have a body
                forwardHeaders.set('content-length', body.byteLength.toString());
            }
        }

        const cfRes = await fetch(targetUrl, fetchOptions);
        
        if (!cfRes.ok) {
            const errorBody = await cfRes.text();
            console.error(`[TUS Proxy] [${req.method}] <- Cloudflare Error (${cfRes.status}): ${errorBody}`);
        } else {
            console.log(`[TUS Proxy] [${req.method}] <- Cloudflare Status: ${cfRes.status}`);
        }

        const responseHeaders = new Headers();
        const origin = new URL(req.url).origin;
        
        cfRes.headers.forEach((val, key) => {
            const k = key.toLowerCase();
            if (k === 'location') {
                // IMPORTANT: Use absolute URL for Location rewrite to prevent browser path-joining confusion
                const proxiedLocation = `${origin}/api/media/tus-proxy?url=${encodeURIComponent(val)}`;
                responseHeaders.set('location', proxiedLocation);
            } else if (!['content-encoding', 'content-length'].includes(k)) {
                responseHeaders.set(key, val);
            }
        });

        // Forced CORS headers for browser compatibility
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

export async function POST(req: NextRequest) { return handleProxy(req); }
export async function PATCH(req: NextRequest) { return handleProxy(req); }
export async function PUT(req: NextRequest) { return handleProxy(req); }
export async function DELETE(req: NextRequest) { return handleProxy(req); }
export async function HEAD(req: NextRequest) { return handleProxy(req); }
export async function GET(req: NextRequest) { return handleProxy(req); }
