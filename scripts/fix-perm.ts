import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function fix() {
    try {
        console.log("Fixing permissions for technurture_app...");
        await db.execute(sql`DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'technurture_app') THEN
                    CREATE ROLE technurture_app WITH LOGIN PASSWORD 'technurture_secure_pass';
                END IF;
            END $$;`);
        await db.execute(sql`GRANT ALL PRIVILEGES ON DATABASE orchids TO technurture_app;`);
        await db.execute(sql`GRANT ALL PRIVILEGES ON SCHEMA public TO technurture_app;`);
        await db.execute(sql`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO technurture_app;`);
        await db.execute(sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO technurture_app;`);
        await db.execute(sql`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO technurture_app;`);
        await db.execute(sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO technurture_app;`);

        console.log("Ensuring super admin user exists...");
        const passwordHash = await bcrypt.hash('admin123', 10);
        await db.execute(sql`INSERT INTO super_admins (id, email, password_hash, is_active, first_name, last_name) 
            VALUES (gen_random_uuid(), 'admin@technurture.com', ${passwordHash}, true, 'Super', 'Admin') 
            ON CONFLICT (email) DO UPDATE SET password_hash = ${passwordHash}, is_active = true`);

        console.log("Permissions and user fix complete.");
    } catch (e: any) {
        console.error("Fix Error:", e);
    }
    process.exit(0);
}

fix();
