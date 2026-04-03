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
        const allowedRoles = ['super_admin'];
        const isAuthorized = session && (
            allowedRoles.includes(session.role as string) ||
            allowedRoles.includes(session.userType as string)
        );

        if (!isAuthorized) {
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


        // Delete storage (R2 or local) — stream videos are managed by Cloudflare
        try {
            const storageType = asset.storage_type as string;
            if (storageType === 'stream') {
                // Stream videos are managed by Cloudflare, just delete DB record
                console.log('[Media Library] Skipping Cloudflare Stream deletion (managed separately)');
            } else if (storageType === 'r2' || storageType === 'local') {
                await deleteFile(asset.file_path, storageType as 'r2' | 'local');
            }
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
