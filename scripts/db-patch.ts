import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
}

const client = postgres(databaseUrl);
const db = drizzle(client);

async function patch() {
    try {
        console.log('Patching database...');
        await client`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "all_grades" BOOLEAN NOT NULL DEFAULT FALSE;`;
        console.log('Successfully added all_grades column to courses table.');
    } catch (error) {
        console.error('Error patching database:', error);
    } finally {
        await client.end();
    }
}

patch();
