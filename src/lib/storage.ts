import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { serverEnv } from './env.server';

export interface StorageContext {
    type: 'course' | 'lesson';
    id: string;
}

// ─────────────────────────────────────────────
// Security helpers
// ─────────────────────────────────────────────

/**
 * Retries `fn` up to `maxAttempts` times with exponential backoff.
 * Only retries on transient errors (connection reset, throttling, 5xx).
 * Re-throws immediately on non-retryable errors (e.g., 403, 404).
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelayMs: number = 200,
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            // Do not retry on client errors (4xx) — they are permanent.
            const status = err?.$metadata?.httpStatusCode ?? err?.statusCode;
            if (status && status >= 400 && status < 500) throw err;
            if (attempt < maxAttempts) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                console.warn(`[Storage] R2 attempt ${attempt} failed, retrying in ${delay}ms:`, err?.message ?? err);
            }
        }
    }
    throw lastError;
}

// ─────────────────────────────────────────────
// Cloudflare R2 client
// ─────────────────────────────────────────────
export const isCloudflareConfigured = Boolean(
    serverEnv.CLOUDFLARE_ACCOUNT_ID &&
    serverEnv.CLOUDFLARE_ACCESS_KEY_ID &&
    serverEnv.CLOUDFLARE_SECRET_ACCESS_KEY &&
    serverEnv.CLOUDFLARE_BUCKET_NAME
);

export let s3Client: S3Client | null = null;

if (isCloudflareConfigured) {
    s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${serverEnv.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: serverEnv.CLOUDFLARE_ACCESS_KEY_ID,
            secretAccessKey: serverEnv.CLOUDFLARE_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true, // Recommended for R2 account ID endpoints
    });
}

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Fetches an object from R2 as a stream.
 * Pass range to support partial content (seeking).
 */
export async function getObjectStream(key: string, range?: string) {
    if (!s3Client || !isCloudflareConfigured) {
        throw new Error("Cloudflare R2 is not configured. Local fallback is disabled.");
    }

    const command = new GetObjectCommand({
        Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
        Key: key,
        Range: range,
    });

    const response = await s3Client.send(command);
    return {
        body: response.Body,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        contentRange: response.ContentRange,
        acceptRanges: response.AcceptRanges,
    };
}

/**
 * Fetches an object from R2 as a Buffer.
 */
export async function getObject(key: string): Promise<Buffer> {
    if (!s3Client || !isCloudflareConfigured) {
        throw new Error("Cloudflare R2 is not configured. Local fallback is disabled.");
    }

    const command = new GetObjectCommand({
        Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
        Key: key,
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
        throw new Error(`Object ${key} has no body`);
    }

    const stream = response.Body as any;
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

/**
 * Lists objects in a specific R2 folder.
 */
export async function listFiles(prefix: string) {
    if (!s3Client || !isCloudflareConfigured) {
        console.error("[Storage] R2 not configured. Cannot list files.");
        return [];
    }

    const command = new ListObjectsV2Command({
        Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
        Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return response.Contents || [];
}

/**
 * Generates a short-lived signed URL for an R2 object.
 * Perfect for protected video streaming.
 */
export async function getSignedDownloadUrl(key: string, expiresIn: number = 300, method: string = 'GET'): Promise<string> {
    if (!s3Client || !isCloudflareConfigured) {
        throw new Error("Cloudflare R2 not configured. Local fallback is disabled.");
    }

    const commandParams = {
        Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
        Key: key,
    };

    const command = method.toUpperCase() === 'HEAD' 
        ? new HeadObjectCommand(commandParams)
        : new GetObjectCommand(commandParams);

    return await getSignedUrl(s3Client, command, { expiresIn });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Determine folder prefix from MIME type strictly based on type */
export function getFolderPrefix(mimeType: string): string {
    if (mimeType.startsWith('image/') || mimeType === 'image/x-icon' || mimeType === 'image/vnd.microsoft.icon') {
        return 'images';
    }
    if (mimeType.startsWith('video/')) {
        return 'videos';
    }
    return 'documents';
}

/** Derive normalized asset_type from MIME type */
export function getAssetType(mimeType: string): 'video' | 'image' | 'document' {
    if (mimeType.startsWith('image/') || mimeType === 'image/x-icon' || mimeType === 'image/vnd.microsoft.icon') return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
}

function buildPublicUrl(key: string): string {
    let publicDomain = serverEnv.CLOUDFLARE_PUBLIC_DOMAIN;
    if (publicDomain && !publicDomain.startsWith('http')) {
        publicDomain = `https://${publicDomain}`;
    }
    if (publicDomain && publicDomain.endsWith('/')) {
        publicDomain = publicDomain.slice(0, -1);
    }

    if (publicDomain) {
        return `${publicDomain}/${key}`;
    }

    // Default to local proxy to avoid browser SSL errors with .r2.dev subdomains.
    // The proxy route /api/media/r2/[...path] will fetch from R2 using server-side credentials.
    return `/api/media/r2/${key}`;
}

// ─────────────────────────────────────────────
// Upload
// ─────────────────────────────────────────────

export interface UploadResult {
    url: string;
    path: string;        // key (R2)
    storageType: 'r2';
    fileSize: number;
    mimeType: string;
}

const MAX_FILE_SIZE = 2048 * 1024 * 1024; // 2 GB max

/**
 * Validates file buffer against common extension magic bytes.
 * Logs warnings for suspicious files but allows upload (graceful degradation).
 * Files are converted to proper format by Sharp/FFmpeg post-upload if needed.
 */
function isValidSignature(buffer: Buffer, mimeType: string, originalFilename: string = ''): boolean {
    if (buffer.length < 4) {
        console.warn('[Storage] File too small for magic byte validation:', originalFilename);
        return true;
    }

    const signatures: Record<string, () => boolean> = {
        'application/pdf': () => buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46,
        'image/png': () => buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47,
        'image/jpeg': () => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
        'image/jpg': () => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
        'image/gif': () => buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38,
        'image/webp': () => buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46,
        'video/mp4': () => buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70,
        'video/quicktime': () => buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70,
        'video/webm': () => buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3,
        'image/svg+xml': () => {
            const start = buffer.subarray(0, 100).toString('utf-8').trim();
            return start.startsWith('<svg') || start.startsWith('<?xml');
        },
        'image/x-icon': () => buffer[0] === 0x00 && buffer[1] === 0x00 && (buffer[2] === 0x01 || buffer[2] === 0x02) && buffer[3] === 0x00,
    };

    if (signatures[mimeType]) {
        const isValid = signatures[mimeType]();
        if (!isValid) {
            console.warn(`[Storage] Invalid signature for ${mimeType} in ${originalFilename} — allowing upload anyway`);
        }
    }

    return true; 
}

/**
 * Upload a file to Cloudflare R2.
 * STRICT: Local fallback is removed to save disk space on the server.
 */
export async function uploadFile(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    context?: StorageContext,
    preferredStorage?: 'r2',
    folderHint?: string
): Promise<UploadResult> {
    const fileSize = buffer.length;

    // Security Guard: Check Size limits
    if (fileSize > MAX_FILE_SIZE) {
        throw new Error(`File size validation failed: EXCEEDS 2 GB.`);
    }

    isValidSignature(buffer, mimeType, originalFilename);

    const ext = path.extname(originalFilename);
    const folder = getFolderPrefix(mimeType);
    const fileName = `${uuidv4()}${ext}`;

    if (!isCloudflareConfigured || !s3Client) {
        throw new Error("Cloudflare R2 is not configured. Media uploads are disabled to protect server disk space.");
    }

    const key = `${folder}/${fileName}`;
    try {
        const command = new PutObjectCommand({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        });
        await withRetry(() => s3Client!.send(command));
        console.log('[Storage] ✓ R2 upload successful:', key);

        return {
            url: buildPublicUrl(key),
            path: key,
            storageType: 'r2',
            fileSize,
            mimeType,
        };
    } catch (r2Error: any) {
        console.error('[Storage] R2 Upload Error:', (r2Error as any)?.message || r2Error);
        throw new Error(`Media storage failed: Cloudflare R2 is unavailable. Local fallback is disabled.`);
    }
}

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────

/**
 * Delete a file from R2.
 * @param filePath  Storage key (R2)
 * @param storageType  Must be 'r2'
 */
export async function deleteFile(filePath: string, storageType: 'r2'): Promise<void> {

    if (filePath.startsWith('/') || filePath.includes('..')) {
        throw new Error(`[Storage] Refusing to delete: invalid key "${filePath}"`);
    }

    const isVideo = filePath.toLowerCase().match(/\.(mp4|mov|avi|mkv)$/);
    const hlsPrefix = isVideo ? filePath.replace(/\.[^/.]+$/, "") : null;

    if (!isCloudflareConfigured || !s3Client) {
        throw new Error("Cloudflare R2 not configured. Cannot delete file.");
    }

    try {
        // 1. Delete the main file
        const deleteMain = new DeleteObjectCommand({
            Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
            Key: filePath,
        });
        await withRetry(() => s3Client!.send(deleteMain));

        // 2. If it's a video, delete the HLS folder prefix
        if (hlsPrefix) {
            const { ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
            
            const listCmd = new ListObjectsV2Command({
                Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                Prefix: hlsPrefix + '/',
            });
            const listRes = await s3Client.send(listCmd);
            
            if (listRes.Contents && listRes.Contents.length > 0) {
                const deleteCmd = new DeleteObjectsCommand({
                    Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                    Delete: {
                        Objects: listRes.Contents.map(obj => ({ Key: obj.Key })),
                        Quiet: true
                    }
                });
                await s3Client.send(deleteCmd);
                console.log(`[Storage] Cleaned up ${listRes.Contents.length} HLS fragments for ${filePath}`);
            }
        }
    } catch (err) {
        console.error('[Storage] R2 delete failed:', err);
        throw err;
    }
}
