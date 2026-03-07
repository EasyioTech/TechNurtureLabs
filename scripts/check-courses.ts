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

async function checkCourses() {
    try {
        console.log('Checking courses...');
        const result = await client`SELECT id, title, is_published, category FROM courses`;
        console.log('Courses in database:', result);

        const publishedCount = result.filter(r => r.is_published).length;
        const categoryCount = result.filter(r => r.category).length;

        console.log(`Total: ${result.length}, Published: ${publishedCount}, Categories Set: ${categoryCount}`);
    } catch (error) {
        console.error('Error checking courses:', error);
    } finally {
        await client.end();
    }
}

checkCourses();
