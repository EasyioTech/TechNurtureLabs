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

async function getResponseErrorText(res: Response): Promise<string> {
    return await res.text().catch(() => '');
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
 * Works for files < 200MB. For larger files, use createTusUploadUrl() instead.
 *
 * @param fileSize - Size of file in bytes (used for validation, not sent to API)
 * @param maxDurationSeconds - Duration quota to reserve (calculated by caller)
 * @param meta - Optional metadata (name, etc.)
 */
export async function createDirectUpload(
    fileSize: number,
    maxDurationSeconds: number,
    meta?: Record<string, string>
): Promise<TusUploadResult> {
    if (!isStreamConfigured()) {
        throw new Error('Cloudflare Stream is not configured.');
    }

    // Build request body for direct creator upload (NOT TUS)
    const requestBody = {
        maxDurationSeconds,
        uploadLength: fileSize, // Inform CF about expected file size
        ...(meta && { meta }), // Include metadata if provided
    };

    console.log('[CF Stream] Initializing direct upload:', {
        fileSize,
        maxDurationSeconds: requestBody.maxDurationSeconds,
        hasMeta: !!meta,
    });

    const res = await fetchWithTimeout(`${getAccountUrl()}/direct_upload`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
        const text = await getResponseErrorText(res);
        const errorDetail = text ? `\nResponse: ${text.substring(0, 500)}` : '';
        throw new Error(`Cloudflare Stream direct upload init failed (${res.status}): ${errorDetail}`);
    }

    const data = await res.json();

    // Validate response structure
    if (!data.success || !data.result) {
        const errors = (data.errors as Array<{ message: string }>) || [{ message: 'Unknown error' }];
        const errorMsg = errors.map((e) => e.message).join('; ');
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

/**
 * Initialize a TUS protocol upload with Cloudflare Stream.
 * Required for files >= 200MB. Supports resumable/chunked uploads.
 *
 * @param fileSize - Size of file in bytes (required for TUS protocol)
 * @param maxDurationSeconds - Duration quota to reserve (calculated by caller)
 * @param meta - Optional metadata (name, etc.)
 */
export async function createTusUploadUrl(
    fileSize: number,
    maxDurationSeconds: number,
    meta?: Record<string, string>
): Promise<TusUploadResult> {
    if (!isStreamConfigured()) {
        throw new Error('Cloudflare Stream is not configured.');
    }

    if (fileSize < 1) {
        throw new Error('File size must be at least 1 byte');
    }

    // Build request body with TUS support
    const requestBody = {
        maxDurationSeconds,
        uploadLength: fileSize, // Required/Recommended for TUS protocol
        tusv2: true, // Enable TUS v1.0.0 protocol support (required for >200MB)
        ...(meta && { meta }),
    };

    console.log('[CF Stream] Initializing TUS upload:', {
        fileSize,
        maxDurationSeconds: requestBody.maxDurationSeconds,
        hasMeta: !!meta,
    });

    const res = await fetchWithTimeout(`${getAccountUrl()}/direct_upload`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
        const text = await getResponseErrorText(res);
        const errorDetail = text ? `\nResponse: ${text.substring(0, 500)}` : '';
        throw new Error(`Cloudflare Stream TUS init failed (${res.status}): ${errorDetail}`);
    }

    const data = await res.json();

    // Validate response structure
    if (!data.success || !data.result) {
        const errors = (data.errors as Array<{ message: string }>) || [{ message: 'Unknown error' }];
        const errorMsg = errors.map((e) => e.message).join('; ');
        throw new Error(`Cloudflare Stream rejected TUS init: ${errorMsg}`);
    }

    const signedUrl = data.result.uploadURL;
    const uid = data.result.uid;

    if (!signedUrl || !uid) {
        throw new Error(`Cloudflare returned incomplete response: missing uploadURL or uid`);
    }

    // CRITICAL: The signedUrl from /direct_upload is the CREATION endpoint.
    // To get the actual TUS session URL for PATCH requests, we must perform a handshake.
    console.log(`[CF Stream] Performing TUS handshake for ${uid}...`);
    
    const handshakeRes = await fetch(signedUrl, {
        method: 'POST',
        headers: {
            'Tus-Resumable': '1.0.0',
            'Upload-Length': fileSize.toString(),
            // Metadata is already handled by the /direct_upload call if tusv2: true is set,
            // but we can provide it again or just let Cloudflare use the preset one.
        }
    });

    if (!handshakeRes.ok && handshakeRes.status !== 201) {
        const text = await getResponseErrorText(handshakeRes);
        console.error(`[CF Stream] TUS handshake failed (${handshakeRes.status}):`, text);
        // Fallback to signedUrl if handshake fails, though PATCH might fail later
        return { uploadUrl: signedUrl, uid };
    }

    // The REAL session URL is in the Location header
    const sessionUrl = handshakeRes.headers.get('Location');
    
    if (!sessionUrl) {
        console.warn(`[CF Stream] Handshake succeeded but no Location header for ${uid}. Using signed URL.`);
        return { uploadUrl: signedUrl, uid };
    }

    console.log('[CF Stream] ✓ TUS session created:', {
        uid,
        sessionUrl: sessionUrl.substring(0, 50) + '...',
    });

    return { uploadUrl: sessionUrl, uid };
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
        const text = await getResponseErrorText(res);
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
