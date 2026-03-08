import 'dotenv/config';
import postgres from 'postgres';

async function fixTopics() {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    console.log('Fixing courses.topics column with string_to_array...');
    try {
        await sql.unsafe('ALTER TABLE courses ALTER COLUMN topics DROP DEFAULT');
        // Convert existing strings to arrays. If it's already an array, this might fail, but let's assume it's string.
        await sql.unsafe("ALTER TABLE courses ALTER COLUMN topics TYPE text[] USING string_to_array(topics, ',')");
        await sql.unsafe("ALTER TABLE courses ALTER COLUMN topics SET DEFAULT '{}'");
        console.log('✅ courses.topics fixed');
    } catch (e: any) {
        console.log('❌ Failed to fix courses.topics:', e.message);
    }
    await sql.end();
}

fixTopics();
