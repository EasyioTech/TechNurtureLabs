/**
 * CLEAN SEED SCRIPT
 * Seeds: Classes, Super Admin, Payment Plans, and Platform Settings.
 * Safe to run multiple times — uses ON CONFLICT DO NOTHING everywhere.
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
    // ON CONFLICT DO NOTHING (no column target) works regardless of whether the
    // unique constraint is a table constraint or a unique index.
    console.log('   - Seeding Classes...');
    for (let i = 1; i <= 12; i++) {
        await sql`
            INSERT INTO classes (name, level)
            VALUES (${`Class ${i}`}, ${i})
            ON CONFLICT DO NOTHING
        `;
    }

    // 2. Payment Plans
    console.log('   - Seeding Payment Plans (Updated Tiers)...');
    
    const plans = [
        {
            name: 'Launchpad',
            description: 'Perfect for small coaching centers and independent educators starting their digital journey.',
            billing_cycle: 'annual',
            price: 5999,
            max_students: 50,
            features: [
                'Mobile-First Student Dashboard',
                'Basic Course Builder (Unlimited Lessons)',
                'Automated XP & Level Progression',
                'Student Progress Reports',
                'Standard Email Support'
            ],
            is_active: true,
            is_popular: false
        },
        {
            name: 'Scale Pro',
            description: 'The complete toolkit for established schools requiring deeper student engagement and analytics.',
            billing_cycle: 'annual',
            price: 19999,
            max_students: 300,
            features: [
                'Everything in Launchpad',
                'Advanced Performance Analytics',
                'School-Wide Leaderboards',
                'Parent Monitoring Dashboard',
                'Custom Domain Integration',
                'Priority Slack Support'
            ],
            is_active: true,
            is_popular: true
        },
        {
            name: 'Enterprise Apex',
            description: 'Fully white-labeled infrastructure for large institutions with total platform control.',
            billing_cycle: 'annual',
            price: 49999,
            max_students: null,
            features: [
                'Everything in Scale Pro',
                'White-Label Mobile Experience',
                'Custom Branding & Themes',
                'Unlimited Student Seats',
                'Multi-School Management',
                'Dedicated Success Manager'
            ],
            is_active: true,
            is_popular: false
        }
    ];

    for (const plan of plans) {
        await sql`
            INSERT INTO payment_plans (name, description, billing_cycle, price, max_students, features, is_active, is_popular)
            VALUES (${plan.name}, ${plan.description}, ${plan.billing_cycle}, ${plan.price}, ${plan.max_students}, ${JSON.stringify(plan.features)}, ${plan.is_active}, ${plan.is_popular})
            ON CONFLICT (name) WHERE deleted_at IS NULL DO UPDATE SET
                description = EXCLUDED.description,
                price = EXCLUDED.price,
                max_students = EXCLUDED.max_students,
                features = EXCLUDED.features,
                is_popular = EXCLUDED.is_popular,
                updated_at = NOW()
        `;
    }

    // 3. Platform Settings
    console.log('   - Seeding Platform Settings...');
    await sql`
        INSERT INTO platform_settings (id, platform_name, support_email, currency_default)
        VALUES ('global', 'TechNurture Labs', 'support@technurture.io', 'INR')
        ON CONFLICT DO NOTHING
    `;

    // 4. Default Super Admin
    // Password: AdminPassword123!
    console.log('   - Seeding Super Admin...');
    const result = await sql`
        INSERT INTO super_admins (id, first_name, last_name, email, password_hash, is_active)
        VALUES (
            gen_random_uuid(),
            'Super',
            'Admin',
            'admin@technurture.com',
            '$2b$10$Sk9UyIVPSe2I5lf9.R7QO.3O2TKys2Rly4Z2LbyTvn1sTde8mDtlu',
            TRUE
        ) ON CONFLICT DO NOTHING
    `;

    if (result.count === 0) {
        console.log('   ⚠️  Super admin already exists — skipped.');
        console.log('      Run database/reset-admin.sql on the DB to force-reset credentials.');
    } else {
        console.log('   ✅ Super admin created.');
        console.log('      Email:    admin@technurture.com');
        console.log('      Password: AdminPassword123!');
        console.log('      ⚠️  Change this password immediately after first login!');
    }

    console.log('✅ Seeding Complete.');
    await sql.end();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
