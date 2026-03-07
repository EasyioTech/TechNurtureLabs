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

async function patch() {
    try {
        console.log('Patching courses table with category and topics...');
        await client`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'General';`;
        await client`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "topics" TEXT NOT NULL DEFAULT 'Technology';`;

        console.log('Updating existing courses with valid data...');
        await client`UPDATE "courses" SET "category" = 'Programming', "topics" = 'Frontend, React, JavaScript', "is_published" = true WHERE "title" = 'Voluptas repudiandae'`;

        console.log('Successfully patched and updated courses table.');
    } catch (error) {
        console.error('Error patching database:', error);
    } finally {
        await client.end();
    }
}

patch();
