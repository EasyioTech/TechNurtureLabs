import 'dotenv/config';
import { db } from '../src/lib/db';
import { schools, classes, schoolClassMapping, academicSessions } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function seedTestSchool() {
    console.log('Seeding Test School...');

    // Check if classes exist, if not seed them
    let allBaseClasses = await db.query.classes.findMany();
    if (!allBaseClasses.length) {
        console.log('No base classes found. Seeding default Classes 1-12...');
        const baseClasses = Array.from({ length: 12 }, (_, i) => ({
            id: crypto.randomUUID(),
            name: `Class ${i + 1}`,
            level: i + 1
        }));
        await db.insert(classes).values(baseClasses as any);
        allBaseClasses = await db.query.classes.findMany();
    }

    // 1. Insert School
    const [testSchool] = await db.insert(schools).values({
        id: crypto.randomUUID(),
        name: 'TechNurture Academy',
        slug: 'technurture-academy',
        email: 'academy@technurture.com',
        phone: '1234567890',
        city: 'Metropolis',
        state: 'Delhi',
        is_active: true,
    } as any).returning();

    console.log(`- Created school: ${testSchool.name} (${testSchool.id})`);

    // 2. Create Academic Session
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    await db.insert(academicSessions).values({
        id: crypto.randomUUID(),
        name: `Session ${startDate.getFullYear()}-${startDate.getFullYear() + 1}`,
        school_id: testSchool.id,
        is_current: true,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
    } as any);

    console.log(`- Created academic session.`);

    // 3. Map Classes 1-12
    const mappings = allBaseClasses.map(cls => ({
        school_id: testSchool.id,
        class_id: cls.id,
        is_active: true
    }));
    await db.insert(schoolClassMapping).values(mappings as any);

    console.log(`- Mapped ${allBaseClasses.length} classes to the school.`);
    console.log('\nSeed complete! You can now select "TechNurture Academy" and see classes 1-12 in the student registration dropdown.');
    process.exit(0);
}

seedTestSchool().catch(err => {
    console.error(err);
    process.exit(1);
});
