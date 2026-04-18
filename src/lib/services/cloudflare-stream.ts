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
// Direct Creator Upload
// ─────────────────────────────────────────────────────────────

export interface DirectUploadResult {
    /** One-time upload URL — client POSTs the video file here */
    uploadUrl: string;
    /** Cloudflare Stream video UID (optional for TUS since it's in the URL) */
    uid: string;
}

/** Result for a TUS resumable upload */
export interface TusUploadResult {
    /** The resumable TUS endpoint for the client to use */
    uploadUrl: string;
    /** The UID assigned to this video upload */
    uid: string;
}

/**
 * Request a Direct Creator Upload URL from Cloudflare Stream.
 * The client will upload the video file directly to this URL.
 *
 * @param maxDurationSeconds - Maximum allowed video duration (default 10 hours)
 * @param meta - Optional metadata to attach to the video
 */
export async function createDirectUpload(
    maxDurationSeconds: number = 36000,
    meta?: Record<string, string>
): Promise<DirectUploadResult> {
    if (!isStreamConfigured()) {
        throw new Error('Cloudflare Stream is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN.');
    }

    const body: Record<string, any> = {
        maxDurationSeconds,
    };

    if (meta) {
        body.meta = meta;
    }

    const res = await fetch(`${getAccountUrl()}/direct_upload`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Cloudflare Stream direct_upload failed (${res.status}): ${text}`);
    }

    const data = await res.json();

    return {
        uploadUrl: data.result.uploadURL,
        uid: data.result.uid,
    };
}

/**
 * Initialize a TUS (resumable) upload with Cloudflare Stream.
 * Returns a unique upload URL that the client can use with a TUS client.
 * 
 * @param fileSize - Size of the file in bytes
 * @param meta - Optional metadata
 */
export async function createTusUpload(
    fileSize: number,
    meta?: Record<string, string>
): Promise<TusUploadResult> {
    if (!isStreamConfigured()) {
        throw new Error('Cloudflare Stream is not configured.');
    }

    // Prepare metadata for TUS (keys/values must be base64 encoded)
    const metadataString = Object.entries(meta || {})
        .map(([k, v]) => `${k} ${Buffer.from(v).toString('base64')}`)
        .join(',');

    const headers: Record<string, string> = {
        'Authorization': `Bearer ${serverEnv.CLOUDFLARE_STREAM_API_TOKEN}`,
        'Tus-Resumable': '1.0.0',
        'Upload-Length': fileSize.toString(),
    };

    if (metadataString) {
        headers['Upload-Metadata'] = metadataString;
    }

    const res = await fetch(getAccountUrl(), {
        method: 'POST',
        headers,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Cloudflare Stream TUS init failed (${res.status}): ${text}`);
    }

    const uploadUrl = res.headers.get('Location');
    const uid = res.headers.get('stream-media-id');

    if (!uploadUrl || !uid) {
        throw new Error('Cloudflare Stream failed to return TUS Location or Media ID');
    }

    return {
        uploadUrl,
        uid,
    };
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

    const res = await fetch(`${getAccountUrl()}/${uid}`, {
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

    const res = await fetch(`${getAccountUrl()}/${uid}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`[CF Stream] Delete failed for ${uid}: ${text}`);
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

    const res = await fetch(`${getAccountUrl()}?${params.toString()}`, {
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
