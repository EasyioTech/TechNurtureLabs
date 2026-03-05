// Quick migration script — runs media_assets table creation
// Usage: node scripts/migrate-media-assets.mjs

import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5433/orchids',
});

await client.connect();
console.log('Connected to database.');

// 1. Create enums (safe — skips if already exist)
await client.query(`
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'storage_type') THEN
            CREATE TYPE storage_type AS ENUM ('r2', 'local');
            RAISE NOTICE 'Created enum: storage_type';
        ELSE
            RAISE NOTICE 'Enum storage_type already exists, skipping.';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
            CREATE TYPE asset_type AS ENUM ('video', 'image', 'document');
            RAISE NOTICE 'Created enum: asset_type';
        ELSE
            RAISE NOTICE 'Enum asset_type already exists, skipping.';
        END IF;
    END$$;
`);

// 2. Create table (idempotent)
await client.query(`
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

// 3. Create indexes (idempotent)
await client.query(`CREATE INDEX IF NOT EXISTS idx_media_asset_type ON media_assets (asset_type);`);
await client.query(`CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media_assets (uploaded_by);`);
await client.query(`CREATE INDEX IF NOT EXISTS idx_media_created ON media_assets (created_at);`);

const { rows } = await client.query(`SELECT COUNT(*) as n FROM media_assets;`);
console.log(`✅ media_assets table ready. Current rows: ${rows[0].n}`);

await client.end();
