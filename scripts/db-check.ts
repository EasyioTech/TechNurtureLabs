import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function check() {
    try {
        const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        process.stdout.write("Tables: " + JSON.stringify(result) + "\n");
        const admins = await db.execute(sql`SELECT email FROM super_admins`);
        process.stdout.write("Admins: " + JSON.stringify(admins) + "\n");
    } catch (e: any) {
        process.stderr.write("Check Error: " + (e.message || 'Unknown error') + "\n");
    }
    process.exit(0);
}

check();
