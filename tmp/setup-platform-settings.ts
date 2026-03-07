import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function setup() {
    try {
        console.log('--- DB SETUP ---');

        // 1. Create table if not exists
        console.log('Creating platform_settings table...');
        await sql`
            CREATE TABLE IF NOT EXISTS platform_settings (
                id              TEXT PRIMARY KEY,
                logo_url        TEXT,
                platform_name   TEXT NOT NULL DEFAULT 'TechNurture',
                hero_video_url  TEXT NOT NULL DEFAULT '',
                hero_video_type TEXT NOT NULL DEFAULT 'youtube',
                updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `;
        console.log('Table created or already exists.');

        // 2. Insert default global row
        console.log('Inserting default global row...');
        await sql`
            INSERT INTO platform_settings (id, platform_name) 
            VALUES ('global', 'TechNurture') 
            ON CONFLICT (id) DO NOTHING
        `;
        console.log('Default row inserted or already exists.');

        // 3. Verify
        const settings = await db.select().from(schema.platformSettings);
        console.log('--- CURRENT PLATFORM SETTINGS ---');
        console.table(settings);

    } catch (error: any) {
        console.error('Error during setup:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await sql.end();
    }
}

setup().catch(console.error);
