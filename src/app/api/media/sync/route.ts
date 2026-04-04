import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { listFiles, isCloudflareConfigured, s3Client } from '@/lib/storage';
import { verifySession } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🚀 Media Sync API
 * This endpoint scans the Cloudflare R2 bucket and synchronizes the local database
 * with the actual files present in the cloud. This fixes issues where uploaded files
 * exist in R2 but are missing from the "Library" UI.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        const allowedRoles = ['super_admin'];
        if (!session || !allowedRoles.includes(session.role as string)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCloudflareConfigured || !s3Client) {
            return NextResponse.json({ error: 'Cloudflare R2 is not configured' }, { status: 500 });
        }

        const folders = ['images', 'videos', 'documents'];
        let addedCount = 0;
        let totalCount = 0;

        for (const folder of folders) {
            const files = await listFiles(folder);
            totalCount += files.length;

            for (const file of files) {
                if (!file.Key) continue;

                // Check if this file already exists in our DB
                const existing = await db.query.mediaAssets.findFirst({
                    where: and(
                        eq(mediaAssets.path, file.Key),
                        eq(mediaAssets.storage_type, 'r2')
                    )
                });

                if (!existing) {
                    // Extract metadata from filename or use defaults
                    const filename = file.Key.split('/').pop() || file.Key;
                    const extension = filename.split('.').pop()?.toLowerCase() || '';
                    
                    // Determine asset type
                    let assetType: 'image' | 'video' | 'document' = 'document';
                    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'].includes(extension)) assetType = 'image';
                    else if (['mp4', 'mov', 'webm'].includes(extension)) assetType = 'video';

                    await db.insert(mediaAssets).values({
                        id: uuidv4(),
                        original_name: filename,
                        file_name: filename,
                        mime_type: assetType === 'image' ? `image/${extension === 'jpg' ? 'jpeg' : extension}` : 
                                  assetType === 'video' ? `video/${extension}` : 'application/octet-stream',
                        file_size: file.Size || 0,
                        asset_type: assetType,
                        storage_type: 'r2',
                        path: file.Key,
                        folder: folder,
                        is_public: true,
                        created_at: file.LastModified || new Date(),
                    });
                    addedCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synchronization complete.`,
            stats: {
                totalFilesFoundInR2: totalCount,
                newFilesAddedToLibrary: addedCount
            }
        });

    } catch (error: any) {
        console.error('[Media Sync] Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Failed to sync media library' 
        }, { status: 500 });
    }
}
