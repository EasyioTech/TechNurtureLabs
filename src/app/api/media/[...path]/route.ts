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

        const fileName = filePathParams.join('/');
        const filePath = path.join(LOCAL_STORAGE_DIR, fileName);

        if (!fs.existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const stats = await fs.promises.stat(filePath);
        // Simple mime-type guessing based on generic extensions
        const ext = path.extname(fileName).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.mp4') mimeType = 'video/mp4';
        else if (ext === '.pdf') mimeType = 'application/pdf';
        else if (ext === '.ppt' || ext === '.pptx') mimeType = 'application/vnd.ms-powerpoint';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.mp3') mimeType = 'audio/mpeg';

        // Stream the file instead of reading entire buffer to handle large videos efficiently
        const readStream = fs.createReadStream(filePath);

        // Convert Node.js readable stream to Web ReadableStream
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
            },
        });
    } catch (error) {
        console.error('Media Serving Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
