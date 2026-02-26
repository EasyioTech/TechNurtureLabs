import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Define the local storage directory and ensure it exists
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'local_storage');

if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

let s3Client: S3Client | null = null;

const isCloudflareConfigured =
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_BUCKET_NAME;

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

/**
 * Upload a file to Cloudflare R2 if configured, otherwise fallback to local volume.
 */
export async function uploadFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<{ url: string; path: string }> {
    const ext = path.extname(originalFilename);
    const fileName = `${uuidv4()}${ext}`;

    if (isCloudflareConfigured && s3Client) {
        // Upload to Cloudflare R2
        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME as string,
            Key: fileName,
            Body: buffer,
            ContentType: mimeType,
        });

        await s3Client.send(command);

        let publicDomain = process.env.CLOUDFLARE_PUBLIC_DOMAIN;
        if (publicDomain && !publicDomain.startsWith('http')) {
            publicDomain = `https://${publicDomain}`;
        }

        // Remove trailing slash if present
        if (publicDomain && publicDomain.endsWith('/')) {
            publicDomain = publicDomain.slice(0, -1);
        }

        const url = publicDomain
            ? `${publicDomain}/${fileName}`
            : `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.CLOUDFLARE_BUCKET_NAME}/${fileName}`;

        return {
            url,
            path: fileName,
        };
    } else {
        // Fallback to local storage volume
        const filePath = path.join(LOCAL_STORAGE_DIR, fileName);
        await fs.promises.writeFile(filePath, buffer);

        return {
            url: `/api/media/${fileName}`,
            path: fileName,
        };
    }
}
