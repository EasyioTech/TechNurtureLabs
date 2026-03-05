import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

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
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_BUCKET_NAME
);

export let s3Client: S3Client | null = null;

if (isCloudflareConfigured) {
    s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY as string,
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
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
}

function buildPublicUrl(key: string): string {
    let publicDomain = process.env.CLOUDFLARE_PUBLIC_DOMAIN || '';
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
    const ext = path.extname(originalFilename);
    const folder = getFolderPrefix(mimeType, context);
    const fileName = `${uuidv4()}${ext}`;
    const fileSize = buffer.length;

    // ── Attempt R2 upload ──────────────────────────────────────────────
    if (isCloudflareConfigured && s3Client) {
        const key = `${folder}/${fileName}`;
        try {
            const command = new PutObjectCommand({
                Bucket: process.env.CLOUDFLARE_BUCKET_NAME as string,
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
                Bucket: process.env.CLOUDFLARE_BUCKET_NAME as string,
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
