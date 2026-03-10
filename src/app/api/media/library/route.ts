import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await verifySession();
        const allowedRoles = ['super_admin', 'school_admin', 'admin'];
        const isAuthorized = session && (
            allowedRoles.includes(session.role as string) ||
            allowedRoles.includes(session.userType as string)
        );

        if (!isAuthorized) {
            console.warn('[Media Library] Unauthorized access attempt:', {
                userId: session?.userId,
                role: session?.role,
                userType: session?.userType
            });
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const folder = searchParams.get('folder');

        const filters: any[] = [];
        if (type && ['video', 'image', 'document'].includes(type)) {
            filters.push(eq(mediaAssets.asset_type, type as any));
        }
        if (folder) {
            filters.push(eq(mediaAssets.folder, folder));
        }

        const assets = await db.select().from(mediaAssets)
            .where(filters.length > 0 ? (filters.length > 1 ? and(...filters) : filters[0]) : undefined)
            .orderBy(desc(mediaAssets.created_at));

        return NextResponse.json(assets);
    } catch (error) {
        console.error('[Media Library] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch media library' }, { status: 500 });
    }
}
