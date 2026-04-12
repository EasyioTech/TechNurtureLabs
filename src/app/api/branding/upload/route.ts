import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platformSettings } from '@/db/schema';
import { verifySession } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB limit for DB storage

export async function POST(request: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string | null; // 'logo' | 'favicon'

        if (!file || !type || !['logo', 'favicon'].includes(type)) {
            return NextResponse.json({ error: 'Invalid request: file and type (logo|favicon) required' }, { status: 400 });
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Use PNG, JPG, SVG, WebP, GIF, or ICO.' }, { status: 400 });
        }

        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: 'File too large. Maximum size is 2MB for branding assets.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        // Upsert into platform_settings
        const existing = await db.query.platformSettings.findFirst({
            where: eq(platformSettings.id, 'global'),
        });

        const field = type === 'logo' ? 'logo_data' : 'favicon_data';
        const urlField = type === 'logo' ? 'logo_url' : 'favicon_url';
        const url = `/api/branding/${type}`;

        if (existing) {
            await db.update(platformSettings)
                .set({ [field]: dataUri, [urlField]: url, updated_at: new Date() })
                .where(eq(platformSettings.id, 'global'));
        } else {
            await db.insert(platformSettings)
                .values({ id: 'global', [field]: dataUri, [urlField]: url });
        }

        revalidateTag('platform-settings');
        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error('Branding upload error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await verifySession();
        if (!session || session.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type } = await request.json() as { type: 'logo' | 'favicon' };
        if (!type || !['logo', 'favicon'].includes(type)) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const field = type === 'logo' ? 'logo_data' : 'favicon_data';
        const urlField = type === 'logo' ? 'logo_url' : 'favicon_url';

        await db.update(platformSettings)
            .set({ [field]: null, [urlField]: null, updated_at: new Date() })
            .where(eq(platformSettings.id, 'global'));

        revalidateTag('platform-settings');
        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Branding delete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
