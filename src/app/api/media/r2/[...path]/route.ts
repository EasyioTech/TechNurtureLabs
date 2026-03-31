import { NextRequest, NextResponse } from 'next/server';
import { s3Client, isCloudflareConfigured, getSignedDownloadUrl } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { serverEnv } from '@/lib/env.server';
import { verifySession } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: filePathParams } = await params;
        const key = filePathParams.join('/');
        const ext = path.extname(key).toLowerCase();
        const isHls = ext === '.m3u8' || ext === '.ts';

        // 1. Authentication Check
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // ── 2. Authorization (BOLA Protection) ──────────────────────
        // Quick Win #1/2: BOLA Protection for R2 assets
        if (session.userType === 'student') {
            const { db } = await import('@/lib/db');
            const { lessons: lessonsTable, enrollments } = await import('@/db/schema');
            const { eq, and } = await import('drizzle-orm');
            const pathParts = key.split('/');
            
            // Pattern 1: Lessons (lessons/{lessonId}/...)
            if (pathParts[0] === 'lessons' && pathParts[1]) {
                const lessonId = pathParts[1];
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
                    return new NextResponse('Forbidden: Enrollment required.', { status: 403 });
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
                    return new NextResponse('Forbidden: Enrollment required.', { status: 403 });
                }
            }
        }

        // 2. Deployment Integrity Check
        if (!isCloudflareConfigured || !s3Client) {
            return new NextResponse('Cloudflare R2 not configured', { status: 501 });
        }

        // 3. SECURE PROXY Strategy (M-10)
        // For non-HLS assets like PDFs, we proxy the file from R2 instead of redirecting.
        // Redirecting to a signed R2 URL often causes CORS failures in the PDF viewer.
        // Proxying ensures the origin remains consistent (technurturelms.in).
        // if (!isHls) {
        //     try {
        //         const url = await getSignedDownloadUrl(key, 3600);
        //         return NextResponse.redirect(url, 302);
        //     } catch (err) {
        //         console.error('[R2 Proxy] Signed URL generation failed:', err);
        //         // Fall back to proxying if signing fails for some reason
        //     }
        // }

        // 4. HLS Proxy with HMAC Validation
        // HLS segments are hard to sign individually. We use an HMAC token for the folder.
        const token = request.nextUrl.searchParams.get('token');
        const mediaSecret = process.env.MEDIA_SECRET;

        // Secure Fix: Only enforce HMAC for HLS (.m3u8/ .ts). 
        // Other files like PDFs use Proxy-based BOLA above (Session + Enrollment check).
        if (isHls && mediaSecret) {
            const signTarget = key.split('/').slice(0, -1).join('/'); // Check the parent folder signature
            const expectedHash = crypto
                .createHmac('sha256', mediaSecret)
                .update(signTarget)
                .digest('hex')
                .slice(0, 16);

            if (token !== expectedHash) {
                return new NextResponse('Forbidden: Invalid Media Token', { status: 403 });
            }
        } else if (isHls && !mediaSecret) {
            console.warn('[R2 Proxy] MEDIA_SECRET not set for HLS. Access is loosely guarded by session only.');
        }

        // Continue proxying for HLS segments (so relative paths in .m3u8 work)
        const range = request.headers.get('range');
        const commandInput: any = {
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Key: key,
        };
        if (range) commandInput.Range = range;

        const command = new GetObjectCommand(commandInput);
        const response = await s3Client.send(command);

        if (!response.Body) {
            return new NextResponse('File not found', { status: 404 });
        }

        const MIME_MAP: Record<string, string> = {
            '.m3u8': 'application/x-mpegURL',
            '.ts': 'video/MP2T',
            '.pdf': 'application/pdf',
        };
        const mimeType = response.ContentType || MIME_MAP[ext] || 'application/octet-stream';

        const stream = response.Body.transformToWebStream();
        const headers = new Headers();
        headers.set('Content-Type', mimeType);
        if (response.ContentLength) headers.set('Content-Length', response.ContentLength.toString());
        if (response.ContentRange) headers.set('Content-Range', response.ContentRange);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Cache-Control', 'private, max-age=3600');
        headers.set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length');

        const isPartial = range && !!response.ContentRange;
        return new Response(stream as any, { status: isPartial ? 206 : 200, headers });

    } catch (error: any) {
        if (error.name === 'NoSuchKey') {
            return new NextResponse('File not found', { status: 404 });
        }
        console.error('[R2 Proxy] Serving error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

