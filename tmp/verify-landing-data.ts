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

async function verify() {
    try {
        console.log('--- DATA VERIFICATION ---');

        const settings = await db.select().from(schema.platformSettings);
        console.log('Platform Settings:', settings.length > 0 ? 'OK' : 'EMPTY');
        if (settings.length > 0) console.table(settings);

        const plans = await db.select().from(schema.paymentPlans);
        console.log('Payment Plans count:', plans.length);
        if (plans.length > 0) console.table(plans);

        const coursesCount = await db.select().from(schema.courses);
        console.log('Courses count:', coursesCount.length);

        console.log('--- END VERIFICATION ---');

    } catch (error: any) {
        console.error('Error during verification:', error.message);
    } finally {
        await sql.end();
    }
}

verify().catch(console.error);
