import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { addNormalizationJob } from '@/lib/queue/video-queue';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

/**
 * VIDEO NORMALIZATION PIPELINE (Distributed Queue Version)
 * 
 * Replaced in-memory semaphore with BullMQ for true SaaS-grade scale.
 * Moves heavy analysis and FFmpeg re-encoding to background workers.
 */

export async function POST(req: NextRequest) {
    let tempInputPath = '';
    
    try {
        const session = await verifySession();
        if (!session) return new NextResponse('Unauthorized', { status: 401 });

        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        // 0. File Size Guard
        if (file.size > 500 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (limit: 500MB)' }, { status: 413 });
        }

        // 1. Setup secure temporary path
        const id = crypto.randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        tempInputPath = path.join(os.tmpdir(), `raw_${id}_${safeName}`);

        // Stream to disk
        const writeStream = createWriteStream(tempInputPath);
        await pipeline(file.stream() as any, writeStream);

        // 2. Queue the Job
        console.log(`[Normalization] Queueing job for ${file.name}...`);
        const job = await addNormalizationJob({
            tempInputPath,
            originalName: file.name,
            fileSize: file.size,
            userId: session.userId,
            metadata: {
                source: 'super-admin-upload'
            }
        });

        return NextResponse.json({ 
            success: true, 
            jobId: job.id,
            status: 'queued'
        });

    } catch (error: any) {
        console.error('[Normalization API Error]:', error);
        // Cleanup input if queuing fails
        if (tempInputPath) await fs.unlink(tempInputPath).catch(() => {});
        return NextResponse.json(
            { error: error.message || 'Failed to queue normalization job' },
            { status: 500 }
        );
    }
}
