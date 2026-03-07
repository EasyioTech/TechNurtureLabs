import 'dotenv/config';
import { db } from '../src/lib/db';
import { schools, classes, schoolClassMapping } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function fixClassMappings() {
    console.log('Fetching all schools...');
    const allSchools = await db.query.schools.findMany();
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
        console.log(`Seeded ${allBaseClasses.length} base classes.`);
    }

    console.log(`Found ${allSchools.length} schools and ${allBaseClasses.length} base classes.`);

    for (const school of allSchools) {
        console.log(`Checking mappings for: ${school.name}`);

        // Skip if already has mappings
        const existing = await db.query.schoolClassMapping.findFirst({
            where: eq(schoolClassMapping.school_id, school.id)
        });

        if (!existing) {
            console.log(`- Adding default mappings (Classes 1-12) to ${school.name}...`);
            const mappings = allBaseClasses.map(cls => ({
                school_id: school.id,
                class_id: cls.id,
                is_active: true
            }));
            await db.insert(schoolClassMapping).values(mappings as any);
        } else {
            console.log(`- ${school.name} already has classes assigned.`);
        }
    }

    console.log('Fix complete!');
    process.exit(0);
}

fixClassMappings().catch(err => {
    console.error(err);
    process.exit(1);
});
