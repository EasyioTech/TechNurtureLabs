import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mediaAssets } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'video' | 'image' | 'document' | null

        let assets;
        if (type && ['video', 'image', 'document'].includes(type)) {
            assets = await db.select().from(mediaAssets)
                .where(eq(mediaAssets.asset_type, type as 'video' | 'image' | 'document'))
                .orderBy(desc(mediaAssets.created_at));
        } else {
            assets = await db.select().from(mediaAssets)
                .orderBy(desc(mediaAssets.created_at));
        }

        return NextResponse.json(assets);
    } catch (error) {
        console.error('[Media Library] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch media library' }, { status: 500 });
    }
}
