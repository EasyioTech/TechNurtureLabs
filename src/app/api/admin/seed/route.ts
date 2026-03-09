import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        // Use raw postgres connection as the built-in superuser 'postgres' from docker-compose.yml
        // max: 1 is explicitly required by postgres.js when executing massive raw SQL scripts containing BEGIN/COMMIT blocks.
        const sql = postgres('postgresql://postgres:admin@db:5432/LMS_postgres', { max: 1 });

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

        // 2. Locate and Read the actual Database Schema
        const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
        const schemaText = fs.readFileSync(schemaPath, 'utf8');

        // 3. SAFE INITIALIZATION ONLY
        // We NO LONGER drop the schema here. Drizzle handles migrations safely.
        // This endpoint is now for idempotent infrastructure setup (Roles & Permissions).
        console.log("Starting idempotent infrastructure setup...");

        // 4. (Optional) Run migrations/push if needed, but we do this in CI/CD now.
        // We will just ensure the role and database settings are correct.

        // 5. Explicitly grant permissions ensuring technurture_app can manage the schema
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
