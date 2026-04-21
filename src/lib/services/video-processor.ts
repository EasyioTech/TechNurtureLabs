import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

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
 */
export async function analyzeVideo(filePath: string): Promise<VideoAnalysis> {
    try {
        const { stdout } = await execAsync(
            `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate,avg_frame_rate,codec_name -of json "${filePath}"`,
            { timeout: 30000 } // 30s timeout for analysis
        );
        
        const data = JSON.parse(stdout);
        const stream = data.streams?.[0] || {};
        
        const r_frame_rate = stream.r_frame_rate || '';
        const avg_frame_rate = stream.avg_frame_rate || '';
        const codec_name = stream.codec_name;

        // Issue #4: Robust VFR Detection
        const r = parseRate(r_frame_rate);
        const avg = parseRate(avg_frame_rate);
        const isVFR = Math.abs(r - avg) > 0.01;
        
        // Codec Risk: Non-h264
        const isNonH264 = codec_name !== 'h264';

        let reason = '';
        if (isVFR) reason += 'Variable Frame Rate (VFR) detected. ';
        if (isNonH264) reason += `Incompatible codec (${codec_name}) detected. `;

        return {
            isRisky: isVFR || isNonH264,
            reason: reason.trim() || undefined,
            details: {
                codec_name,
                r_frame_rate,
                avg_frame_rate,
            }
        };
    } catch (err) {
        console.error('[Video Analysis Error]:', err);
        return { isRisky: true, reason: 'Failed to analyze file', details: {} };
    }
}

/**
 * Normalizes a video file to a standard H.264 MP4 using FFmpeg.
 * This fixes VFR, incompatible codecs, and container issues.
 */
export async function normalizeVideo(inputPath: string): Promise<string> {
    const outputDir = path.dirname(inputPath);
    const outputName = `normalized_${path.basename(inputPath, path.extname(inputPath))}.mp4`;
    const outputPath = path.join(outputDir, outputName);

    // Issue #5 & #6: Improved command with VSync VFR and Bitrate capping
    // -maxrate 5M prevents file size explosion on high-bitrate sources
    const command = `ffmpeg -i "${inputPath}" \
        -c:v libx264 -preset veryfast -crf 23 \
        -pix_fmt yuv420p \
        -vsync vfr \
        -maxrate 5M -bufsize 10M \
        -c:a aac \
        -movflags +faststart \
        -y "${outputPath}"`;

    try {
        // Issue #7: Timeout on FFmpeg (5 minutes)
        const { stderr } = await execAsync(command, { timeout: 1000 * 60 * 5 });
        if (stderr) console.log('[FFmpeg Log]:', stderr);
        return outputPath;
    } catch (err: any) {
        if (err.stderr) console.error('[FFmpeg Error Stderr]:', err.stderr);
        console.error('[Video Normalization Error]:', err);
        throw new Error('Failed to normalize video file');
    }
}
