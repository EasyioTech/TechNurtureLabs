import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platformSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const settings = await db.query.platformSettings.findFirst({
            where: eq(platformSettings.id, 'global'),
            columns: { favicon_data: true },
        });

        if (settings?.favicon_data) {
            const match = settings.favicon_data.match(/^data:([^;]+);base64,(.+)$/s);
            if (match) {
                const mimeType = match[1];
                const buffer = Buffer.from(match[2], 'base64');
                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': mimeType,
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                    },
                });
            }
        }
    } catch (error) {
        console.error('Failed to serve favicon from DB:', error);
    }

    // Fallback: serve the static favicon.ico from public/
    try {
        const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
        const buffer = await readFile(faviconPath);
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'image/x-icon',
                'Cache-Control': 'public, max-age=60',
            },
        });
    } catch {
        return new NextResponse(null, { status: 404 });
    }
}
