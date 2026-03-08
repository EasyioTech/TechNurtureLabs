import 'dotenv/config';
import postgres from 'postgres';

async function fixInetCasts() {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    console.log('Fixing IP address columns to inet...');
    try {
        await sql.unsafe('ALTER TABLE audit_logs ALTER COLUMN ip_address TYPE inet USING ip_address::inet');
        console.log('✅ audit_logs fixed');
    } catch (e: any) {
        console.log('⏭️ audit_logs (already inet or missing):', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE login_attempts ALTER COLUMN ip_address TYPE inet USING ip_address::inet');
        console.log('✅ login_attempts fixed');
    } catch (e: any) {
        console.log('⏭️ login_attempts (already inet or missing):', e.message);
    }

    try {
        await sql.unsafe('ALTER TABLE courses ALTER COLUMN topics TYPE text[] USING topics::text[]');
        console.log('✅ courses.topics fixed');
    } catch (e: any) {
        console.log('⏭️ courses.topics (already text[] or missing):', e.message);
    }

    await sql.end();
}

fixInetCasts();
