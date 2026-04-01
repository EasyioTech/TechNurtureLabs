import { db } from '@/lib/db';
import { schools, students, studentAcademicRecords, schoolClassMapping, courseClassMapping, courses, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const SCHOOLS_COUNT = 100;
const CLASSES_PER_SCHOOL = 3;
const DEFAULT_PASSWORD = 'Student123!';

async function seedScale() {
    console.log('🚀 Starting Scale Seed (100 Schools, ~781 Students)...\n');

    try {
        // Hash the default password
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

        // Get all classes and courses
        const allClasses = await db.query.classes.findMany();
        const allCourses = await db.query.courses.findMany({
            where: eq(courses.is_published, true)
        });

        // Get current session
        const sessionList = await db.query.sessions.findMany();
        const currentSession = sessionList.length > 0 ? sessionList[0] : null;

        if (!currentSession) {
            console.error('❌ No academic session found. Please create one first.');
            process.exit(1);
        }

        if (allClasses.length === 0) {
            console.error('❌ No classes found. Run base seed first.');
            process.exit(1);
        }

        if (allCourses.length === 0) {
            console.error('❌ No courses found. Run course seed first.');
            process.exit(1);
        }

        console.log(`📚 Found ${allClasses.length} classes and ${allCourses.length} courses\n`);

        let schoolCount = 0;
        let studentCount = 0;
        const startTime = Date.now();

        // Create 100 schools
        for (let i = 1; i <= SCHOOLS_COUNT; i++) {
            const schoolSlug = `school-${i}`.toLowerCase();

            // Check if school exists
            const existing = await db.query.schools.findFirst({
                where: eq(schools.slug, schoolSlug)
            });

            if (existing) {
                console.log(`⏭️  School ${i} already exists, skipping...`);
                continue;
            }

            const [school] = await db.insert(schools).values({
                name: `School ${i}`,
                email: `admin@school${i}.com`,
                slug: schoolSlug,
                phone: `+91-${String(9000000000 + i).slice(-10)}`,
                address: `Address ${i}, City`,
                city: `City${i % 10}`,
                state: `State${i % 5}`,
                country: 'India',
                pincode: `${100000 + i}`,
                is_active: true,
            }).returning();

            schoolCount++;

            // Create class mappings for this school
            const classesToMap = allClasses.slice(0, CLASSES_PER_SCHOOL);
            for (const cls of classesToMap) {
                await db.insert(schoolClassMapping).values({
                    school_id: school.id,
                    class_id: cls.id,
                }).onConflictDoNothing();

                // Map courses to classes
                for (const course of allCourses) {
                    await db.insert(courseClassMapping).values({
                        course_id: course.id,
                        class_id: cls.id,
                    }).onConflictDoNothing();
                }
            }

            // Create students for this school (average ~7.81 per school = 781 total)
            const numStudentsForSchool = i <= 79 ? 8 : 7;

            for (let s = 1; s <= numStudentsForSchool; s++) {
                const studentEmail = `student${schoolCount}-${s}@school${i}.com`;

                const [student] = await db.insert(students).values({
                    first_name: `Student`,
                    last_name: `${schoolCount}-${s}`,
                    email: studentEmail,
                    school_id: school.id,
                    password_hash: hashedPassword,
                    cumulative_xp: Math.floor(Math.random() * 5000),
                }).returning();

                studentCount++;

                // Assign to a random class
                const randomClass = classesToMap[Math.floor(Math.random() * classesToMap.length)];
                await db.insert(studentAcademicRecords).values({
                    user_id: student.id,
                    school_id: school.id,
                    session_id: currentSession.id,
                    class_id: randomClass.id,
                }).onConflictDoNothing();
            }

            if (i % 10 === 0) {
                console.log(`✅ Created ${i} schools with ${studentCount} students so far...`);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`
─────────────────────────────────────────────────────────
✅ Scale Seed Complete!

📊 Summary:
   • Schools Created: ${schoolCount}
   • Students Created: ${studentCount}
   • Classes Mapped: ${schoolCount * CLASSES_PER_SCHOOL}
   • Courses Mapped: ${schoolCount * CLASSES_PER_SCHOOL * allCourses.length}
   • Time Taken: ${duration}s
─────────────────────────────────────────────────────────
`);

    } catch (error) {
        console.error('❌ Scale seed error:', error);
        process.exit(1);
    }
}

seedScale();
