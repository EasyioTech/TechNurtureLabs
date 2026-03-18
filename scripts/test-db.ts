import 'dotenv/config';
import { db } from '../src/lib/db';
import { students } from '../src/db/schema';

async function check() {
    try {
        const u = await db.select().from(students).limit(5);
        console.log(JSON.stringify(u, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
