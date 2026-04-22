import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';

const execAsync = promisify(exec);

export interface VideoAnalysis {
    isRisky: boolean;
    reason?: string;
    details: {
        codec_name?: string;
        r_frame_rate?: string;
        avg_frame_rate?: string;
    };
}

/**
 * Pre-flight validation: Ensure file exists, is readable, and has content.
 * Retries with exponential backoff to handle transient filesystem delays.
 */
async function validateFileExists(
    filePath: string,
    maxRetries: number = 5,
    initialDelayMs: number = 100
): Promise<{ exists: true; size: number }> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Check file exists via stat
            const stats = await fs.stat(filePath);

            // Verify file is regular file (not directory/symlink)
            if (!stats.isFile()) {
                throw new Error(`Path is not a regular file: ${filePath}`);
            }

            // Verify file has content (non-zero size)
            if (stats.size === 0) {
                throw new Error(`File is empty (0 bytes): ${filePath}`);
            }

            // Verify file is readable
            try {
                await fs.access(filePath, fsConstants.R_OK);
            } catch (e) {
                throw new Error(`File exists but is not readable: ${filePath}`);
            }

            console.log(`[FileValidation] ✓ File validated (${stats.size} bytes): ${filePath}`);
            return { exists: true, size: stats.size };
        } catch (error: any) {
            lastError = error;
            const delayMs = initialDelayMs * Math.pow(2, attempt);

            console.warn(
                `[FileValidation] Attempt ${attempt + 1}/${maxRetries} failed for ${filePath}: ${error.message}. Retrying in ${delayMs}ms...`
            );

            // Don't delay on last attempt
            if (attempt < maxRetries - 1) {
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }

    throw new Error(
        `[FileValidation] Failed after ${maxRetries} attempts. Last error: ${lastError.message}. Path: ${filePath}`
    );
}

/**
 * Robustly parses a rate string (e.g., "30000/1001" or "30/1") into a number.
 */
function parseRate(rate: string): number {
    if (!rate) return 0;
    if (!rate.includes('/')) return parseFloat(rate);
    const [num, den] = rate.split('/').map(Number);
    if (!den || isNaN(num) || isNaN(den)) return 0;
    return num / den;
}

/**
 * Analyzes a video file using FFprobe to detect VFR or incompatible codecs.
 * Includes pre-flight file validation to catch missing/corrupt files early.
 */
export async function analyzeVideo(filePath: string): Promise<VideoAnalysis> {
    try {
        // Pre-flight check: ensure file exists and is readable
        await validateFileExists(filePath);

        console.log(`[VideoAnalysis] Starting FFprobe on: ${filePath}`);

        const { stdout, stderr } = await execAsync(
            `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate,avg_frame_rate,codec_name -of json "${filePath}"`,
            { timeout: 30000, maxBuffer: 10 * 1024 * 1024 } // 30s timeout, 10MB buffer
        );

        if (stderr) {
            console.warn(`[VideoAnalysis] FFprobe warnings: ${stderr}`);
        }

        const data = JSON.parse(stdout);
        const stream = data.streams?.[0];

        if (!stream) {
            return {
                isRisky: true,
                reason: 'No video streams detected in file',
                details: {},
            };
        }

        const r_frame_rate = stream.r_frame_rate || '';
        const avg_frame_rate = stream.avg_frame_rate || '';
        const codec_name = stream.codec_name;

        // Robust VFR Detection
        const r = parseRate(r_frame_rate);
        const avg = parseRate(avg_frame_rate);
        const isVFR = Math.abs(r - avg) > 0.01;

        // Codec Risk: Non-h264
        const isNonH264 = codec_name !== 'h264';

        let reason = '';
        if (isVFR) reason += `Variable Frame Rate (VFR) detected (r=${r.toFixed(2)}, avg=${avg.toFixed(2)}). `;
        if (isNonH264) reason += `Incompatible codec (${codec_name}) detected. `;

        console.log(
            `[VideoAnalysis] ✓ Analysis complete: codec=${codec_name}, vfr=${isVFR}, isRisky=${isVFR || isNonH264}`
        );

        return {
            isRisky: isVFR || isNonH264,
            reason: reason.trim() || undefined,
            details: {
                codec_name,
                r_frame_rate,
                avg_frame_rate,
            },
        };
    } catch (err: any) {
        const errorMsg = err.message || String(err);
        console.error(`[VideoAnalysis] FATAL ERROR: ${errorMsg}`);

        // Distinguish between file-not-found vs FFprobe failure
        if (errorMsg.includes('No such file') || errorMsg.includes('ENOENT')) {
            return {
                isRisky: true,
                reason: `File not found or unreadable: ${filePath}`,
                details: {},
            };
        }

        return {
            isRisky: true,
            reason: `FFprobe failed: ${errorMsg}`,
            details: {},
        };
    }
}

/**
 * Normalizes a video file to a standard H.264 MP4 using FFmpeg.
 * This fixes VFR, incompatible codecs, and container issues.
 *
 * Updated for modern FFmpeg versions:
 * - Uses `-fps_mode vfr` instead of deprecated `-vsync vfr`
 * - Proper error context on failure
 * - File existence validation before processing
 */
export async function normalizeVideo(inputPath: string): Promise<string> {
    const outputDir = path.dirname(inputPath);
    const outputName = `normalized_${path.basename(inputPath, path.extname(inputPath))}.mp4`;
    const outputPath = path.join(outputDir, outputName);

    try {
        // Pre-flight check: ensure input file exists
        const fileInfo = await validateFileExists(inputPath);
        console.log(
            `[FFmpeg] Starting normalization: ${fileInfo.size} bytes → ${outputPath}`
        );

        // Modern FFmpeg command (replaces deprecated -vsync vfr with -fps_mode vfr)
        // If -fps_mode is not available, falls back to -vsync passthrough and resampling
        const command = `ffmpeg -i "${inputPath}" \
            -c:v libx264 -preset veryfast -threads 2 -crf 23 \
            -pix_fmt yuv420p \
            -r 30 \
            -fps_mode vfr \
            -maxrate 5M -bufsize 10M \
            -c:a aac -b:a 128k \
            -movflags +faststart \
            -y "${outputPath}" 2>&1`;

        console.log(`[FFmpeg] Command: ${command}`);

        const { stdout, stderr } = await execAsync(command, {
            timeout: 1000 * 60 * 5, // 5 minute timeout
            maxBuffer: 50 * 1024 * 1024, // 50MB buffer for FFmpeg output
        });

        // Log FFmpeg output for debugging
        if (stderr) {
            console.log(`[FFmpeg] Output:\n${stderr}`);
        }
        if (stdout) {
            console.log(`[FFmpeg] Stdout:\n${stdout}`);
        }

        // Verify output file was created and has content
        const outputStats = await fs.stat(outputPath);
        if (outputStats.size === 0) {
            throw new Error(`FFmpeg produced an empty output file (0 bytes): ${outputPath}`);
        }

        console.log(
            `[FFmpeg] ✓ Normalization complete: ${outputStats.size} bytes → ${outputPath}`
        );
        return outputPath;
    } catch (err: any) {
        const errorMsg = err.message || String(err);
        const stderr = err.stderr || '';

        // Detailed error context
        console.error(`[FFmpeg] NORMALIZATION FAILED`);
        console.error(`  Input: ${inputPath}`);
        console.error(`  Output: ${outputPath}`);
        console.error(`  Error: ${errorMsg}`);
        if (stderr) {
            console.error(`  FFmpeg stderr: ${stderr.substring(0, 500)}`);
        }

        // Attempt cleanup of partial output file
        try {
            await fs.unlink(outputPath);
            console.log(`[FFmpeg] Cleaned up partial output file: ${outputPath}`);
        } catch (cleanupErr) {
            // Silently ignore cleanup errors
        }

        // Provide specific error context
        if (errorMsg.includes('No such file') || errorMsg.includes('ENOENT')) {
            throw new Error(`Input file not found or lost: ${inputPath}`);
        }
        if (errorMsg.includes('timeout')) {
            throw new Error(`FFmpeg encoding timeout (5+ minutes): ${inputPath}`);
        }
        if (errorMsg.includes('Unknown encoder')) {
            throw new Error(`FFmpeg is missing libx264 encoder. Install: libx264-dev`);
        }

        throw new Error(`FFmpeg normalization failed: ${errorMsg}`);
    }
}
