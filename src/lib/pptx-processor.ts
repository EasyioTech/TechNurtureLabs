/**
 * PPTX Processor
 *
 * Converts a PPTX/PPT file into individual slide PNG images at upload time.
 * Pipeline: PPTX → PNG (LibreOffice impress_png_Export — single step, no poppler needed)
 *
 * LibreOffice names the output files as:
 *   basename.png        (slide 1)
 *   basename2.png       (slide 2)
 *   basename3.png       (slide 3)  …
 *
 * We re-number them to the canonical naming:
 *   slide-001.png, slide-002.png, …
 *
 * Slides are stored at:
 *   R2:    pptx-slides/{assetId}/slide-001.png  …  meta.json
 *   Local: local_storage/pptx-slides/{assetId}/slide-001.png  …  meta.json
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'local_storage');

// ─── Tool detection ──────────────────────────────────────────────────────────

async function findLibreOffice(): Promise<string | null> {
    const candidates =
        process.platform === 'win32'
            ? [
                  'soffice',
                  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
                  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
              ]
            : ['libreoffice', 'soffice', '/usr/bin/libreoffice', '/usr/lib/libreoffice/program/soffice'];

    for (const cmd of candidates) {
        try {
            await execAsync(`"${cmd}" --version`, { timeout: 8000 });
            return cmd;
        } catch (_) {}
    }
    return null;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PptxProcessResult {
    success: boolean;
    slideCount?: number;
    error?: string;
}

export interface SlideMeta {
    slideCount: number;
    generatedAt: string;
}

// ─── Slide file sorting ───────────────────────────────────────────────────────
//
// LibreOffice impress_png_Export produces:
//   <basename>.png          ← slide 1  (no trailing digit)
//   <basename>2.png         ← slide 2
//   <basename>3.png         ← slide 3  …
//
// We extract the trailing integer; files with no trailing integer get index 0
// so they sort first (slide 1).

function extractTrailingNum(filename: string): number {
    const m = filename.match(/(\d+)\.png$/i);
    return m ? parseInt(m[1], 10) : 0;
}

// ─── Main conversion function ─────────────────────────────────────────────────

export async function processPptxToSlides(
    assetId: string,
    filePath: string,
    storageType: 'r2' | 'local'
): Promise<PptxProcessResult> {
    const libreOffice = await findLibreOffice();
    if (!libreOffice) {
        return {
            success: false,
            error:
                'LibreOffice is not installed. ' +
                'On Linux: apt-get install libreoffice-impress. ' +
                'On Windows: winget install LibreOffice.LibreOffice',
        };
    }

    const workDir = path.join(os.tmpdir(), `pptx-${assetId}-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    let sourcePath: string;
    let tempDownload: string | null = null;

    try {
        // ── 1. Obtain source file ─────────────────────────────────────────────
        if (storageType === 'local') {
            sourcePath = path.join(LOCAL_STORAGE_DIR, filePath);
            if (!fs.existsSync(sourcePath)) {
                return { success: false, error: `Source file not found: ${filePath}` };
            }
        } else {
            // Download from R2 into a temp file
            const { s3Client, isCloudflareConfigured } = await import('./storage');
            const { GetObjectCommand } = await import('@aws-sdk/client-s3');
            const { serverEnv } = await import('./env.server');

            if (!isCloudflareConfigured || !s3Client) {
                return { success: false, error: 'Cloudflare R2 is not configured.' };
            }

            const r2Response = await s3Client.send(
                new GetObjectCommand({ Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME, Key: filePath })
            );

            if (!r2Response.Body) {
                return { success: false, error: 'File not found in R2 storage.' };
            }

            const ext = path.extname(filePath) || '.pptx';
            tempDownload = path.join(workDir, `source${ext}`);
            const bytes = await r2Response.Body.transformToByteArray();
            fs.writeFileSync(tempDownload, bytes);
            sourcePath = tempDownload;
        }

        // ── 2. PPTX → PNG images (one per slide) ──────────────────────────────
        // LibreOffice exports each slide directly to a PNG — no intermediate PDF needed.
        const loCmd = `"${libreOffice}" --headless --convert-to "png:impress_png_Export" --outdir "${workDir}" "${sourcePath}"`;
        await execAsync(loCmd, { timeout: 180_000 });

        // ── 3. Collect & sort PNG files ────────────────────────────────────────
        const allPngs = fs.readdirSync(workDir).filter((f) => f.toLowerCase().endsWith('.png'));

        if (allPngs.length === 0) {
            return { success: false, error: 'LibreOffice did not produce any PNG slide images.' };
        }

        const slideFiles = [...allPngs].sort((a, b) => extractTrailingNum(a) - extractTrailingNum(b));

        const slideCount = slideFiles.length;
        const slideDir = `pptx-slides/${assetId}`;
        const meta: SlideMeta = { slideCount, generatedAt: new Date().toISOString() };

        // ── 4. Store slides ───────────────────────────────────────────────────
        if (storageType === 'r2') {
            const { s3Client, isCloudflareConfigured } = await import('./storage');
            const { PutObjectCommand } = await import('@aws-sdk/client-s3');
            const { serverEnv } = await import('./env.server');

            if (isCloudflareConfigured && s3Client) {
                for (let i = 0; i < slideFiles.length; i++) {
                    const imgBuffer = fs.readFileSync(path.join(workDir, slideFiles[i]));
                    const key = `${slideDir}/slide-${String(i + 1).padStart(3, '0')}.png`;
                    await s3Client.send(
                        new PutObjectCommand({
                            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                            Key: key,
                            Body: imgBuffer,
                            ContentType: 'image/png',
                        })
                    );
                }
                await s3Client.send(
                    new PutObjectCommand({
                        Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                        Key: `${slideDir}/meta.json`,
                        Body: Buffer.from(JSON.stringify(meta)),
                        ContentType: 'application/json',
                    })
                );
            }
        } else {
            const localSlideDir = path.join(LOCAL_STORAGE_DIR, slideDir);
            fs.mkdirSync(localSlideDir, { recursive: true });

            for (let i = 0; i < slideFiles.length; i++) {
                fs.copyFileSync(
                    path.join(workDir, slideFiles[i]),
                    path.join(localSlideDir, `slide-${String(i + 1).padStart(3, '0')}.png`)
                );
            }
            fs.writeFileSync(path.join(localSlideDir, 'meta.json'), JSON.stringify(meta));
        }

        return { success: true, slideCount };
    } catch (err: any) {
        console.error('[PptxProcessor] Conversion error:', err);
        return { success: false, error: err?.message ?? 'Unknown conversion error' };
    } finally {
        try { fs.rmSync(workDir, { recursive: true, force: true }); } catch (_) {}
    }
}

// ─── Slide meta reader ───────────────────────────────────────────────────────

export async function readSlideMeta(
    assetId: string,
    storageType: 'r2' | 'local'
): Promise<SlideMeta | null> {
    const metaPath = `pptx-slides/${assetId}/meta.json`;

    try {
        if (storageType === 'local') {
            const localPath = path.join(LOCAL_STORAGE_DIR, metaPath);
            if (!fs.existsSync(localPath)) return null;
            return JSON.parse(fs.readFileSync(localPath, 'utf-8'));
        } else {
            const { s3Client, isCloudflareConfigured } = await import('./storage');
            const { GetObjectCommand } = await import('@aws-sdk/client-s3');
            const { serverEnv } = await import('./env.server');

            if (!isCloudflareConfigured || !s3Client) return null;

            const response = await s3Client.send(
                new GetObjectCommand({ Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME, Key: metaPath })
            );
            if (!response.Body) return null;
            const text = await response.Body.transformToString();
            return JSON.parse(text);
        }
    } catch (_) {
        return null;
    }
}
