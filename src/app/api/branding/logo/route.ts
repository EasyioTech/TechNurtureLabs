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
            columns: { logo_data: true },
        });

        if (settings?.logo_data) {
            // logo_data is stored as "data:<mime>;base64,<data>"
            const match = settings.logo_data.match(/^data:([^;]+);base64,(.+)$/s);
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
        console.error('Failed to serve logo from DB:', error);
    }

    // Fallback: serve default logo.jpg from public/assets
    try {
        const logoPath = path.join(process.cwd(), 'public', 'assets', 'logo.jpg');
        const buffer = await readFile(logoPath);
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Failed to serve fallback logo:', error);
        // Last resort: serve a minimal SVG placeholder
        const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" fill="none">
          <rect width="160" height="40" rx="8" fill="#6366f1"/>
          <text x="12" y="27" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="white">TechNurture</text>
        </svg>`;
        return new NextResponse(FALLBACK_SVG, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=60',
            },
        });
    }
}
