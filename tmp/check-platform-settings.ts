import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
}

// Adjust local URL for docker if needed - though the script usually runs from host environment
let dbUrl = process.env.DATABASE_URL;
// if (dbUrl.includes('db:5432')) {
//     dbUrl = dbUrl.replace('db:5432', 'localhost:5433');
// }

const sql = postgres(dbUrl);
const db = drizzle(sql, { schema });

async function check() {
    try {
        console.log('Checking platform_settings table with raw SQL...');
        const result = await sql`SELECT * FROM platform_settings`;
        console.log('--- PLATFORM SETTINGS ---');
        console.table(result);
    } catch (error: any) {
        console.error('Error with raw SQL:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    } finally {
        await sql.end();
    }
}

check().catch(console.error);
