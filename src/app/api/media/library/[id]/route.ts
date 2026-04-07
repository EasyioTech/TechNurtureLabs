import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets, schoolAdmins } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { deleteFile } from '@/lib/storage';
import { verifySession } from '@/lib/auth';
import { deleteStreamVideo } from '@/lib/services/cloudflare-stream';

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

        // Find the asset in our database
        const asset = await db.query.mediaAssets.findFirst({
            where: eq(mediaAssets.id, id),
        });

        // 1. If asset exists in DB, handle based on storage type
        if (asset) {
            // Enforce school_id ownership (Multi-tenancy)
            if (asset.school_id && session.userType === 'school_admin' && session.role !== 'super_admin') {
                const schoolAdmin = await db.query.schoolAdmins.findFirst({
                    where: and(eq(schoolAdmins.id, session.userId), eq(schoolAdmins.school_id, asset.school_id))
                });
                if (!schoolAdmin) {
                    return NextResponse.json({ error: 'Unauthorized: Asset belongs to a different school' }, { status: 403 });
                }
            }

            try {
                if (asset.storage_type === 'r2') {
                    await deleteFile(asset.file_path, asset.storage_type);
                } else if (asset.storage_type === 'cloudflare_stream' as any) {
                    // Extract UID from file_path (e.g., "stream/UID") or file_url (e.g., "cf-stream://UID")
                    const uid = asset.file_path.replace('stream/', '');
                    await deleteStreamVideo(uid);
                }
            } catch (storageErr) {
                console.warn('[Media Library] Storage delete failed (still removing DB record):', storageErr);
            }

            // Remove DB record
            await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
            return NextResponse.json({ success: true, deletedFrom: 'database' });
        }

        // 2. If asset NOT in DB, check if the ID is a Cloudflare Stream UID (super_admin only)
        // Cloudflare Stream UIDs are typically 32-character hex strings
        const isStreamUid = /^[a-f0-9]{32}$/i.test(id);
        if (isStreamUid && session.role === 'super_admin') {
            try {
                await deleteStreamVideo(id);
                return NextResponse.json({ success: true, deletedFrom: 'cloudflare_stream' });
            } catch (cfErr) {
                console.error('[Media Library] Cloudflare Stream orphan delete failed:', cfErr);
                return NextResponse.json({ error: 'Failed to delete orphan stream video' }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    } catch (error) {
        console.error('[Media Library] DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}
