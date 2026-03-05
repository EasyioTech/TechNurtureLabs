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

async function fixCourses() {
    try {
        console.log('Marking all current courses as "All Grades" to fix visibility...');
        const result = await client`UPDATE courses SET all_grades = TRUE WHERE is_published = TRUE`;
        console.log('Successfully updated courses.');

        const check = await client`SELECT title, all_grades FROM courses`;
        console.log('Current status:', check);
    } catch (error) {
        console.error('Error fixing courses:', error);
    } finally {
        await client.end();
    }
}

fixCourses();
