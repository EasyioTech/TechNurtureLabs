import 'dotenv/config';
import postgres from 'postgres';

async function fixLessons() {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    console.log('Migrating "quiz" content type lessons...');
    try {
        // Find if any lessons have content_type 'quiz'
        const lessonsWithQuiz = await sql`SELECT id FROM lessons WHERE content_type = 'quiz'`;
        console.log(`Found ${lessonsWithQuiz.length} lessons with "quiz" type.`);

        if (lessonsWithQuiz.length > 0) {
            // Update them to 'video' or similar valid enum value
            await sql`UPDATE lessons SET content_type = 'video' WHERE content_type = 'quiz'`;
            console.log('✅ Lessons migrated to "video" type.');
        }
    } catch (e: any) {
        console.log('❌ Error fixing lessons:', e.message);
    }
    await sql.end();
}

fixLessons();
