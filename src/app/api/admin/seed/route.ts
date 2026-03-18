import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { serverEnv } from '@/lib/env.server';

export async function GET(req: NextRequest) {
    // Require CRON_SECRET header to prevent unauthorized execution
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Use the DATABASE_URL from environment — never hardcode credentials
        const dbUrl = serverEnv.DATABASE_URL;
        // max: 1 is explicitly required by postgres.js when executing massive raw SQL scripts containing BEGIN/COMMIT blocks.
        const sql = postgres(dbUrl, { max: 1 });

        // 1. Force create the application role
        await sql.unsafe(`
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'technurture_app') THEN
                CREATE ROLE technurture_app WITH LOGIN PASSWORD 'technurture_secure_pass';
              END IF;
            END
            $$;
            ALTER ROLE technurture_app CREATEDB CREATEROLE;
            GRANT ALL PRIVILEGES ON DATABASE "LMS_postgres" TO technurture_app;
            GRANT ALL ON SCHEMA public TO technurture_app;
        `);

        // 2. Explicitly grant permissions ensuring technurture_app can manage the schema
        await sql.unsafe(`
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO technurture_app;
            GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO technurture_app;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO technurture_app;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO technurture_app;
        `);

        return NextResponse.json({
            success: true,
            message: 'INFRASTRUCTURE SYNC SUCCESSFUL: Roles and permissions verified. No data was deleted.'
        });
    } catch (e: any) {
        console.error('Superuser Database Reconstruction Error:', e);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
