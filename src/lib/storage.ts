import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { serverEnv } from './env.server';

export interface StorageContext {
    type: 'course' | 'lesson';
    id: string;
}

// ─────────────────────────────────────────────
// Local fallback storage
// ─────────────────────────────────────────────
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'local_storage');

if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
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
    });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Determine folder prefix from MIME type and optional context */
function getFolderPrefix(mimeType: string, context?: StorageContext): string {
    const typeFolder = mimeType.startsWith('image/') ? 'images' :
        mimeType.startsWith('video/') ? 'videos' : 'documents';

    if (context && context.id && context.type) {
        // e.g., "courses/123/images" or "lessons/456/videos"
        return `${context.type}s/${context.id}/${typeFolder}`;
    }

    return typeFolder;
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
    if (publicDomain.endsWith('/')) {
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
    path: string;        // key (R2) or filename (local)
    storageType: 'r2' | 'local';
    fileSize: number;
    mimeType: string;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB max

/**
 * Validates file buffer against common extension magic bytes to prevent mislabeled file exploit.
 */
function isValidSignature(buffer: Buffer, mimeType: string, originalFilename: string = ''): boolean {
    if (buffer.length < 8) return false;

    if (mimeType === 'application/pdf') {
        return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
    }
    if (mimeType === 'image/png') {
        return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47; // ‰PNG
    }
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff; // ÿØÿ
    }
    if (mimeType === 'image/gif') {
        return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38; // GIF8
    }
    if (mimeType === 'image/webp') {
        return buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // RIFF
    }
    if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') {
        return buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70; // ftyp
    }
    if (mimeType === 'video/webm') {
        return buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04; // PK..
    }
    if (mimeType === 'application/vnd.ms-powerpoint' || mimeType === 'application/msword') {
        return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
    }
    if (mimeType === 'image/svg+xml') {
        const start = buffer.subarray(0, 100).toString('utf-8').trim();
        return start.startsWith('<svg') || start.startsWith('<?xml');
    }
    if (mimeType === 'image/x-icon' || mimeType === 'image/vnd.microsoft.icon' || originalFilename.endsWith('.ico')) {
        // ICO signature: 00 00 01 00 (icon) or 00 00 02 00 (cursor)
        return buffer[0] === 0x00 && buffer[1] === 0x00 && (buffer[2] === 0x01 || buffer[2] === 0x02) && buffer[3] === 0x00;
    }

    // Explicit rejection for unmapped or potentially malicious types
    return false;
}

/**
 * Upload a file to Cloudflare R2.
 * On any R2 error, automatically falls back to local volume storage.
 */
export async function uploadFile(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    context?: StorageContext
): Promise<UploadResult> {
    const fileSize = buffer.length;

    // Security Guard: Check Size limits
    if (fileSize > MAX_FILE_SIZE) {
        throw new Error(`File size validation failed: EXCEEDS 500 MB.`);
    }

    // Security Guard: Soft Magic checking
    if (!isValidSignature(buffer, mimeType, originalFilename)) {
        throw new Error(`Security validation failed: Invalid file signature for mimeType ${mimeType}`);
    }

    const ext = path.extname(originalFilename);
    const folder = getFolderPrefix(mimeType, context);
    const fileName = `${uuidv4()}${ext}`;

    // ── Attempt R2 upload ──────────────────────────────────────────────
    if (isCloudflareConfigured && s3Client) {
        const key = `${folder}/${fileName}`;
        try {
            const command = new PutObjectCommand({
                Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
            });
            await s3Client.send(command);

            return {
                url: buildPublicUrl(key),
                path: key,
                storageType: 'r2',
                fileSize,
                mimeType,
            };
        } catch (r2Error) {
            // R2 upload failed — warn and fall through to local
            console.warn('[Storage] R2 upload failed, falling back to local storage:', r2Error);
        }
    }

    // ── Local volume fallback ─────────────────────────────────────────
    const subDir = path.join(LOCAL_STORAGE_DIR, folder);
    if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
    }
    const localPath = path.join(subDir, fileName);
    await fs.promises.writeFile(localPath, buffer);

    return {
        url: `/api/media/${folder}/${fileName}`,
        path: `${folder}/${fileName}`,
        storageType: 'local',
        fileSize,
        mimeType,
    };
}

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────

/**
 * Delete a file from R2 or local storage.
 * @param filePath  Storage key (R2) or relative path like "videos/uuid.mp4" (local)
 * @param storageType  Where the file lives
 */
export async function deleteFile(filePath: string, storageType: 'r2' | 'local'): Promise<void> {
    if (storageType === 'r2' && isCloudflareConfigured && s3Client) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                Key: filePath,
            });
            await s3Client.send(command);
        } catch (err) {
            console.error('[Storage] R2 delete failed:', err);
            throw err;
        }
    } else {
        const fullPath = path.join(LOCAL_STORAGE_DIR, filePath);
        if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
        }
    }
}
