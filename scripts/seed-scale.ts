/**
 * PRODUCTION-SCALE SEED SCRIPT
 * Seeds: 100 Schools, each with 1 Admin and 5-10 Students.
 * Total Users: ~600-1100
 * Use cases: Load testing, production-ready data mirroring.
 */
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 10 });

// Shared Passwords for testing
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('Admin123!', 10);
const STUDENT_PIN_HASH = bcrypt.hashSync('123456', 10);

async function seedScale() {
    console.log('🚀 Starting Production-Scale Seed (100 Schools)...');

    // 1. Core Platform Data (Plans & Settings)
    console.log('   - Seeding Platform Essentials...');
    
    // Classes
    for (let i = 1; i <= 12; i++) {
        const className = 'Class ' + i;
        await sql`INSERT INTO classes (name, level) VALUES (${className}, ${i}) ON CONFLICT DO NOTHING`;
    }
    const classRows = await sql`SELECT id FROM classes ORDER BY level ASC`;
    const classIds = classRows.map(r => r.id);

    // Plans
    await sql`
        INSERT INTO payment_plans (name, description, billing_cycle, price, max_students, features, is_active, is_popular)
        VALUES 
            ('Starter LMS', 'Basic learning management for up to 100 students.', 'annual', 9999, 100, ${JSON.stringify({ lms: true, analytics: false, support: false })}, true, false),
            ('Standard Scholar', 'Advanced features for growing schools.', 'annual', 24999, 500, ${JSON.stringify({ lms: true, analytics: true, support: true })}, true, true),
            ('Elite Institutional', 'Full platform features with unlimited students.', 'annual', 49999, NULL, ${JSON.stringify({ lms: true, analytics: true, priority_support: true, custom_branding: true })}, true, false)
        ON CONFLICT DO NOTHING
    `;
    const planRows = await sql`SELECT id FROM payment_plans`;
    const planIds = planRows.map(r => r.id);

    await sql`
        INSERT INTO platform_settings (id, platform_name, support_email, currency_default)
        VALUES ('global', 'TechNurture Labs', 'support@technurture.io', 'INR')
        ON CONFLICT DO NOTHING
    `;

    // Super Admin
    await sql`
        INSERT INTO super_admins (first_name, last_name, email, password_hash, is_active)
        VALUES ('Super', 'Admin', 'admin@technurture.com', ${bcrypt.hashSync('AdminPassword123!', 10)}, true)
        ON CONFLICT (email) DO NOTHING
    `;

    // 2. Schools Loop
    console.log(`   - Generating 100 Schools...`);
    
    const schoolCount = 100;
    for (let i = 1; i <= schoolCount; i++) {
        const schoolId = uuidv4();
        const schoolName = `TechNurture Academy ${i}`;
        const slug = `school-${i}`;
        const email = `contact@school${i}.com`;

        // Create School
        await sql`
            INSERT INTO schools (id, name, slug, email, country, is_active)
            VALUES (${schoolId}, ${schoolName}, ${slug}, ${email}, 'IN', true)
        `;

        // Add Academic Session
        const sessionId = uuidv4();
        await sql`
            INSERT INTO academic_sessions (id, school_id, name, start_date, end_date, is_current)
            VALUES (${sessionId}, ${schoolId}, 'Session 2025-26', '2025-04-01', '2026-03-31', true)
        `;

        // Map Classes to School
        for (const cid of classIds) {
            await sql`INSERT INTO school_class_mapping (school_id, class_id) VALUES (${schoolId}, ${cid})`;
        }

        // Add Active Subscription
        const planId = planIds[Math.floor(Math.random() * planIds.length)];
        await sql`
            INSERT INTO school_subscriptions (school_id, plan_id, status, current_period_start, current_period_end)
            VALUES (${schoolId}, ${planId}, 'active', NOW(), NOW() + INTERVAL '1 year')
        `;

        const schoolAdminLastName = 'Admin ' + i;
        const schoolAdminEmail = 'admin@school' + i + '.com';
        await sql`
            INSERT INTO school_admins (school_id, first_name, last_name, email, password_hash)
            VALUES (${schoolId}, 'Principal', ${schoolAdminLastName}, ${schoolAdminEmail}, ${ADMIN_PASSWORD_HASH})
        `;

        // Add Students (5-10 per school)
        const studentCount = Math.floor(Math.random() * 6) + 5;
        for (let j = 1; j <= studentCount; j++) {
            const studentId = uuidv4();
            const studentEmail = `student${j}@school${i}.com`;
            
            const studentLastName = j + ' (School ' + i + ')';
            await sql`
                INSERT INTO students (id, school_id, first_name, last_name, email, password_hash, is_active)
                VALUES (${studentId}, ${schoolId}, 'Student', ${studentLastName}, ${studentEmail}, ${STUDENT_PIN_HASH}, true)
            `;

            // Assign to a random class (1-12)
            const randomClassId = classIds[Math.floor(Math.random() * classIds.length)];
            const rollNumber = j.toString();
            await sql`
                INSERT INTO student_academic_records (user_id, school_id, session_id, class_id, roll_number)
                VALUES (${studentId}, ${schoolId}, ${sessionId}, ${randomClassId}, ${rollNumber})
            `;
        }

        if (i % 10 === 0) console.log(`     ✅ Processed ${i} schools...`);
    }

    console.log('✅ Production-Scale Seeding Complete!');
    console.log('--------------------------------------------------');
    console.log('Super Admin: admin@technurture.com / AdminPassword123!');
    console.log('School Admins: admin@school[1-100].com / Admin123!');
    console.log('Student PINS: student[1-10]@school[1-100].com / 123456');
    console.log('--------------------------------------------------');
    
    await sql.end();
}

seedScale().catch(err => {
    console.error('❌ Scale seed failed:', err);
    process.exit(1);
});
`,Description:
