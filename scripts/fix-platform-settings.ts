import 'dotenv/config';
import postgres from 'postgres';

async function verifyFavicon() {
    const sqlUrl = process.env.DATABASE_URL;
    if (!sqlUrl) throw new Error('DATABASE_URL missing');

    const sql = postgres(sqlUrl, { max: 1 });
    console.log('🧐 Verifying favicon_url column existence...');

    try {
        const result = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'platform_settings' AND column_name = 'favicon_url'
        `;

        if (result.length === 0) {
            console.log('⚠️  favicon_url missing! Adding it manually...');
            await sql`ALTER TABLE platform_settings ADD COLUMN favicon_url text`;
            console.log('✅ Column added.');
        } else {
            console.log('✅ Column already exists.');
        }

        // Also check logo_layout etc
        const cols = ['logo_layout', 'show_platform_name', 'logo_height'];
        for (const col of cols) {
            const check = await sql`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'platform_settings' AND column_name = ${col}
            `;
            if (check.length === 0) {
                console.log(`⚠️  ${col} missing! Adding manually...`);
                if (col === 'logo_layout') await sql`ALTER TABLE platform_settings ADD COLUMN logo_layout text DEFAULT 'horizontal' NOT NULL`;
                if (col === 'show_platform_name') await sql`ALTER TABLE platform_settings ADD COLUMN show_platform_name boolean DEFAULT true NOT NULL`;
                if (col === 'logo_height') await sql`ALTER TABLE platform_settings ADD COLUMN logo_height integer DEFAULT 40 NOT NULL`;
            }
        }

    } catch (e: any) {
        console.error('❌ Verification failed:', e.message);
    } finally {
        await sql.end();
    }
}

verifyFavicon();
