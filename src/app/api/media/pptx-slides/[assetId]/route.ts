import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readSlideMeta } from '@/lib/pptx-processor';

/**
 * GET /api/media/pptx-slides/[assetId]
 *
 * Returns the slide image URLs and processing status for a PPTX asset.
 *
 * Response:
 *   { status: 'completed', slides: [{url, index}], total: N }
 *   { status: 'processing' | 'pending' }
 *   { status: 'failed', error: string }
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ assetId: string }> }
) {
    const session = await verifySession();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const { assetId } = await params;

    const asset = await db.query.mediaAssets.findFirst({
        where: eq(mediaAssets.id, assetId),
    });

    if (!asset) return NextResponse.json({ status: 'error', error: 'Asset not found' }, { status: 404 });

    // Reflect the current processing_status from the DB
    const dbStatus = asset.processing_status ?? 'completed';

    if (dbStatus === 'pending' || dbStatus === 'processing') {
        return NextResponse.json({ status: dbStatus });
    }

    if (dbStatus === 'failed') {
        return NextResponse.json({
            status: 'failed',
            error: asset.error_message ?? 'Slide conversion failed',
        });
    }

    // Status is 'completed' — read the slide meta to get the count
    const meta = await readSlideMeta(assetId, asset.storage_type as 'r2' | 'local');

    if (!meta) {
        // Slides were never generated (e.g. legacy record or non-PPTX asset)
        return NextResponse.json({ status: 'failed', error: 'Slide images not found for this asset.' });
    }

    // Build slide URLs pointing at the existing media proxy routes
    const baseUrl =
        asset.storage_type === 'r2'
            ? `/api/media/r2/pptx-slides/${assetId}`
            : `/api/media/pptx-slides/${assetId}`;

    const slides = Array.from({ length: meta.slideCount }, (_, i) => ({
        index: i + 1,
        url: `${baseUrl}/slide-${String(i + 1).padStart(3, '0')}.png`,
    }));

    return NextResponse.json({
        status: 'completed',
        slides,
        total: meta.slideCount,
    });
}
