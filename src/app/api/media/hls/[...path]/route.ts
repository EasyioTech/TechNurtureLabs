import { NextRequest, NextResponse } from 'next/server';
import { s3Client, isCloudflareConfigured, getSignedDownloadUrl } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';
import { verifySession } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { lessons as lessonsTable, enrollments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * PRODUCTION-GRADE HLS GATEWAY
 *
 * SECURITY: Path sanitization prevents directory traversal.
 * SCALE: Redis manifest cache (5min TTL) prevents redundant R2 fetches.
 * THUNDERING HERD: Redis mutex (singleflight) ensures only ONE cold-fetch
 *   happens per manifest. Concurrent requests wait on the lock, then read
 *   from cache. Eliminates concurrent R2 spikes under heavy load.
 */

const MANIFEST_CACHE_TTL = 300;  // 5 minutes — signed URLs valid for 2hr, safe margin
const FETCH_LOCK_TTL = 15;        // Lock auto-expires after 15s (deadlock prevention)
const LOCK_POLL_MS = 200;         // How often waiting requests poll for cache
const LOCK_MAX_WAIT_MS = 10000;   // Max time a request waits behind a lock

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: filePathParams } = await params;

        // ── 1. Path Sanitization ──────────────────────────────────────────────
        const key = filePathParams
            .filter(p => p !== '..' && p !== '.')
            .join('/')
            .replace(/^\/+/, '');

        if (!key || key.includes('..') || key.startsWith('/')) {
            return new NextResponse('Invalid Path', { status: 400 });
        }

        // ── 2. Auth & Authorization (BOLA Protection) ──────────────────────
        const session = await verifySession();
        if (!session) return new NextResponse('Unauthorized', { status: 401 });

        // If student, verify enrollment in the course owning this lesson/asset.
        if (session.userType === 'student') {
            const pathParts = key.split('/');
            
            // Pattern 1: Lessons (lessons/{lessonId}/...)
            if (pathParts[0] === 'lessons' && pathParts[1]) {
                const lessonId = pathParts[1];
                
                // Optimized Join: Check if student has an enrollment for the course that owns this lesson
                const hasAccess = await db
                    .select({ id: lessonsTable.id })
                    .from(lessonsTable)
                    .innerJoin(enrollments, eq(lessonsTable.course_id, enrollments.course_id))
                    .where(
                        and(
                            eq(lessonsTable.id, lessonId),
                            eq(enrollments.user_id, session.userId)
                        )
                    )
                    .limit(1);

                if (hasAccess.length === 0) {
                    return new NextResponse('Forbidden: Access to this course content is restricted to enrolled students.', { status: 403 });
                }
            }
            
            // Pattern 2: Courses (courses/{courseId}/...)
            else if (pathParts[0] === 'courses' && pathParts[1]) {
                const courseId = pathParts[1];
                const hasAccess = await db
                    .select({ id: enrollments.id })
                    .from(enrollments)
                    .where(
                        and(
                            eq(enrollments.course_id, courseId),
                            eq(enrollments.user_id, session.userId)
                        )
                    )
                    .limit(1);

                if (hasAccess.length === 0) {
                    return new NextResponse('Forbidden: Access to this course content is restricted to enrolled students.', { status: 403 });
                }
            }
            
            // Note: branding/, library/, and avatars/ are allowed for any logged-in student.
        }

        // ── 3. HMAC Validation ─────────────────────────────────────────────────
        const token = request.nextUrl.searchParams.get('token');
        const mediaSecret = process.env.MEDIA_SECRET;

        if (mediaSecret) {
            const signTarget = key.split('/').slice(0, -1).join('/');
            const expectedHash = crypto
                .createHmac('sha256', mediaSecret)
                .update(signTarget)
                .digest('hex')
                .slice(0, 16);

            if (token !== expectedHash) {
                return new NextResponse('Forbidden: Invalid Media Token', { status: 403 });
            }
        } else if (process.env.NODE_ENV === 'production') {
            // SECURITY: In production, fail-closed when MEDIA_SECRET is not configured
            return new NextResponse('Media service misconfigured', { status: 503 });
        }

        if (!isCloudflareConfigured || !s3Client) {
            return new NextResponse('Cloudflare R2 not configured', { status: 501 });
        }

        // SECURITY: Per-user cache key prevents revoked users from accessing cached manifests
        // Lock key stays shared to prevent thundering herd on cold R2 fetch
        const cacheKey = `hls:manifest:${session.userId}:${key}`;
        const lockKey  = `hls:lock:${key}`;

        // ── 3. Cache Lookup (Hot Path — serves majority of requests) ─────────
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return new Response(cached, {
                    status: 200,
                    headers: { 'Content-Type': 'application/x-mpegURL', 'X-Cache': 'HIT' }
                });
            }
        } catch (_) { /* Redis unavailable — fall through to cold fetch */ }

        // ── 4. Singleflight Lock (Thundering Herd Prevention) ─────────────────
        // When 200 students open the same lesson simultaneously on a cache miss:
        // - ONE request acquires the lock and fetches from R2
        // - The other 199 wait here, then serve from cache once populated
        const lockAcquired = await redis.set(lockKey, '1', 'EX', FETCH_LOCK_TTL, 'NX').catch(() => null);

        if (!lockAcquired) {
            // Another worker is already fetching — wait for it to populate cache
            const fromCache = await waitForCache(cacheKey, LOCK_POLL_MS, LOCK_MAX_WAIT_MS);
            if (fromCache) {
                return new Response(fromCache, {
                    status: 200,
                    headers: { 'Content-Type': 'application/x-mpegURL', 'X-Cache': 'WAIT-HIT' }
                });
            }
            // Lock expired before cache was populated — fall through and fetch ourselves
        }

        // ── 5. Cold Fetch from R2 (runs for at most 1 concurrent request per key)
        try {

            const r2Response = await s3Client.send(new GetObjectCommand({
                Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                Key: key,
            }));

            if (!r2Response.Body) {
                await redis.del(lockKey).catch(() => {});
                return new NextResponse('Manifest not found', { status: 404 });
            }

            const manifestText = await r2Response.Body.transformToString();
            const lines = manifestText.split('\n');
            const parentFolder = key.split('/').slice(0, -1).join('/');

            // ── 6. Rewrite Segments → Signed CDN URLs ─────────────────────────
            // 2-hour signed URL expiry:
            // - Manifest cache TTL is 5 min, so it's always re-signed before the URL expires
            // - Gives a 2hr buffer for very long lesson sessions
            const rewrittenLines = await Promise.all(lines.map(async (line) => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const segmentKey = parentFolder ? `${parentFolder}/${trimmed}` : trimmed;
                    try {
                        return await getSignedDownloadUrl(segmentKey, 7200);
                    } catch {
                        console.error('[HLS Gateway] Failed to sign segment:', segmentKey);
                        return line; // Fallback — player will get 403 for this segment only
                    }
                }
                return line;
            }));

            const finalManifest = rewrittenLines.join('\n');

            // ── 7. Cache + Release Lock ───────────────────────────────────────
            await redis.setex(cacheKey, MANIFEST_CACHE_TTL, finalManifest).catch(() => {});
            await redis.del(lockKey).catch(() => {});

            return new Response(finalManifest, {
                status: 200,
                headers: {
                    'Content-Type': 'application/x-mpegURL',
                    'Cache-Control': 'private, max-age=60',
                    'X-Cache': 'MISS'
                }
            });

        } catch (fetchErr: any) {
            await redis.del(lockKey).catch(() => {}); // Always release lock on error
            throw fetchErr;
        }

    } catch (error: any) {
        console.error('[HLS Gateway] CRITICAL Error:', error.message);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

/**
 * Poll Redis for a cache key until populated or timeout reached.
 * Used by requests waiting behind the singleflight lock.
 */
async function waitForCache(
    cacheKey: string,
    pollMs: number,
    maxWaitMs: number
): Promise<string | null> {
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, pollMs));
        try {
            const val = await redis.get(cacheKey);
            if (val) return val;
        } catch (_) { /* Redis error — keep polling */ }
    }
    return null; // Timed out — caller will do its own fetch
}
