import { db } from '@/lib/db';
import {
  schools,
  students,
  studentAcademicRecords,
  schoolClassMapping,
  courseClassMapping,
  courses,
  academicSessions,
  schoolAdmins,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const SCHOOLS_COUNT = 500;
const STUDENTS_PER_SCHOOL_MIN = 5;
const STUDENTS_PER_SCHOOL_MAX = 10;
const CLASSES_PER_SCHOOL = 3;
const DEFAULT_PASSWORD = 'admin123'; // Universal password for all users

async function seed500Schools() {
  console.log(
    '🚀 Starting 500 Schools Seeding (500 schools, 3,750-5,000 students)...\n'
  );

  try {
    // Hash the default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Get all classes and courses
    const allClasses = await db.query.classes.findMany();
    const allCourses = await db.query.courses.findMany({
      where: eq(courses.is_published, true),
    });

    // Get or create current session
    let sessionList = await db.query.academicSessions.findMany();
    let currentSession = sessionList.length > 0 ? sessionList[0] : null;

    if (!currentSession) {
      console.log('📅 Creating academic session 2025-2026...');
      const [newSession] = await db
        .insert(academicSessions)
        .values({
          name: '2025-2026',
          start_date: '2025-04-01',
          end_date: '2026-03-31',
          is_current: true,
        })
        .returning();
      currentSession = newSession;
    }

    if (allClasses.length === 0) {
      console.error('❌ No classes found. Run base seed first.');
      process.exit(1);
    }

    if (allCourses.length === 0) {
      console.error('❌ No courses found. Run course seed first.');
      process.exit(1);
    }

    console.log(
      `📚 Found ${allClasses.length} classes and ${allCourses.length} courses\n`
    );

    let schoolCount = 0;
    let studentCount = 0;
    let adminCount = 0;
    const startTime = Date.now();
    const schoolIds: string[] = [];

    // Create 500 schools
    for (let i = 1; i <= SCHOOLS_COUNT; i++) {
      const schoolSlug = `school-${String(i).padStart(4, '0')}`.toLowerCase();

      // Check if school exists
      const existing = await db.query.schools.findFirst({
        where: eq(schools.slug, schoolSlug),
      });

      if (existing) {
        schoolIds.push(existing.id);
        if (i % 50 === 0) {
          console.log(
            `⏭️  School ${i} already exists, skipping... (reusing ID)`
          );
        }
        continue;
      }

      // Create school
      const [school] = await db
        .insert(schools)
        .values({
          name: `School ${i}`,
          email: `admin@school${i}.local`,
          slug: schoolSlug,
          phone: `+91-${String(9000000000 + i).slice(-10)}`,
          address: `Address ${i}, District ${(i % 10) + 1}`,
          city: `City${(i % 100) + 1}`,
          state: `State${(i % 5) + 1}`,
          country: 'India',
          pincode: `${100000 + (i % 99999)}`,
          is_active: true,
        })
        .returning();

      schoolCount++;
      schoolIds.push(school.id);

      // Create school admin for this school
      const adminEmail = `admin@school${i}.local`;
      const [admin] = await db
        .insert(schoolAdmins)
        .values({
          school_id: school.id,
          email: adminEmail,
          password_hash: hashedPassword,
          first_name: 'Admin',
          last_name: `School${i}`,
          is_active: true,
        })
        .returning();
      adminCount++;

      // Create class mappings for this school
      const classesToMap = allClasses.slice(0, CLASSES_PER_SCHOOL);
      for (const cls of classesToMap) {
        await db
          .insert(schoolClassMapping)
          .values({
            school_id: school.id,
            class_id: cls.id,
          })
          .onConflictDoNothing();

        // Map courses to classes
        for (const course of allCourses) {
          await db
            .insert(courseClassMapping)
            .values({
              course_id: course.id,
              class_id: cls.id,
            })
            .onConflictDoNothing();
        }
      }

      // Create 5-10 students for this school
      const numStudentsForSchool =
        STUDENTS_PER_SCHOOL_MIN +
        Math.floor(
          Math.random() *
            (STUDENTS_PER_SCHOOL_MAX - STUDENTS_PER_SCHOOL_MIN + 1)
        );

      for (let s = 1; s <= numStudentsForSchool; s++) {
        const studentEmail = `student${i}-${s}@school${i}.local`;

        const [student] = await db
          .insert(students)
          .values({
            first_name: `Student`,
            last_name: `${i}-${s}`,
            email: studentEmail,
            school_id: school.id,
            password_hash: hashedPassword,
            cumulative_xp: Math.floor(Math.random() * 10000),
            is_active: true,
          })
          .returning();

        studentCount++;

        // Assign to a random class
        const randomClass =
          classesToMap[Math.floor(Math.random() * classesToMap.length)];
        await db
          .insert(studentAcademicRecords)
          .values({
            user_id: student.id,
            school_id: school.id,
            session_id: currentSession.id,
            class_id: randomClass.id,
          })
          .onConflictDoNothing();
      }

      // Progress indicator
      if (i % 50 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (i / parseFloat(elapsed)).toFixed(1);
        console.log(
          `✅ Created ${i} schools with ${studentCount} students (${rate} schools/sec)...`
        );
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                  500 SCHOOLS SEED COMPLETE                ║
╚════════════════════════════════════════════════════════════╝

📊 Summary:
   • Schools Created: ${schoolCount}
   • School Admins Created: ${adminCount}
   • Students Created: ${studentCount}
   • Avg Students per School: ${(studentCount / schoolCount).toFixed(1)}
   • Classes Mapped: ${schoolCount * CLASSES_PER_SCHOOL}
   • Courses Mapped: ${schoolCount * CLASSES_PER_SCHOOL * allCourses.length}
   • Time Taken: ${duration}s

🔐 Credentials (Same for ALL users):
   • Username: School email or student email
   • Password: ${DEFAULT_PASSWORD}

📧 Access Examples:
   School Admin:  admin@school1.local / ${DEFAULT_PASSWORD}
   Student:       student1-1@school1.local / ${DEFAULT_PASSWORD}

✅ System ready for performance testing with 500 schools!
`);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed500Schools();
