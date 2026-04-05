/**
 * APP ISSUE 4 (Issue 19): Media URL computation utility.
 *
 * PROBLEM: The `media_assets` table stores a full `file_url` (the CDN domain is
 * baked into the DB). If the CDN domain, bucket name, or R2 subdomain ever
 * changes, every existing record becomes a broken link requiring a bulk migration.
 *
 * SOLUTION: Store only `file_path` (the immutable storage key / relative path).
 * Compute the public URL at runtime from environment variables.
 *
 * MIGRATION PATH:
 *   Phase 1 (NOW)   → Use computeMediaUrl() in all API serializers instead of
 *                      returning asset.file_url directly.
 *   Phase 2 (later) → Once all serializers use this, drop the file_url column
 *                      and remove it from the schema.
 */

import crypto from 'crypto';

export function computeMediaUrl(asset: {
    storage_type: string;
    file_path: string;
    file_url?: string | null;
}, variant: 'original' | 'hls' = 'original'): string {
    let path = asset.file_path;

    // 1. Detect Video & HLS Variant
    const isVideo = path.toLowerCase().match(/\.(mp4|mov|avi|mkv)$/);
    if (variant === 'hls' && isVideo) {
        // Convention: "video1.mp4" -> "video1/master.m3u8"
        path = path.replace(/\.[^/.]+$/, "") + '/master.m3u8';
    }

    let finalUrl = '';

    // 2. Compute Base URL
    if (asset.storage_type === 'r2') {
        const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
        const publicDomain = process.env.CLOUDFLARE_PUBLIC_DOMAIN;

        if (workerUrl && isVideo) {
            // High-performance HLS Gateway
            const base = workerUrl.startsWith('http') ? workerUrl : `https://${workerUrl}`;
            finalUrl = `${base.replace(/\/$/, '')}/${path}`;
        } else if (publicDomain) {
            // Direct Public Domain access
            const base = publicDomain.startsWith('http') ? publicDomain : `https://${publicDomain}`;
            finalUrl = `${base.replace(/\/$/, '')}/${path}`;
        } else {
            const r2Base = process.env.R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_R2_URL;
            if (r2Base) {
                finalUrl = `${r2Base.replace(/\/$/, '')}/${path}`;
            } else {
                // Default: use server-side proxy for R2 assets (not public)
                finalUrl = `/api/media/r2/${path}`;
            }
        }
    } else {
        // STRICT: Local storage is disabled to save disk space.
        // Return a broken link or a placeholder if storage_type is not r2.
        console.warn(`[Media] Unsupported storage type: ${asset.storage_type}. Only 'r2' is allowed.`);
        return '/placeholder-error.png';
    }

    // 4. Security: Add temporary access token (sign the path or prefix)
    const mediaSecret = process.env.MEDIA_SECRET;
    if (mediaSecret) {
        // For HLS, we sign the parent directory so segments (.ts) are also authorized
        const isHlsRelated = variant === 'hls' || path.endsWith('.m3u8') || path.endsWith('.ts');
        const signTarget = isHlsRelated
            ? path.split('/').slice(0, -1).join('/') // Sign the folder
            : path; // Sign the file

        const hash = crypto
            .createHmac('sha256', mediaSecret)
            .update(signTarget)
            .digest('hex')
            .slice(0, 16);
        
        const connector = finalUrl.includes('?') ? '&' : '?';
        return `${finalUrl}${connector}token=${hash}`;
    }

    return finalUrl;
}

/**
 * SECURE SOLUTION FOR PRODUCTION:
 * Asynchronous version of computeMediaUrl that generates direct, short-lived 
 * signed URLs for R2 assets. This avoids proxying large files through the
 * Next.js server and enforces strict access control.
 */
export async function getSecureMediaUrl(asset: {
    storage_type: string;
    file_path: string;
    file_url?: string | null;
}, variant: 'original' | 'hls' = 'original'): Promise<string> {
    const isVideo = asset.file_path.toLowerCase().match(/\.(mp4|mov|avi|mkv)$/);
    
    // 1. If it's R2, we prefer a direct Signed URL for binary,
    // and our Smart Gateway for HLS.
    if (asset.storage_type === 'r2') {
        let path = asset.file_path;
        
        if (variant === 'hls' && isVideo) {
            // M-10: SMART GATEWAY Strategy
            // We use the local HLS rewriter route which generates direct segment 
            // signed URLs. This offloads 99% of bandwidth to Cloudflare.
            const hlsPath = path.replace(/\.[^/.]+$/, "") + '/master.m3u8';
            return `/api/media/hls/${hlsPath}`;
        }

        try {
            const { getSignedDownloadUrl } = await import('./storage');
            // Signed URLs for images/docs are valid for 1 hour
            return await getSignedDownloadUrl(path, 3600);
        } catch (err) {
            console.error('[Media] Failed to generate signed URL, falling back:', err);
        }
    }

    // 2. Fallback to the standard (potentially proxied) URL computation
    return computeMediaUrl(asset, variant);
}

/**
 * Type representing a media asset with the minimal fields needed for URL computation.
 * Use this instead of the full MediaAsset type when you only need the URL.
 */
export type MediaAssetForUrl = {
    storage_type: string;
    file_path: string;
    file_url?: string | null;
};



