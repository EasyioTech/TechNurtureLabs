/**
 * CLEAN SEED SCRIPT
 * Seeds: Classes, Super Admin, Payment Plans, and Platform Settings.
 * Safe to run multiple times.
 */
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

async function seed() {
    console.log('🚀 Starting Comprehensive Seed...');

    // 1. Classes (1-12)
    console.log('   - Seeding Classes...');
    for (let i = 1; i <= 12; i++) {
        await sql`
            INSERT INTO classes (name, level)
            VALUES (${`Class ${i}`}, ${i})
            ON CONFLICT (name) DO NOTHING
        `;
    }

    // 2. Payment Plans
    console.log('   - Seeding Payment Plans...');
    await sql`
        INSERT INTO payment_plans (name, description, billing_cycle, price, max_students, features, is_active, is_popular)
        VALUES 
            ('Basic Education', 'Foundation for primary classes.', 'annual', 999, 50, ${JSON.stringify({ lms: true, analytics: false })}, true, false),
            ('Pro Academy', 'Advanced tools for the whole school.', 'annual', 4999, 500, ${JSON.stringify({ lms: true, analytics: true, priority_support: true })}, true, true)
        ON CONFLICT (name) DO NOTHING
    `;

    // 3. Platform Settings
    console.log('   - Seeding Platform Settings...');
    await sql`
        INSERT INTO platform_settings (id, platform_name, support_email, currency_default)
        VALUES ('global', 'TechNurture Labs', 'support@technurture.io', 'INR')
        ON CONFLICT (id) DO NOTHING
    `;

    // 4. Default Super Admin
    // Password: AdminPassword123!
    console.log('   - Seeding Super Admin...');
    await sql`
        INSERT INTO super_admins (id, first_name, last_name, email, password_hash, is_active)
        VALUES (
            gen_random_uuid(),
            'Super',
            'Admin',
            'admin@technurture.com',
            '$2b$10$Sk9UyIVPSe2I5lf9.R7QO.3O2TKys2Rly4Z2LbyTvn1sTde8mDtlu',
            TRUE
        ) ON CONFLICT (email) DO NOTHING
    `;

    console.log('✅ Seeding Complete.');
    await sql.end();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
