import { db } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const seedFile = path.join(process.cwd(), 'seed.sql');
    const sql = fs.readFileSync(seedFile, 'utf8');

    console.log('🚀 Starting database seeding...');

    try {
        const queryClient = postgres(process.env.DATABASE_URL!);

        // Split SQL into individual statements if possible, or run as a single batch
        // Many PG drivers handle multiple statements in one call.
        await queryClient.unsafe(sql);

        console.log('✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

main();
