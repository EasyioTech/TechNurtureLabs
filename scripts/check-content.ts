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
    const cs = await db.select().from(schema.courses).limit(5);
    console.log('--- COURSES ---');
    cs.forEach(c => console.log(`[${c.id}] ${c.title} -> ${c.thumbnail_url}`));

    const ls = await db.select().from(schema.lessons).limit(5);
    console.log('--- LESSONS ---');
    ls.forEach(l => console.log(`[${l.id}] ${l.title} -> ${l.content_url}`));

    await sql.end();
}

check().catch(console.error);
