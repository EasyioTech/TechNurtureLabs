/**
 * Cloudflare Stream Service
 *
 * Handles all interactions with the Cloudflare Stream API:
 *  - Direct Creator Uploads (generates a one-time upload URL)
 *  - Video status polling
 *  - Video deletion
 *
 * Videos are uploaded directly from the client browser to Cloudflare,
 * bypassing our Node.js server entirely and saving bandwidth.
 */

import { serverEnv } from '../env.server';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Wraps fetch with timeout abort controller
 */
async function fetchWithTimeout(
    url: string,
    options?: RequestInit,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

/** Whether Cloudflare Stream is configured */
export function isStreamConfigured(): boolean {
    return Boolean(
        serverEnv.CLOUDFLARE_ACCOUNT_ID &&
        serverEnv.CLOUDFLARE_STREAM_API_TOKEN
    );
}

function getHeaders() {
    return {
        'Authorization': `Bearer ${serverEnv.CLOUDFLARE_STREAM_API_TOKEN}`,
        'Content-Type': 'application/json',
    };
}

function getAccountUrl() {
    return `${CF_API_BASE}/accounts/${serverEnv.CLOUDFLARE_ACCOUNT_ID}/stream`;
}

// ─────────────────────────────────────────────────────────────
// TUS Resumable Upload
// ─────────────────────────────────────────────────────────────

export interface TusUploadResult {
    /** The TUS upload endpoint for resumable chunked upload */
    uploadUrl: string;
    /** The UID assigned to this video upload */
    uid: string;
}

/**
 * Initialize a direct creator upload with Cloudflare Stream.
 * Returns a one-time signed URL for browser-to-Cloudflare POST.
 *
 * The client will POST multipart/form-data directly to this URL.
 * No TUS protocol needed - simple, fast, reliable.
 *
 * @param fileSize - Size of the file in bytes (informational only)
 * @param meta - Optional metadata (name, etc.)
 */
export async function createTusUpload(
    fileSize: number,
    meta?: Record<string, string>
): Promise<TusUploadResult> {
    if (!isStreamConfigured()) {
        throw new Error('Cloudflare Stream is not configured.');
    }

    // Build request body for direct creator upload (NOT TUS)
    const requestBody = {
        maxDurationSeconds: 7200, // 2 hours
        ...(meta && { meta }), // Include metadata if provided
    };

    console.log('[CF Stream] Initializing direct upload:', {
        fileSize,
        maxDurationSeconds: requestBody.maxDurationSeconds,
        hasMeta: !!meta,
    });

    const res = await fetchWithTimeout(`${getAccountUrl()}/direct_upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serverEnv.CLOUDFLARE_STREAM_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        const errorDetail = text ? `\nResponse: ${text.substring(0, 500)}` : '';
        throw new Error(`Cloudflare Stream direct upload init failed (${res.status}): ${errorDetail}`);
    }

    const data = await res.json();

    // Validate response structure
    if (!data.success || !data.result) {
        const errors = data.errors || [{ message: 'Unknown error' }];
        const errorMsg = errors.map((e: any) => e.message).join('; ');
        throw new Error(`Cloudflare Stream rejected direct upload init: ${errorMsg}`);
    }

    const uploadUrl = data.result.uploadURL;
    const uid = data.result.uid;

    if (!uploadUrl || !uid) {
        throw new Error(`Cloudflare returned incomplete response: missing uploadURL or uid`);
    }

    console.log('[CF Stream] ✓ Direct upload initialized:', {
        uid,
        uploadUrl: uploadUrl.substring(0, 50) + '...',
    });

    return { uploadUrl, uid };
}

// ─────────────────────────────────────────────────────────────
// Video Status
// ─────────────────────────────────────────────────────────────

export interface StreamVideoStatus {
    uid: string;
    readyToStream: boolean;
    status: { state: string; pctComplete?: string; errorReasonCode?: string; errorReasonText?: string };
    duration: number;
    thumbnail: string;
    playback: { hls: string; dash: string };
    meta?: Record<string, string>;
}

/**
 * Get the status and details of a Cloudflare Stream video.
 */
export async function getVideoStatus(uid: string): Promise<StreamVideoStatus> {
    if (!isStreamConfigured()) {
        throw new Error('Cloudflare Stream is not configured.');
    }

    const res = await fetchWithTimeout(`${getAccountUrl()}/${uid}`, {
        headers: getHeaders(),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Cloudflare Stream get video failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const r = data.result;

    return {
        uid: r.uid,
        readyToStream: r.readyToStream,
        status: r.status,
        duration: r.duration,
        thumbnail: r.thumbnail,
        playback: r.playback,
        meta: r.meta,
    };
}

// ─────────────────────────────────────────────────────────────
// Delete Video
// ─────────────────────────────────────────────────────────────

/**
 * Delete a video from Cloudflare Stream.
 */
export async function deleteStreamVideo(uid: string): Promise<void> {
    if (!isStreamConfigured()) {
        throw new Error('Cloudflare Stream is not configured.');
    }

    const res = await fetchWithTimeout(`${getAccountUrl()}/${uid}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    // Throw on non-404 errors to catch cleanup failures
    if (!res.ok && res.status !== 404) {
        const text = await res.text().catch(() => '');
        throw new Error(`Cloudflare Stream delete failed (${res.status}): ${text}`);
    }
}

/**
 * List videos from Cloudflare Stream.
 */
export async function listStreamVideos(limit: number = 20, search?: string) {
    if (!isStreamConfigured()) {
        throw new Error('Cloudflare Stream is not configured.');
    }

    const params = new URLSearchParams({
        limit: limit.toString(),
        sort_by: 'created',
        sort_order: 'desc',
    });
    if (search) params.set('search', search);

    const res = await fetchWithTimeout(`${getAccountUrl()}?${params.toString()}`, {
        headers: getHeaders(),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Cloudflare Stream list failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return data.result.map((r: any) => ({
        uid: r.uid,
        name: r.meta?.name || 'Untitled Video',
        duration: r.duration,
        size: r.size || 0,
        thumbnail: r.thumbnail,
        readyToStream: r.readyToStream,
        created: r.created,
        preview: r.preview,
    }));
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Build the iframe embed URL for a Cloudflare Stream video.
 */
export function getStreamEmbedUrl(uid: string): string {
    return `https://iframe.videodelivery.net/${uid}`;
}

/**
 * Build the HLS playback URL for a Cloudflare Stream video.
 */
export function getStreamHlsUrl(uid: string): string {
    return `https://videodelivery.net/${uid}/manifest/video.m3u8`;
}
