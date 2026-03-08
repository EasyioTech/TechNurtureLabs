import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

async function applyMigrations() {
    const sqlUrl = process.env.DATABASE_URL;
    if (!sqlUrl) {
        throw new Error('DATABASE_URL is missing');
    }

    const sql = postgres(sqlUrl, { max: 1 });

    console.log('🔄 Applying Audit Fixes...');
    const auditFixesPath = path.join(process.cwd(), 'src', 'db', 'migrations', 'audit_fixes.sql');
    const auditFixesSql = fs.readFileSync(auditFixesPath, 'utf8');

    // We run it as one unsafe block. Postgres.js handles multi-statement strings if they don't contain variables.
    try {
        await sql.unsafe(auditFixesSql);
        console.log('✅ Audit fixes applied.');
    } catch (err: any) {
        console.error('❌ Error in audit fixes:', err.message);
    }

    console.log('\n🔄 Applying Drizzle Migration 0005...');
    const migrationPath = path.join(process.cwd(), 'drizzle', '0005_new_stature.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Split by statement-breakpoint
    const statements = migrationSql.split('--> statement-breakpoint');
    for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed) continue;

        try {
            await sql.unsafe(trimmed);
            console.log('✅ Statement successful');
        } catch (sErr: any) {
            console.warn(`⚠️ Statement skipped/failed: ${sErr.message}`);
            // If it's a fatal error (not "already exists"), we might want to know
            if (!sErr.message.includes('already exists') && !sErr.message.includes('already a member')) {
                console.log('Failed statement:', trimmed);
            }
        }
    }

    console.log('\n🏁 Migration process finished.');
    await sql.end();
    process.exit(0);
}

applyMigrations();
