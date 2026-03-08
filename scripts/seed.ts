import 'dotenv/config';
import { db } from '../src/lib/db';
import {
    schools, classes, schoolClassMapping, academicSessions,
    paymentPlans, platformSettings, achievements
} from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('🚀 Starting Seeding Process...');

    // 1. Seed Global Classes (1-12)
    console.log('\n--- 1. Seeding Global Classes ---');
    const existingClasses = await db.query.classes.findMany();
    if (existingClasses.length === 0) {
        const clsData = Array.from({ length: 12 }, (_, i) => ({
            name: `Class ${i + 1}`,
            level: i + 1,
        }));
        await db.insert(classes).values(clsData as any);
        console.log('✅ Classes 1-12 created.');
    } else {
        console.log('⏭️ Classes already exist. Skipping.');
    }

    // 2. Seed Platform Settings
    console.log('\n--- 2. Seeding Platform Settings ---');
    const existingSettings = await db.query.platformSettings.findFirst({
        where: eq(platformSettings.id, 'global')
    });
    if (!existingSettings) {
        await db.insert(platformSettings).values({
            id: 'global',
            platform_name: 'TechNurture Labs',
            support_email: 'support@technurture.io',
            currency_default: 'INR'
        } as any);
        console.log('✅ Global platform settings initialized.');
    } else {
        console.log('⏭️ Platform settings exist. Skipping.');
    }

    // 3. Seed Payment Plans
    console.log('\n--- 3. Seeding Payment Plans ---');
    const existingPlans = await db.query.paymentPlans.findMany();
    if (existingPlans.length === 0) {
        await db.insert(paymentPlans).values([
            {
                name: 'Basic Education',
                description: 'Foundation for primary classes.',
                price: '999',
                billing_cycle: 'annual',
                max_students: 50,
                is_active: true,
                features: { lms: true, analytics: false }
            },
            {
                name: 'Pro Academy',
                description: 'Advanced tools for the whole school.',
                price: '4999',
                billing_cycle: 'annual',
                max_students: 500,
                is_active: true,
                is_popular: true,
                features: { lms: true, analytics: true, priority_support: true }
            }
        ] as any);
        console.log('✅ Payment plans seeded.');
    } else {
        console.log('⏭️ Payment plans exist. Skipping.');
    }

    // 4. Seed Achievements
    console.log('\n--- 4. Seeding Achievements ---');
    try {
        const { seedAchievementsData } = await import('../src/modules/student/actions/achievement-actions');
        await seedAchievementsData();
        console.log('✅ Achievements seeded.');
    } catch (e) {
        console.warn('⚠️ Could not seed achievements via action. Skipping or doing manual fallback.');
    }

    // 5. Seed a Test School
    console.log('\n--- 5. Seeding Test School ---');
    const existingSchool = await db.query.schools.findFirst({
        where: eq(schools.slug, 'technurture-academy')
    });

    if (!existingSchool) {
        const [testSchool] = await db.insert(schools).values({
            name: 'TechNurture Academy',
            slug: 'technurture-academy',
            email: 'academy@technurture.com',
            city: 'New Delhi',
            state: 'Delhi',
            is_active: true,
        } as any).returning();

        // Create Session
        const start = new Date();
        const end = new Date();
        end.setFullYear(start.getFullYear() + 1);

        await db.insert(academicSessions).values({
            name: `Academic Year ${start.getFullYear()}-${end.getFullYear()}`,
            school_id: testSchool.id,
            is_current: true,
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0]
        } as any);

        // Map all classes to this school
        const allCls = await db.query.classes.findMany();
        await db.insert(schoolClassMapping).values(
            allCls.map(c => ({
                school_id: testSchool.id,
                class_id: c.id,
                is_active: true
            })) as any
        );

        console.log('✅ Test School "TechNurture Academy" fully set up.');
    } else {
        console.log('⏭️ Test School already exists. Skipping.');
    }

    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
}

main().catch(err => {
    console.error('\n❌ Seeding failed:', err);
    process.exit(1);
});
