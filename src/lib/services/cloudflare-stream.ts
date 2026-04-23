/**
 * Cloudflare Stream Service
 *
 * Handles all interactions with the Cloudflare Stream API:
 *  - Direct Creator Uploads (generates a one-time upload URL)
 *  - TUS Resumable Uploads (for large files)
 *  - Video status polling
 *  - Video deletion
 *
 * Videos are uploaded via a proxy or directly, depending on size.
 */

import { serverEnv } from '../env.server';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Custom error for request timeouts
 */
export class RequestTimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RequestTimeoutError';
    }
}

/**
 * Wraps fetch with timeout abort controller and error differentiation
 */
async function fetchWithTimeout(
    url: string,
    options?: RequestInit,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
    const controller = new AbortController();
    const { signal } = controller;
    
    // Support external signals if provided
    if (options?.signal) {
        options.signal.addEventListener('abort', () => controller.abort(options.signal?.reason));
    }

    const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal,
        });
        return response;
    } catch (err: any) {
        if (err.name === 'AbortError') {
            // Check if it was our timeout or an external abort
            // fetch's AbortSignal.reason is supported in modern Node/Browsers
            if (signal.reason === 'timeout') {
                throw new RequestTimeoutError(`Request timed out after ${timeoutMs}ms`);
            }
        }
        throw err;
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

async function getResponseErrorText(res: Response): Promise<string> {
    return await res.text().catch(() => '');
}

// ─────────────────────────────────────────────────────────────
// TUS & Direct Upload Types
// ─────────────────────────────────────────────────────────────

export interface StreamUploadResult {
    /** The upload endpoint (CF direct URL or our Proxy URL) */
    uploadUrl: string;
    /** The UID assigned to this video upload */
    uid: string;
}

// ─────────────────────────────────────────────────────────────
// Direct Creator Upload (Simple POST, < 200MB)
// ─────────────────────────────────────────────────────────────

/**
 * Initialize a direct creator upload with Cloudflare Stream.
 * Returns a one-time signed URL for browser-to-Cloudflare POST.
 *
 * This uses the simple POST protocol. Works for files < 200MB.
 *
 * @param fileSize - Size of file in bytes (used for server-side validation only)
 * @param maxDurationSeconds - Duration quota to reserve
 * @param meta - Optional metadata (name, etc.)
 */
export async function createDirectUpload(
    fileSize: number,
    maxDurationSeconds: number,
    meta?: Record<string, string>
): Promise<StreamUploadResult> {
    if (!isStreamConfigured()) {
        throw new Error('Cloudflare Stream is not configured.');
    }

    // 1. Validate file size locally before hitting CF
    if (fileSize > 200 * 1024 * 1024) {
        throw new Error('File too large for direct upload. Use TUS protocol.');
    }

    // 2. Build request body
    // Note: uploadLength is NOT supported in the direct_upload JSON body
    const requestBody = {
        maxDurationSeconds,
        requireSignedURLs: false, // Default
        ...(meta && { meta }),
    };

    console.log('[CF Stream] Initializing direct upload:', {
        fileSize,
        maxDurationSeconds,
        hasMeta: !!meta,
    });

    const res = await fetchWithTimeout(`${getAccountUrl()}/direct_upload`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
        const text = await getResponseErrorText(res);
        throw new Error(`Cloudflare Stream direct upload init failed (${res.status}): ${text}`);
    }

    const data = await res.json();

    if (!data.success || !data.result) {
        const errors = (data.errors as Array<{ message: string }>) || [{ message: 'Unknown error' }];
        throw new Error(`Cloudflare Stream rejected direct upload init: ${errors.map(e => e.message).join('; ')}`);
    }

    const uploadUrl = data.result.uploadURL;
    const uid = data.result.uid;

    if (!uploadUrl || !uid) {
        throw new Error('Cloudflare returned incomplete response: missing uploadURL or uid');
    }

    return { uploadUrl, uid };
}

// ─────────────────────────────────────────────────────────────
// TUS Resumable Upload (PATCH, >= 200MB)
// ─────────────────────────────────────────────────────────────

/**
 * Initialize a TUS protocol upload with Cloudflare Stream.
 * Required for files >= 200MB. Supports resumable/chunked uploads.
 */
export async function createTusUploadUrl(
    fileSize: number,
    maxDurationSeconds: number,
    meta?: Record<string, string>
): Promise<StreamUploadResult> {
    if (!isStreamConfigured()) {
        throw new Error('Cloudflare Stream is not configured.');
    }

    if (fileSize < 1) {
        throw new Error('File size must be at least 1 byte');
    }

    // 1. Prepare TUS Metadata (Base64 encoded)
    const metaEntries = meta
        ? Object.entries(meta).map(([key, value]) => `${key} ${Buffer.from(value).toString('base64')}`)
        : [];
    metaEntries.push(`maxDurationSeconds ${Buffer.from(maxDurationSeconds.toString()).toString('base64')}`);
    const uploadMetadata = metaEntries.join(',');

    console.log('[CF Stream] Creating TUS session:', { fileSize, maxDurationSeconds });

    // 2. Create TUS Session
    // We send maxDurationSeconds as a specific header as required by CF Stream TUS
    // IMPORTANT: We do NOT use getHeaders() here because it includes 'Content-Type: application/json'
    // which can confuse Cloudflare into thinking this is a basic upload instead of TUS.
    const res = await fetchWithTimeout(`${getAccountUrl()}?direct_user=true`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serverEnv.CLOUDFLARE_STREAM_API_TOKEN}`,
            'Tus-Resumable': '1.0.0',
            'Upload-Length': fileSize.toString(),
            'Upload-Metadata': uploadMetadata,
        },
    });

    if (!res.ok) {
        const text = await getResponseErrorText(res);
        throw new Error(`Cloudflare Stream TUS creation failed (${res.status}): ${text}`);
    }

    // 3. Extract and normalize Session URL
    let sessionUrl = res.headers.get('Location');
    if (!sessionUrl) {
        throw new Error('Cloudflare Stream TUS creation succeeded but missing Location header');
    }

    // Normalize relative URLs (path or partial) to absolute
    if (!sessionUrl.startsWith('http')) {
        const accountUrl = getAccountUrl();
        const origin = new URL(accountUrl).origin;
        if (sessionUrl.startsWith('/')) {
            sessionUrl = `${origin}${sessionUrl}`;
        } else {
            const base = accountUrl.endsWith('/') ? accountUrl : `${accountUrl}/`;
            sessionUrl = `${base}${sessionUrl}`;
        }
    }

    const uid = res.headers.get('stream-media-id');
    if (!uid) {
        throw new Error('Cloudflare Stream TUS creation succeeded but missing stream-media-id header');
    }

    return { uploadUrl: sessionUrl, uid };
}

// ─────────────────────────────────────────────────────────────
// Video Status & Management
// ─────────────────────────────────────────────────────────────

export interface StreamVideoStatus {
    uid: string;
    readyToStream: boolean;
    status: { 
        state: string; 
        pctComplete?: string; 
        errorReasonCode?: string; 
        errorReasonText?: string 
    };
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
        const text = await getResponseErrorText(res);
        throw new Error(`Cloudflare Stream get video failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    
    // Robust validation of result object
    if (!data.success || !data.result) {
        throw new Error(`Cloudflare Stream API returned success:false or missing result for UID: ${uid}`);
    }

    const r = data.result;

    return {
        uid: r.uid,
        readyToStream: r.readyToStream,
        status: r.status,
        duration: r.duration || 0,
        thumbnail: r.thumbnail,
        playback: r.playback,
        meta: r.meta,
    };
}

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

    if (!res.ok && res.status !== 404) {
        const text = await getResponseErrorText(res);
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
        const text = await getResponseErrorText(res);
        throw new Error(`Cloudflare Stream list failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    if (!data.success || !Array.isArray(data.result)) {
        return [];
    }

    return data.result.map((r: any) => ({
        uid: r.uid,
        name: r.meta?.name || 'Untitled Video',
        duration: r.duration || 0,
        size: typeof r.size === 'number' ? r.size : 0, // Robust size handling
        thumbnail: r.thumbnail,
        readyToStream: r.readyToStream,
        created: r.created,
        preview: r.preview,
    }));
}

// ─────────────────────────────────────────────────────────────
// Playback Helpers
// ─────────────────────────────────────────────────────────────

export function getStreamEmbedUrl(uid: string): string {
    return `https://iframe.videodelivery.net/${uid}`;
}

export function getStreamHlsUrl(uid: string): string {
    return `https://videodelivery.net/${uid}/manifest/video.m3u8`;
}
