import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets, schoolAdmins } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

        // CRITICAL FIX #1: Enforce school_id ownership (Multi-tenancy)
        // Even though super_admin has platform-wide access, we enforce school context
        // to prevent accidental cross-school deletions and maintain audit trail
        // School-scoped admins must validate ownership if/when added to allowedRoles
        if (asset.school_id && session.userType === 'school_admin') {
            // School admins can only delete media from their own school
            const schoolAdmin = await db.query.schoolAdmins.findFirst({
                where: and(eq(schoolAdmins.id, session.userId), eq(schoolAdmins.school_id, asset.school_id))
            });
            if (!schoolAdmin) {
                return NextResponse.json({ error: 'Unauthorized: Asset belongs to a different school' }, { status: 403 });
            }
        }

        // Delete storage (R2 or local)
        try {
            if (asset.storage_type === 'r2') {
                await deleteFile(asset.file_path, asset.storage_type);
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
