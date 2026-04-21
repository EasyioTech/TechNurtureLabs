import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { analyzeVideo, normalizeVideo } from '@/lib/services/video-processor';
import { createTusUpload, getVideoStatus, deleteStreamVideo } from '@/lib/services/cloudflare-stream';
import fs from 'fs/promises';
import { createWriteStream, createReadStream, statSync } from 'fs';
import path from 'path';
import os from 'os';
import * as tus from 'tus-js-client';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

/**
 * POST /api/media/normalize
 */

// Simple in-memory semaphore for concurrency control (Issue #6)
let concurrentJobs = 0;
const MAX_CONCURRENT_JOBS = 3;

export async function POST(req: NextRequest) {
    let tempInputPath = '';
    let tempOutputPath = '';
    
    try {
        const session = await verifySession();
        if (!session) return new NextResponse('Unauthorized', { status: 401 });

        // Concurrency Guard
        if (concurrentJobs >= MAX_CONCURRENT_JOBS) {
            return NextResponse.json({ error: 'Server is busy normalizing other videos. Please try again in a few minutes.' }, { status: 429 });
        }
        concurrentJobs++;

        try {
            const formData = await req.formData();
            const file = formData.get('file') as File;
            if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

            // 0. File Size Guard (Prevent resource exhaustion)
            if (file.size > 500 * 1024 * 1024) { // 500MB
                return NextResponse.json({ error: 'File too large for server-side normalization (limit: 500MB)' }, { status: 413 });
            }

            // 1. Setup secure temporary paths & secure filename
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const id = crypto.randomUUID();
            tempInputPath = path.join(os.tmpdir(), `raw_${id}_${safeName}`);
            tempOutputPath = path.join(os.tmpdir(), `norm_${id}_${safeName}`);

            // Stream the file directly to disk
            const writeStream = createWriteStream(tempInputPath);
            await pipeline(file.stream() as any, writeStream);

            // 2. Analyze
            const analysis = await analyzeVideo(tempInputPath);
            console.log('[Normalization Analysis]:', analysis);

            let finalFilePath = tempInputPath;

            // 3. Smart Path Split (Issue #3: Optimization)
            if (analysis.isRisky) {
                console.log('[Normalization]: Starting FFmpeg re-encode...');
                tempOutputPath = await normalizeVideo(tempInputPath);
                finalFilePath = tempOutputPath;
            } else {
                console.log('[Normalization]: File analyzed as safe. Bypassing re-encode, performing direct server-push.');
            }

            // 4. Server-to-Server TUS Push (Memory Safe)
            console.log('[Normalization] Starting S2S Push...');
            const fileStats = await fs.stat(finalFilePath);
            const { uploadUrl, uid } = await createTusUpload(fileStats.size, {
                name: file.name,
                normalized: 'true',
                original_analysis: JSON.stringify(analysis.details)
            });

            const uploadPromise = new Promise<void>((resolve, reject) => {
                const stream = createReadStream(finalFilePath);
                
                if (fileStats.size === 0) {
                    return reject(new Error('Normalized file is empty (processing failure)'));
                }

                const upload = new tus.Upload(stream as any, {
                    uploadUrl,
                    chunkSize: 10 * 1024 * 1024, // 10MB chunks
                    retryDelays: [0, 3000, 5000, 10000, 20000],
                    removeFingerprintOnSuccess: true,
                    metadata: {
                        filename: file.name,
                        filetype: 'video/mp4',
                    },
                    onError: (error) => {
                        console.error('[S2S Upload Error]', error);
                        reject(error);
                    },
                    onSuccess: () => {
                        console.log(`[Normalization]: Successfully pushed ${uid} to Cloudflare`);
                        resolve();
                    },
                });
                upload.start();
            });

            // 5. Wrap upload with 10-minute timeout
            await Promise.race([
                uploadPromise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Server-side upload timeout (10m limit)')), 10 * 60 * 1000)
                )
            ]);

            // 6. Post-Upload Verification (Direct Service Call)
            console.log('[Normalization] Verifying Cloudflare status...');
            let isReady = false;
            for (let i = 0; i < 24; i++) { // Max 2 mins (24 * 5s)
                await new Promise(r => setTimeout(r, 5000));
                try {
                    const status = await getVideoStatus(uid);
                    
                    if (status.readyToStream) {
                        isReady = true;
                        break;
                    }
                    if (status.status.state === 'error') {
                        throw new Error(`Cloudflare failed to ingest normalized file: ${status.status.errorReasonText || 'Unknown error'}`);
                    }
                } catch (pollErr) {
                    console.warn('[Normalization Polling Warning]', pollErr);
                }
            }

            if (!isReady) {
                console.warn(`[Normalization] Video ${uid} is still processing after 2 mins. Returning pending state.`);
                return NextResponse.json({ 
                    success: true, 
                    uid,
                    readyToStream: false,
                    pending: true
                });
            }

            return NextResponse.json({ 
                success: true, 
                uid,
                readyToStream: true
            });
        } finally {
            concurrentJobs--;
        }

    } catch (error: any) {
        console.error('[Normalization API Error]:', error);
        return NextResponse.json(
            { error: error.message || 'Normalization pipeline failed' },
            { status: 500 }
        );
    } finally {
        // 7. Cleanup temporary files reliably
        await Promise.all([
            tempInputPath && fs.unlink(tempInputPath).catch(() => {}),
            tempOutputPath && fs.unlink(tempOutputPath).catch(() => {}),
        ]);
    }
}
