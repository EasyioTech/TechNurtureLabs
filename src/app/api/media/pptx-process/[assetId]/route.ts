import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/media/pptx-process/[assetId]
 *
 * Re-triggers PPTX → slide images conversion for an asset that previously
 * failed or is stuck in pending/processing state.
 *
 * Resets processing_status to 'processing', runs the conversion in the
 * background, then updates to 'completed' or 'failed'.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ assetId: string }> }
) {
    const session = await verifySession();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const { assetId } = await params;

    const asset = await db.query.mediaAssets.findFirst({
        where: eq(mediaAssets.id, assetId),
    });

    if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Reset status so the viewer starts polling again
    await db.update(mediaAssets)
        .set({ processing_status: 'processing', error_message: null } as any)
        .where(eq(mediaAssets.id, assetId));

    // Fire conversion in background
    setImmediate(async () => {
        try {
            const { processPptxToSlides } = await import('@/lib/pptx-processor');
            const result = await processPptxToSlides(
                assetId,
                asset.file_path,
                asset.storage_type as 'r2' | 'local'
            );
            const { eq: eqInner } = await import('drizzle-orm');
            if (result.success) {
                await db.update(mediaAssets)
                    .set({ processing_status: 'completed' })
                    .where(eqInner(mediaAssets.id, assetId));
                console.log(`[pptx-process] Retry succeeded for ${assetId} (${result.slideCount} slides)`);
            } else {
                await db.update(mediaAssets)
                    .set({ processing_status: 'failed', error_message: result.error } as any)
                    .where(eqInner(mediaAssets.id, assetId));
                console.error(`[pptx-process] Retry failed for ${assetId}:`, result.error);
            }
        } catch (err: any) {
            console.error('[pptx-process] Retry threw:', err?.message);
            const { eq: eqInner } = await import('drizzle-orm');
            await db.update(mediaAssets)
                .set({ processing_status: 'failed', error_message: err?.message ?? 'Unknown error' } as any)
                .where(eqInner(mediaAssets.id, assetId));
        }
    });

    return NextResponse.json({ status: 'processing' });
}
