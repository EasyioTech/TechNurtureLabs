import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { listFiles, isCloudflareConfigured, s3Client } from '@/lib/storage';
import { verifySession } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { listStreamVideos } from '@/lib/services/cloudflare-stream';

/**
 * 🚀 Enhanced Media Sync API
 * This endpoint synchronizes the local database with both Cloudflare R2 bucket 
 * and Cloudflare Stream videos. It ensures that metadata like thumbnails 
 * are correctly tracked for a rich UI experience.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        const allowedRoles = ['super_admin'];
        if (!session || !allowedRoles.includes(session.role as string)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Schema Patching (Handles cases where migrations haven't run)
        try {
            // 1. Add metadata column if it doesn't exist
            await db.execute(sql`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS metadata JSONB;`);
            
            // 2. Add 'cloudflare_stream' to storage_type enum if it doesn't exist
            // Note: In Postgres, we check pg_enum table because ADD VALUE IF NOT EXISTS is only in Postgres 12+
            await db.execute(sql`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cloudflare_stream' 
                                  AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'storage_type')) THEN
                        ALTER TYPE storage_type ADD VALUE 'cloudflare_stream';
                    END IF;
                END $$;
            `);
        } catch (patchErr) {
            console.warn('[Media Sync] Schema patching notice:', patchErr);
            // Continue anyway as it might have already been patched
        }

        if (!isCloudflareConfigured) {
            return NextResponse.json({ error: 'Cloudflare is not configured' }, { status: 500 });
        }

        let addedCount = 0;
        let totalCount = 0;

        // 1. SYNC CLOUDFLARE R2 FILES
        if (s3Client) {
            const folders = ['images', 'videos', 'documents'];
            for (const folder of folders) {
                const files = await listFiles(folder);
                for (const file of files) {
                    if (!file.Key) continue;
                    totalCount++;

                    // Check if exists
                    const existing = await db.query.mediaAssets.findFirst({
                        where: and(
                            eq(mediaAssets.file_path, file.Key),
                            eq(mediaAssets.storage_type, 'r2')
                        )
                    });

                    if (!existing) {
                        const filename = file.Key.split('/').pop() || file.Key;
                        const extension = filename.split('.').pop()?.toLowerCase() || '';
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
                            file_path: file.Key,
                            folder: folder,
                            created_at: file.LastModified || new Date(),
                        });
                        addedCount++;
                    }
                }
            }
        }

        // 2. SYNC CLOUDFLARE STREAM VIDEOS
        try {
            const streamVideosRes = await listStreamVideos();
            if (streamVideosRes.success) {
                const videos = streamVideosRes.videos || [];
                for (const video of videos) {
                    totalCount++;
                    const uid = video.uid || video.id;
                    if (!uid) continue;

                    // Check if exists
                    const existing = await db.query.mediaAssets.findFirst({
                        where: and(
                            eq(mediaAssets.file_path, `stream/${uid}`),
                            eq(mediaAssets.storage_type, 'cloudflare_stream' as any)
                        )
                    });

                    if (!existing) {
                        await db.insert(mediaAssets).values({
                            id: uuidv4(),
                            original_name: video.name || video.filename || 'Untitled Stream Video',
                            file_name: uid,
                            file_url: `cf-stream://${uid}`,
                            file_path: `stream/${uid}`,
                            mime_type: 'video/mp4',
                            file_size: 0, // Approximate not needed for stream
                            asset_type: 'video',
                            storage_type: 'cloudflare_stream' as any,
                            folder: 'stream',
                            created_at: video.created ? new Date(video.created) : new Date(),
                            metadata: {
                                thumbnail: video.thumbnail,
                                preview: video.preview,
                                duration: video.duration,
                                status: video.status
                            }
                        });
                        addedCount++;
                    } else if (video.thumbnail && (!existing.metadata || (existing.metadata as any).thumbnail !== video.thumbnail)) {
                        // Update thumbnail if it changed or was missing
                        await db.update(mediaAssets)
                            .set({ 
                                metadata: { 
                                    ...(existing.metadata as any || {}), 
                                    thumbnail: video.thumbnail,
                                    preview: video.preview 
                                } 
                            })
                            .where(eq(mediaAssets.id, existing.id));
                    }
                }
            }
        } catch (streamSyncErr) {
            console.error('[Media Sync] Stream Sync error:', streamSyncErr);
            // Don't fail the whole sync if stream fails
        }

        return NextResponse.json({
            success: true,
            message: `Synchronization complete. Found ${totalCount} items. Added ${addedCount} new tracks.`,
            stats: { totalCount, addedCount }
        });

    } catch (error: any) {
        console.error('[Media Sync] Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Failed to sync media library' 
        }, { status: 500 });
    }
}
