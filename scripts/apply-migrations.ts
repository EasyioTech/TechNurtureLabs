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

    try {
        // audit_fixes.sql has BEGIN/COMMIT inside it. 
        // We run it as an unsafe block.
        await sql.unsafe(auditFixesSql);
        console.log('✅ Audit fixes applied.');
    } catch (err: any) {
        console.error('❌ Error in audit fixes:', err.message);
        console.log('🔄 Attempting rollback to clear connection state...');
        try {
            await sql`ROLLBACK`;
        } catch (rbErr) {
            // Ignore rollback error if no transaction was active
        }
    }

    console.log('\n🔄 Applying Drizzle Migration 0005...');
    const migrationPath = path.join(process.cwd(), 'drizzle', '0005_new_stature.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Split by statement-breakpoint
    const statements = migrationSql.split('--> statement-breakpoint');
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed) continue;

        try {
            await sql.unsafe(trimmed);
            successCount++;
        } catch (sErr: any) {
            const msg = sErr.message.toLowerCase();
            if (
                msg.includes('already exists') ||
                msg.includes('already a member') ||
                msg.includes('is already') ||
                msg.includes('already has a value')
            ) {
                skipCount++;
            } else {
                failCount++;
                console.error(`❌ Statement failed: ${sErr.message}`);
                console.log('Statement:', trimmed);

                // If a statement fails, it might abort the implicit transaction if we are in one.
                // But sql.unsafe(trimmed) should be auto-commit.
                // However, if it's NOT (e.g. if we are already in an aborted state), we must clean up.
                if (msg.includes('current transaction is aborted')) {
                    console.log('🔄 Aborted state detected. Rolling back...');
                    await sql`ROLLBACK`.catch(() => { });
                }
            }
        }
    }

    console.log(`\n🏁 Migration stats: ${successCount} applied, ${skipCount} skipped (idempotent), ${failCount} failed.`);

    await sql.end();

    if (failCount > 0) {
        console.error('\n⚠️ Migration finished with errors. Please check the logs.');
        process.exit(1);
    } else {
        console.log('\n🎉 All migrations processed successfully!');
        process.exit(0);
    }
}

applyMigrations().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
