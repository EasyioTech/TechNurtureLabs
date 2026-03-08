import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
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
