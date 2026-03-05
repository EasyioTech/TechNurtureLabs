// Migration: run with: npx tsx scripts/migrate-media-assets.ts
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
    console.log('Running media_assets migration...');

    // 1. Enums (idempotent)
    await sql.unsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'storage_type') THEN
                CREATE TYPE storage_type AS ENUM ('r2', 'local');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
                CREATE TYPE asset_type AS ENUM ('video', 'image', 'document');
            END IF;
        END$$;
    `);
    console.log('✓ Enums OK');

    // 2. Table
    await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS media_assets (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            file_name       TEXT NOT NULL,
            original_name   TEXT NOT NULL,
            file_url        TEXT NOT NULL,
            file_path       TEXT NOT NULL,
            mime_type       TEXT NOT NULL,
            file_size       BIGINT NOT NULL DEFAULT 0,
            storage_type    storage_type NOT NULL DEFAULT 'local',
            asset_type      asset_type NOT NULL DEFAULT 'document',
            uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `);
    console.log('✓ Table OK');

    // 3. Indexes
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_media_asset_type  ON media_assets (asset_type);`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media_assets (uploaded_by);`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_media_created      ON media_assets (created_at);`);
    console.log('✓ Indexes OK');

    const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM media_assets`;
    console.log(`✅ Migration complete — media_assets rows: ${n}`);

    await sql.end();
}

migrate().catch((e) => {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
});
