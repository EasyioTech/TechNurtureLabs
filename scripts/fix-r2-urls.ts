import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { eq, or, like } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not set in .env');
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function migrate() {
    console.log('--- Starting Global R2 URL Migration (Proxy Format) ---');

    // 1. Update media_assets
    const assets = await db.select().from(schema.mediaAssets)
        .where(
            or(
                like(schema.mediaAssets.file_url, '%.cloudflarestorage.com%'),
                like(schema.mediaAssets.file_url, '%.r2.dev%')
            )
        );
    console.log(`Checking ${assets.length} media_assets...`);
    for (const asset of assets) {
        if (asset.file_url.startsWith('/api/media/r2/')) continue;
        const newUrl = `/api/media/r2/${asset.file_path}`;
        await db.update(schema.mediaAssets).set({ file_url: newUrl }).where(eq(schema.mediaAssets.id, asset.id));
    }

    // 2. Update courses (thumbnail_url)
    const courses = await db.select().from(schema.courses)
        .where(
            or(
                like(schema.courses.thumbnail_url, '%.cloudflarestorage.com%'),
                like(schema.courses.thumbnail_url, '%.r2.dev%')
            )
        );
    console.log(`Checking ${courses.length} courses...`);
    for (const course of courses) {
        if (!course.thumbnail_url || course.thumbnail_url.startsWith('/api/media/r2/')) continue;
        const pathPart = course.thumbnail_url.split('.r2.dev/')[1] || course.thumbnail_url.split('.cloudflarestorage.com/')[1];
        if (pathPart) {
            // Remove any bucket name prefix if it's there (for cloudflarestorage.com format)
            const cleanPath = pathPart.includes('/') && !pathPart.startsWith('courses/') && !pathPart.startsWith('lessons/') && !pathPart.startsWith('images/')
                ? pathPart.substring(pathPart.indexOf('/') + 1)
                : pathPart;

            const newUrl = `/api/media/r2/${cleanPath}`;
            await db.update(schema.courses).set({ thumbnail_url: newUrl }).where(eq(schema.courses.id, course.id));
        }
    }

    // 3. Update lessons (content_url)
    const lessons = await db.select().from(schema.lessons)
        .where(
            or(
                like(schema.lessons.content_url, '%.cloudflarestorage.com%'),
                like(schema.lessons.content_url, '%.r2.dev%')
            )
        );
    console.log(`Checking ${lessons.length} lessons...`);
    for (const lesson of lessons) {
        if (!lesson.content_url || lesson.content_url.startsWith('/api/media/r2/')) continue;
        const pathPart = lesson.content_url.split('.r2.dev/')[1] || lesson.content_url.split('.cloudflarestorage.com/')[1];
        if (pathPart) {
            const cleanPath = pathPart.includes('/') && !pathPart.startsWith('courses/') && !pathPart.startsWith('lessons/') && !pathPart.startsWith('images/')
                ? pathPart.substring(pathPart.indexOf('/') + 1)
                : pathPart;

            const newUrl = `/api/media/r2/${cleanPath}`;
            await db.update(schema.lessons).set({ content_url: newUrl }).where(eq(schema.lessons.id, lesson.id));
        }
    }

    console.log('✅ --- Global Migration Complete ---');
    await sql.end();
}

migrate().catch(console.error);
