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
    let key: string = '';
    try {
        const { path: filePathParams } = await params;
        key = filePathParams.join('/');
        const ext = path.extname(key).toLowerCase();
        const isHls = ext === '.m3u8' || ext === '.ts';

        // 1. Authentication Check
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // ── 2. Authorization (BOLA Protection) ──────────────────────
        if (session.userType === 'student') {
            const { db } = await import('@/lib/db');
            const { lessons: lessonsTable, enrollments } = await import('@/db/schema');
            const { eq, and } = await import('drizzle-orm');
            const pathParts = key.split('/');
            
            let hasAccessFlag = false;

            // Legacy patterns (still supported for now)
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
                if (hasAccess.length > 0) hasAccessFlag = true;
            }
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
                if (hasAccess.length > 0) hasAccessFlag = true;
            }
            // Strict folder structure patterns (images/, videos/, documents/)
            else if (['images', 'videos', 'documents'].includes(pathParts[0])) {
                // For images, we generally allow authenticated students to view them
                // Videos are further protected by HMAC tokens anyway
                hasAccessFlag = true;
            }

            if (!hasAccessFlag) {
                return new NextResponse('Forbidden: Access denied.', { status: 403 });
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

        // 4. HMAC Validation for All File Types
        // SECURITY: When MEDIA_SECRET is set, enforce HMAC on ALL file types
        // HLS uses folder-level signature, other types use file-level signature
        const token = request.nextUrl.searchParams.get('token');
        const mediaSecret = process.env.MEDIA_SECRET;

        if (mediaSecret) {
            const signTarget = isHls ? key.split('/').slice(0, -1).join('/') : key;
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
        console.error('[R2 Proxy] Error:', {
            message: error?.message,
            code: error?.$metadata?.httpStatusCode || error?.code,
            key: key
        });
        // If it's an auth error (403), indicate R2 credentials issue
        if (error?.$metadata?.httpStatusCode === 403) {
            return new NextResponse('Access denied: R2 credentials invalid or insufficient permissions', { status: 403 });
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

