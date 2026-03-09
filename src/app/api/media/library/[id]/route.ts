import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { deleteFile } from '@/lib/storage';
import { verifySession } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== 'admin' && session.role !== 'school_admin' && session.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Find the asset
        const asset = await db.query.mediaAssets.findFirst({
            where: eq(mediaAssets.id, id),
        });

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Delete storage (R2 or local) — best effort; always delete DB record
        try {
            await deleteFile(asset.file_path, asset.storage_type as 'r2' | 'local');
        } catch (storageErr) {
            console.warn('[Media Library] Storage delete failed (still removing DB record):', storageErr);
        }

        // Remove DB record
        await db.delete(mediaAssets).where(eq(mediaAssets.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Media Library] DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}
