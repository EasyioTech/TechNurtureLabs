import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { db } from '@/lib/db';
import { mediaAssets, schools } from '@/db/schema';
import { verifySession } from '@/lib/auth';
import { getAssetType, s3Client, isCloudflareConfigured } from '@/lib/storage';
import { eq } from 'drizzle-orm';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { serverEnv } from '@/lib/env.server';

/**
 * 📝 ASSET REGISTRATION API
 * Used to record an asset in the DB after a successful direct-to-cloud upload.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'super_admin' && session.userType !== 'super_admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const data = await req.json();
        const { fileName, filePath, fileSize, mimeType, storageType = 'r2', folder = 'library' } = data;

        if (!fileName || !filePath) {
            return new NextResponse('Missing asset details', { status: 400 });
        }

        // CRITICAL FIX: Super admins uploading platform-wide media must use a default school
        // Authorization check above ensures ONLY super_admin can reach this point
        // Since media_assets.school_id has NOT NULL constraint, assign to first school
        // This ensures platform-wide media (courses, lessons, content) is owned by a school
        let schoolId: string | null = null;
        const firstSchool = await db.query.schools.findFirst({
            columns: { id: true }
        });
        schoolId = firstSchool?.id || null;

        if (!schoolId) {
            return new NextResponse('No schools configured - cannot register media', { status: 503 });
        }

        const assetType = getAssetType(mimeType);
        const isProcessableVideo = assetType === 'video' && storageType === 'r2';
        const isPptx =
            mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            mimeType === 'application/vnd.ms-powerpoint';

        // file_name = the UUID-based storage key (basename of filePath)
        // original_name = the human-readable filename the user uploaded
        const uuidFileName = path.basename(filePath);

        // PHASE 4: Verify file actually exists in R2 before registering DB record
        if (isCloudflareConfigured && s3Client) {
            try {
                const headCmd = new HeadObjectCommand({
                    Bucket: serverEnv.CLOUDFLARE_BUCKET_NAME,
                    Key: filePath,
                });
                await s3Client.send(headCmd);
            } catch (err: any) {
                const status = err?.$metadata?.httpStatusCode;
                if (status === 404 || err.name === 'NoSuchKey') {
                    return new NextResponse(
                        JSON.stringify({
                            error: `File not found in R2: ${filePath}`,
                            code: 'FILE_NOT_UPLOADED'
                        }),
                        { status: 422, headers: { 'Content-Type': 'application/json' } }
                    );
                }
                throw err;
            }
        }

        const [asset] = await db.insert(mediaAssets).values({
            file_name: uuidFileName,
            original_name: fileName,
            file_path: filePath,
            mime_type: mimeType,
            file_size: fileSize,
            storage_type: storageType,
            asset_type: assetType,
            uploaded_by: session.userId,
            school_id: schoolId, // CRITICAL FIX: Capture school context at upload time
            folder: folder,
            processing_status: 'completed',
        } as any).returning();

        // Compute the final URL using the standard utility
        const { computeMediaUrl } = await import('@/lib/media');
        const finalUrl = computeMediaUrl(asset);

        return NextResponse.json({
            success: true,
            assetId: asset.id,
            asset: {
                id: asset.id,
                file_name: asset.file_name,
                original_name: asset.original_name,
                file_url: finalUrl,
                file_path: asset.file_path,
                mime_type: asset.mime_type,
                file_size: asset.file_size,
                storage_type: asset.storage_type,
                asset_type: asset.asset_type,
                created_at: asset.created_at
            },
            url: finalUrl,
            processingStatus: asset.processing_status,
            // Add cache-busting header info for client
            refreshRequired: true
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (err: any) {
        console.error('[Register Error]:', err);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
