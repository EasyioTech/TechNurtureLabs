/**
 * Seed script: Ensures the `classes` table always has Class 1–12.
 * Safe to run multiple times (uses ON CONFLICT DO NOTHING).
 *
 * Usage (local):
 *   npx dotenv -e .env -- npx tsx scripts/seed-classes.ts
 *
 * Usage (production / Docker):
 *   docker exec -it <container> npx tsx scripts/seed-classes.ts
 */
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

const CLASSES = Array.from({ length: 12 }, (_, i) => ({
    name: `Class ${i + 1}`,
    level: i + 1,
}));

async function main() {
    console.log('🔄 Seeding classes table...');

    for (const cls of CLASSES) {
        await sql`
      INSERT INTO classes (name, level)
      VALUES (${cls.name}, ${cls.level})
      ON CONFLICT (name) DO NOTHING
    `;
    }

    const rows = await sql`SELECT id, name, level FROM classes ORDER BY level`;
    console.log(`✅ Classes table now has ${rows.length} rows:`);
    for (const r of rows) {
        console.log(`   ${r.name} (level ${r.level}) — ${r.id}`);
    }

    await sql.end();
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
