import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        // Use raw postgres connection as the built-in superuser 'postgres' from docker-compose.yml
        // max: 1 is explicitly required by postgres.js when executing massive raw SQL scripts containing BEGIN/COMMIT blocks.
        const sql = postgres('postgresql://postgres:admin@db:5432/orchids', { max: 1 });

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
            GRANT ALL PRIVILEGES ON DATABASE orchids TO technurture_app;
            GRANT ALL ON SCHEMA public TO technurture_app;
        `);

        // 2. Locate and Read the actual Database Schema
        const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
        const schemaText = fs.readFileSync(schemaPath, 'utf8');

        // 3. Force completely drop and recreate the Database architecture as superuser
        // Terminate other sessions to prevent "tuple concurrently updated" errors during DROP SCHEMA
        await sql.unsafe(`
            SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
            WHERE datname = 'orchids' AND pid <> pg_backend_pid();
            DROP SCHEMA IF EXISTS public CASCADE;
            CREATE SCHEMA public;
        `);

        // 4. Inject 100% of the Production Models & the built-in Seed
        await sql.unsafe(schemaText);

        // 5. Explicitly grant permissions again just to be 100% safe
        await sql.unsafe(`
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO technurture_app;
            GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO technurture_app;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO technurture_app;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO technurture_app;
        `);

        return NextResponse.json({
            success: true,
            message: 'SUPERUSER INITIALIZATION SUCCESSFUL: Database rebuilt from scratch, Role Created, Permissions Granted, and Seeded flawlessly.'
        });
    } catch (e: any) {
        console.error('Superuser Database Reconstruction Error:', e);
        return NextResponse.json({ success: false, error: e.message, stack: e.stack }, { status: 500 });
    }
}
