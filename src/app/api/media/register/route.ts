import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { verifySession } from '@/lib/auth';
import { getAssetType } from '@/lib/storage';

/**
 * 📝 ASSET REGISTRATION API
 * Used to record an asset in the DB after a successful direct-to-cloud upload.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'super_admin' && session.role !== 'school_admin' && session.userType !== 'super_admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const data = await req.json();
        const { fileName, filePath, fileSize, mimeType, storageType = 'r2', folder = 'library' } = data;

        if (!fileName || !filePath) {
            return new NextResponse('Missing asset details', { status: 400 });
        }

        const assetType = getAssetType(mimeType);
        const isProcessableVideo = assetType === 'video' && storageType === 'r2';

        const [asset] = await db.insert(mediaAssets).values({
            file_name: fileName,
            original_name: fileName,
            file_path: filePath,
            mime_type: mimeType,
            file_size: fileSize,
            storage_type: storageType,
            asset_type: assetType,
            uploaded_by: session.userId,
            folder: folder,
            processing_status: isProcessableVideo ? 'pending' : 'completed',
        } as any).returning();

        // Trigger Transcoding Queue for direct uploads too
        if (isProcessableVideo) {
            try {
                const { queueService } = await import('@/lib/services/queue-service');
                await queueService.enqueueVideo({
                    assetId: asset.id,
                    filePath: filePath,
                    folder: folder,
                    timestamp: Date.now()
                });
            } catch (qError) {
                console.error('[Register] Failed to enqueue transcoding task:', qError);
            }
        }

        return NextResponse.json({
            success: true,
            assetId: asset.id,
            url: `/api/media/r2/${filePath}`,
            processingStatus: asset.processing_status
        });

    } catch (err: any) {
        console.error('[Register Error]:', err);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
