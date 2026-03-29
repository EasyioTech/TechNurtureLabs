import { NextRequest, NextResponse } from 'next/server';
import { s3Client, isCloudflareConfigured, getSignedDownloadUrl } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';
import { verifySession } from '@/lib/auth';
import { redis } from '@/lib/redis';

/**
 * PRODUCTION-GRADE HLS GATEWAY (M-10 REFINED)
 * 
 * SCALE HARDENING:
 * 1. Path Sanitization: Prevents directory traversal attacks.
 * 2. Manifest Caching (High Concurrency): Rewritten manifests are cached in Redis 
 *    for 5 minutes. If 500 students hit the same lesson, we fetch/rewrite ONCE.
 */

const MANIFEST_CACHE_TTL = 300; // 5 minutes

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: filePathParams } = await params;
        
        // 1. Path Sanitization (Security Hardening)
        const key = filePathParams
            .filter(p => p !== '..' && p !== '.')
            .join('/')
            .replace(/^\/+/, ''); // Strip leading slashes

        // Reject obvious attacks
        if (key.includes('..') || key.startsWith('/')) {
            return new NextResponse('Invalid Path', { status: 400 });
        }

        // 2. Auth Check (Always required)
        const session = await verifySession();
        if (!session) return new NextResponse('Unauthorized', { status: 401 });

        if (!isCloudflareConfigured || !s3Client) {
            return new NextResponse('Cloudflare R2 not configured', { status: 501 });
        }

        // 3. CACHE LAYER (M-11: Preventing Server Spikes)
        const cacheKey = `hls:manifest:${key}`;
        try {
            const cachedManifest = await redis.get(cacheKey);
            if (cachedManifest) {
                console.log(`[HLS Gateway] Cache Hit: ${key}`);
                return new Response(cachedManifest, { 
                    status: 200, 
                    headers: { 'Content-Type': 'application/x-mpegURL', 'X-Cache': 'HIT' } 
                });
            }
        } catch (e) { /* Redis down - skip cache */ }

        // 4. Fetch the Manifest (Cold Start)
        console.log(`[HLS Gateway] Cold Fetch: ${key}`);
        const command = new GetObjectCommand({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Key: key,
        });
        const response = await s3Client.send(command);

        if (!response.Body) return new NextResponse('Manifest not found', { status: 404 });

        const manifestText = await response.Body.transformToString();
        const lines = manifestText.split('\n');
        const parentFolder = key.split('/').slice(0, -1).join('/');

        // 5. REWRITE Logic: Generate Direct Signed URLs for Segments
        const rewrittenLines = await Promise.all(lines.map(async (line) => {
            const trimmed = line.trim();
            // Match segment files (.ts) or child playlists (.m3u8)
            if (trimmed && !trimmed.startsWith('#')) {
                const segmentKey = parentFolder ? `${parentFolder}/${trimmed}` : trimmed;
                try {
                    // Sign with 1-hour expiration. Direct to R2/CDN.
                    return await getSignedDownloadUrl(segmentKey, 3600);
                } catch (err) {
                    console.error('[HLS Rewriter] FAILED to sign segment:', segmentKey);
                    return line;
                }
            }
            return line;
        }));

        const finalManifest = rewrittenLines.join('\n');

        // 6. POPULATE CACHE
        try {
            await redis.setex(cacheKey, MANIFEST_CACHE_TTL, finalManifest);
        } catch (e) { /* non-critical */ }

        // 7. Success Response
        return new Response(finalManifest, { 
            status: 200, 
            headers: { 
                'Content-Type': 'application/x-mpegURL',
                'Cache-Control': 'private, max-age=60',
                'X-Cache': 'MISS'
            } 
        });

    } catch (error: any) {
        console.error('[HLS Gateway] CRITICAL Error:', error.message);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
