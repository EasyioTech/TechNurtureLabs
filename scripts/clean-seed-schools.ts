/**
 * CLEAN & SEED SCHOOLS SCRIPT
 */
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

async function cleanAndSeed() {
    console.log('🧹 Starting Database Cleanup...');

    try {
        await sql.begin(async (tx) => {
            console.log('   - Clearing existing data...');
            await tx`DELETE FROM platform_metrics_daily`;
            await tx`DELETE FROM school_metrics_daily`;
            await tx`DELETE FROM course_metrics_daily`;
            await tx`DELETE FROM audit_logs`;
            await tx`DELETE FROM xp_events`;
            await tx`DELETE FROM user_achievements`;
            await tx`DELETE FROM user_certificates`;
            await tx`DELETE FROM quiz_attempt_answers`;
            await tx`DELETE FROM quiz_attempts`;
            await tx`DELETE FROM lesson_submissions`;
            await tx`DELETE FROM lesson_sessions`;
            await tx`DELETE FROM lesson_progress`;
            await tx`DELETE FROM course_progress`;
            await tx`DELETE FROM enrollments`;
            await tx`DELETE FROM student_academic_records`;
            await tx`DELETE FROM pin_reset_requests`;
            await tx`DELETE FROM user_daily_challenges`;
            await tx`DELETE FROM user_sessions`;
            await tx`DELETE FROM login_attempts`;
            await tx`DELETE FROM students`;
            await tx`DELETE FROM payment_transactions`;
            await tx`DELETE FROM invoices`;
            await tx`DELETE FROM academic_sessions`;
            await tx`DELETE FROM school_admins`;
            await tx`DELETE FROM school_subscriptions`;
            await tx`DELETE FROM school_class_mapping`;
            await tx`DELETE FROM schools`;
            
            console.log('✅ Cleanup Complete.');

            const plans = await tx`SELECT id FROM payment_plans WHERE name = 'Scale Pro' LIMIT 1`;
            const plan = plans[0];
            if (!plan) {
                throw new Error('Required payment plan "Scale Pro" not found. Run npm run db:seed first.');
            }

            const classes_results = await tx`SELECT id FROM classes WHERE name = 'Class 1' LIMIT 1`;
            const defaultClass = classes_results[0];
            if (!defaultClass) {
                throw new Error('Default class "Class 1" not found. Run npm run db:seed first.');
            }

            const passwordHash = await bcrypt.hash('Password123!', 10);

            console.log('🚀 Seeding 10 Schools...');

            for (let i = 1; i <= 10; i++) {
                const schoolName = `School ${i}`;
                const schoolSlug = `school${i}`;
                const schoolEmail = `admin@school${i}.com`;

                const schools = await tx`
                    INSERT INTO schools (name, slug, email, country, is_active)
                    VALUES (${schoolName}, ${schoolSlug}, ${schoolEmail}, 'IN', TRUE)
                    RETURNING id
                `;
                const school = schools[0];

                await tx`
                    INSERT INTO school_admins (school_id, first_name, last_name, email, password_hash, is_active)
                    VALUES (${school.id}, 'Admin', ${schoolName}, ${schoolEmail}, ${passwordHash}, TRUE)
                `;

                await tx`
                    INSERT INTO school_subscriptions (school_id, plan_id, status, current_period_start, current_period_end)
                    VALUES (${school.id}, ${plan.id}, 'active', NOW(), NOW() + INTERVAL '1 year')
                `;

                // Academic Session
                const sessions = await tx`
                    INSERT INTO academic_sessions (school_id, name, start_date, end_date, is_current)
                    VALUES (${school.id}, '2024-25', '2024-04-01', '2025-03-31', TRUE)
                    RETURNING id
                `;
                const session = sessions[0];

                const classes = await tx`SELECT id FROM classes WHERE level <= 5`;
                for (const c of classes) {
                    await tx`INSERT INTO school_class_mapping (school_id, class_id) VALUES (${school.id}, ${c.id})`;
                }

                const studentCount = Math.floor(Math.random() * 3) + 3;
                for (let j = 1; j <= studentCount; j++) {
                    const studentEmail = `student${j}@school${i}.com`;
                    const students = await tx`
                        INSERT INTO students (school_id, first_name, last_name, email, password_hash, is_active)
                        VALUES (${school.id}, 'Student', ${j.toString()}, ${studentEmail}, ${passwordHash}, TRUE)
                        RETURNING id
                    `;
                    const student = students[0];

                    // Academic Record (linking to class and session)
                    await tx`
                        INSERT INTO student_academic_records (user_id, school_id, session_id, class_id)
                        VALUES (${student.id}, ${school.id}, ${session.id}, ${defaultClass.id})
                    `;
                }

                console.log(`   ✅ ${schoolName} created with ${studentCount} students.`);
            }
        });

        console.log('\n✨ Seeding successful!');
        console.log('-----------------------------------');
        console.log('Credentials for all:');
        console.log('Password:  Password123!');
        console.log('Admins:    admin@school1.com ... admin@school10.com');
        console.log('Students:  student1@school1.com ...');
        console.log('-----------------------------------');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await sql.end();
    }
}

cleanAndSeed();
