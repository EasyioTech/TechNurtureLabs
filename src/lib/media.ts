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

export function computeMediaUrl(asset: {
    storage_type: string;
    file_path: string;
    file_url?: string;  // kept during Phase 1 transition; remove in Phase 2
}): string {
    if (asset.storage_type === 'r2') {
        const base = process.env.R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_R2_URL;
        if (base) {
            return `${base.replace(/\/$/, '')}/${asset.file_path}`;
        }
    }

    // Local storage: serve via the media API route
    const apiBase = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
    return `${apiBase.replace(/\/$/, '')}/api/media/${asset.file_path}`;
}

/**
 * Type representing a media asset with the minimal fields needed for URL computation.
 * Use this instead of the full MediaAsset type when you only need the URL.
 */
export type MediaAssetForUrl = {
    storage_type: string;
    file_path: string;
    file_url?: string;
};
