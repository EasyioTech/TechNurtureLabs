import 'dotenv/config';
import postgres from 'postgres';

async function repairSchema() {
    const sqlUrl = process.env.DATABASE_URL;
    if (!sqlUrl) throw new Error('DATABASE_URL missing');

    const sql = postgres(sqlUrl, { max: 1 });
    console.log('🛠️  Starting Emergency Schema Repair...');

    async function addColumnIfMissing(table: string, column: string, type: string, defaultValue?: string) {
        const result = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = ${table} AND column_name = ${column}
        `;
        if (result.length === 0) {
            console.log(`⚠️  ${table}.${column} missing! Adding...`);
            let query = `ALTER TABLE ${table} ADD COLUMN ${column} ${type}`;
            if (defaultValue !== undefined) {
                query += ` DEFAULT ${defaultValue}`;
            }
            await sql.unsafe(query);
            console.log(`   ✅ ${column} added.`);
        } else {
            console.log(`   ✅ ${table}.${column} exists.`);
        }
    }

    try {
        // --- Platform Settings ---
        console.log('\n--- Checking platform_settings ---');
        await addColumnIfMissing('platform_settings', 'favicon_url', 'text');
        await addColumnIfMissing('platform_settings', 'logo_layout', 'text', "'horizontal' NOT NULL");
        await addColumnIfMissing('platform_settings', 'show_platform_name', 'boolean', "true NOT NULL");
        await addColumnIfMissing('platform_settings', 'logo_height', 'integer', "40 NOT NULL");

        // --- Users ---
        console.log('\n--- Checking users ---');
        await addColumnIfMissing('users', 'two_factor_secret', 'text');
        await addColumnIfMissing('users', 'two_factor_enabled', 'boolean', "false NOT NULL");
        await addColumnIfMissing('users', 'two_factor_backup_codes', 'jsonb', "'[]'::jsonb NOT NULL");
        await addColumnIfMissing('users', 'deleted_at', 'timestamp with time zone');

        // --- Sessions ---
        console.log('\n--- Checking session tables ---');
        // Ensure user_sessions exists (it might be entirely missing if migration 0005 failed early)
        const tableCheck = await sql`SELECT tablename FROM pg_catalog.pg_tables WHERE tablename = 'user_sessions'`;
        if (tableCheck.length === 0) {
            console.log('⚠️  user_sessions table missing! Creating...');
            await sql.unsafe(`
                CREATE TABLE IF NOT EXISTS "user_sessions" (
                    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                    "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    "refresh_token_hash" text NOT NULL,
                    "device_info" text,
                    "ip_address" inet,
                    "expires_at" timestamp with time zone NOT NULL,
                    "revoked_at" timestamp with time zone,
                    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                    "last_used_at" timestamp with time zone
                )
            `);
            console.log('   ✅ Table created.');
        } else {
            console.log('   ✅ user_sessions table exists.');
        }

    } catch (e: any) {
        console.error('❌ Repair failed:', e.message);
    } finally {
        await sql.end();
    }
}

repairSchema();
