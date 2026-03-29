import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { lessons as lessonsTable, enrollments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'local_storage');

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    try {
        const session = await verifySession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // ── 1. Security Token Validation (M-10) ───────────────────────
        // Quick Win #1: Validate the Media Token computed by computeMediaUrl()
        const token = request.nextUrl.searchParams.get('token');
        const mediaSecret = process.env.MEDIA_SECRET;

        // Next.js 15 requires unwrapping async params
        const { path: filePathParams } = await params;
        const key = filePathParams.join('/');

        if (mediaSecret) {
            const crypto = await import('crypto');
            // For HLS segments, we sign the parent directory
            const isHls = key.endsWith('.m3u8') || key.endsWith('.ts');
            const signTarget = isHls ? key.split('/').slice(0, -1).join('/') : key;

            const expectedHash = crypto
                .createHmac('sha256', mediaSecret)
                .update(signTarget)
                .digest('hex')
                .slice(0, 16);

            if (token !== expectedHash) {
                return new NextResponse('Forbidden: Invalid Media Token', { status: 403 });
            }
        } else {
            console.warn('[Media Proxy] MEDIA_SECRET not set. Access is loosely guarded by session only.');
        }

        // ── 2. Authorization (BOLA Protection) ──────────────────────
        if (session.userType === 'student') {
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

        if (!filePathParams || filePathParams.length === 0) {
            return new NextResponse('File path not provided', { status: 400 });
        }

        // Supports both flat (filename) and subfolder (folder/filename) paths
        const fileName = key;
        const filePath = path.join(LOCAL_STORAGE_DIR, fileName);

        // Prevent path traversal attacks
        const resolvedPath = path.resolve(filePath);
        const resolvedBase = path.resolve(LOCAL_STORAGE_DIR);
        if (!resolvedPath.startsWith(resolvedBase)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        if (!fs.existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const stats = await fs.promises.stat(filePath);
        const ext = path.extname(fileName).toLowerCase();

        // MIME type lookup
        const MIME_MAP: Record<string, string> = {
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime',
            '.pdf': 'application/pdf',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp3': 'audio/mpeg',
            '.txt': 'text/plain',
            '.m3u8': 'application/x-mpegURL',
            '.ts': 'video/MP2T',
        };
        const mimeType = MIME_MAP[ext] ?? 'application/octet-stream';

        // Range Support for seeking in large videos
        const range = request.headers.get('range');
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

            // Validate parsed values before passing to createReadStream.
            // Invalid ranges (NaN, out-of-bounds, inverted) return 416 per RFC 7233.
            if (
                isNaN(start) || isNaN(end) ||
                start < 0 || end < start || start >= stats.size
            ) {
                return new NextResponse(null, {
                    status: 416,
                    headers: { 'Content-Range': `bytes */${stats.size}` },
                });
            }

            const safeEnd = Math.min(end, stats.size - 1);
            const chunksize = safeEnd - start + 1;

            const fileStream = fs.createReadStream(filePath, { start, end: safeEnd });
            const stream = new ReadableStream({
                start(controller) {
                    fileStream.on('data', (chunk) => controller.enqueue(chunk));
                    fileStream.on('end', () => controller.close());
                    fileStream.on('error', (err) => controller.error(err));
                }
            });

            return new NextResponse(stream, {
                status: 206,
                headers: {
                    'Content-Range': `bytes ${start}-${safeEnd}/${stats.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize.toString(),
                    'Content-Type': mimeType,
                }
            });
        }

        // Standard Stream
        const readStream = fs.createReadStream(filePath);
        const stream = new ReadableStream({
            start(controller) {
                readStream.on('data', (chunk) => controller.enqueue(chunk));
                readStream.on('end', () => controller.close());
                readStream.on('error', (err) => controller.error(err));
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': mimeType,
                'Content-Length': stats.size.toString(),
                'Cache-Control': 'private, max-age=3600',
            },
        });
    } catch (error) {
        console.error('[Media] Serving error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
