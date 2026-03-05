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

async function check() {
    const assets = await db.select().from(schema.mediaAssets).limit(10);
    console.log('--- DB ASSETS ---');
    assets.forEach(a => {
        console.log(`[${a.id}] ${a.original_name} -> ${a.file_url}`);
    });
    await sql.end();
}

check().catch(console.error);
