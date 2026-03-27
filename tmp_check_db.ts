import 'dotenv/config';
import { db } from './src/lib/db';
import { platformSettings } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    try {
        const settings = await db.query.platformSettings.findFirst({
            where: eq(platformSettings.id, 'global')
        });
        console.log('DB_SETTINGS:', JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('DB_ERROR:', error);
    }
    process.exit(0);
}

main();
