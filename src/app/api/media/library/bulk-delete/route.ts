import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { inArray, eq, and } from 'drizzle-orm';
import { deleteFile } from '@/lib/storage';
import { verifySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession();
        const allowedRoles = ['super_admin'];
        if (!session || (!allowedRoles.includes(session.role as string) && !allowedRoles.includes(session.userType as string))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ids } = await request.json();
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // Fetch assets to delete
        const assets = await db.select().from(mediaAssets).where(inArray(mediaAssets.id, ids));


        // Parallel Delete from Storage
        const storageDeletes = assets.map(asset => 
            deleteFile(asset.file_path, asset.storage_type as 'r2' | 'local')
                .catch(err => console.error(`[Bulk Delete] Failed for ${asset.id}:`, err))
        );
        await Promise.all(storageDeletes);

        // Delete from DB
        await db.delete(mediaAssets).where(inArray(mediaAssets.id, ids));

        return NextResponse.json({ success: true, count: assets.length });
    } catch (error) {
        console.error('[Media Library] Bulk DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete assets' }, { status: 500 });
    }
}
