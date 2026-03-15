import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'local_storage');

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    try {
        // Next.js 15 requires unwrapping async params
        const { path: filePathParams } = await params;

        if (!filePathParams || filePathParams.length === 0) {
            return new NextResponse('File path not provided', { status: 400 });
        }

        // Supports both flat (filename) and subfolder (folder/filename) paths
        const fileName = filePathParams.join('/');
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

        // 🚀 Range Support for seeking in large videos
        const range = request.headers.get('range');
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunksize = (end - start) + 1;
            
            const fileStream = fs.createReadStream(filePath, { start, end });
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
                    'Content-Range': `bytes ${start}-${end}/${stats.size}`,
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
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('[Media] Serving error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
