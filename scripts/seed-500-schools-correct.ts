/**
 * SEED SCRIPT: 500 Schools with School Admins and Students
 *
 * Architecture:
 * - 500 Schools (tenants)
 * - 500 School Admins (1 per school)
 * - 5-10 Students per school (3,750-5,000 total)
 * - Academic Sessions (1 per school)
 * - Class Mappings (3 per school)
 * - Student Enrollments (auto-mapped to class courses)
 *
 * NO TEACHERS - This system has only 3 user types:
 * 1. Super Admin (platform)
 * 2. School Admin (school management)
 * 3. Student (learner)
 */

import { db } from '@/lib/db';
import {
  schools,
  schoolAdmins,
  students,
  studentAcademicRecords,
  schoolClassMapping,
  courseClassMapping,
  enrollments,
  academicSessions,
  courses,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const SCHOOLS_COUNT = 500;
const STUDENTS_PER_SCHOOL_MIN = 5;
const STUDENTS_PER_SCHOOL_MAX = 10;
const CLASSES_TO_MAP_PER_SCHOOL = 3; // Map 3 global classes to each school
const DEFAULT_PASSWORD = 'admin123';

async function seedCorrectly() {
  console.log(
    `\n╔════════════════════════════════════════════════════════════╗`
  );
  console.log(
    `║   500 SCHOOLS SEEDING - NO TEACHERS (Correct Architecture) ║`
  );
  console.log(`║   500 Schools × 5-10 Students = 3,750-5,000 Users      ║`);
  console.log(
    `╚════════════════════════════════════════════════════════════╝\n`
  );

  try {
    // Hash password once
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Get global classes (not school-specific)
    const allClasses = await db.query.classes.findMany();
    if (allClasses.length === 0) {
      console.error(
        '❌ ERROR: No classes found. Run course seed first:'
      );
      console.error('   npm run db:seed:courses');
      process.exit(1);
    }

    // Get all published courses
    const allCourses = await db.query.courses.findMany({
      where: eq(courses.is_published, true),
    });
    if (allCourses.length === 0) {
      console.error('❌ ERROR: No courses found. Run course seed first:');
      console.error('   npm run db:seed:courses');
      process.exit(1);
    }

    console.log(
      `📚 Found ${allClasses.length} global classes and ${allCourses.length} published courses\n`
    );

    let schoolCount = 0;
    let adminCount = 0;
    let studentCount = 0;
    let enrollmentCount = 0;
    const startTime = Date.now();

    // MAIN LOOP: Create 500 schools
    for (let schoolNum = 1; schoolNum <= SCHOOLS_COUNT; schoolNum++) {
      const schoolSlug = `school-${String(schoolNum).padStart(4, '0')}`;

      // Check if school already exists
      const existing = await db.query.schools.findFirst({
        where: eq(schools.slug, schoolSlug),
      });

      if (existing) {
        if (schoolNum % 50 === 0) {
          console.log(
            `⏭️  School ${schoolNum} already exists, skipping...`
          );
        }
        continue;
      }

      // ═══════════════════════════════════════════════════════════
      // CREATE SCHOOL (Tenant)
      // ═══════════════════════════════════════════════════════════
      const [school] = await db
        .insert(schools)
        .values({
          name: `School ${schoolNum}`,
          email: `contact@school${schoolNum}.local`,
          slug: schoolSlug,
          phone: `+91-${String(9000000000 + schoolNum).slice(-10)}`,
          address: `Address ${schoolNum}, District ${(schoolNum % 28) + 1}`,
          city: `City${(schoolNum % 100) + 1}`,
          state: `State${(schoolNum % 5) + 1}`,
          country: 'India',
          pincode: `${100000 + (schoolNum % 99999)}`,
          is_active: true,
          data_processing_consent: true,
          minor_data_guardian_consent: true,
        })
        .returning();

      schoolCount++;

      // ═══════════════════════════════════════════════════════════
      // CREATE ACADEMIC SESSION (Per School)
      // ═══════════════════════════════════════════════════════════
      const [academicSession] = await db
        .insert(academicSessions)
        .values({
          school_id: school.id,
          name: '2025-2026',
          start_date: '2025-04-01',
          end_date: '2026-03-31',
          is_current: true,
        })
        .returning();

      // ═══════════════════════════════════════════════════════════
      // CREATE SCHOOL ADMIN (1 per school)
      // ═══════════════════════════════════════════════════════════
      const adminEmail = `admin@school${schoolNum}.local`;
      const [schoolAdmin] = await db
        .insert(schoolAdmins)
        .values({
          school_id: school.id,
          first_name: 'Admin',
          last_name: `School ${schoolNum}`,
          email: adminEmail,
          password_hash: hashedPassword,
          is_active: true,
        })
        .returning();

      adminCount++;

      // ═══════════════════════════════════════════════════════════
      // MAP CLASSES TO SCHOOL (3 classes per school)
      // ═══════════════════════════════════════════════════════════
      const classesToMap = allClasses.slice(0, CLASSES_TO_MAP_PER_SCHOOL);

      for (const classItem of classesToMap) {
        // Check if mapping already exists
        const existingMapping = await db.query.schoolClassMapping.findFirst({
          where: and(
            eq(schoolClassMapping.school_id, school.id),
            eq(schoolClassMapping.class_id, classItem.id)
          ),
        });

        if (!existingMapping) {
          await db.insert(schoolClassMapping).values({
            school_id: school.id,
            class_id: classItem.id,
          });
        }

        // Map courses to this class (if not already mapped)
        for (const course of allCourses) {
          const existingCourseMapping = await db.query.courseClassMapping.findFirst({
            where: and(
              eq(courseClassMapping.course_id, course.id),
              eq(courseClassMapping.class_id, classItem.id)
            ),
          });

          if (!existingCourseMapping) {
            await db.insert(courseClassMapping).values({
              course_id: course.id,
              class_id: classItem.id,
              is_active: true,
            });
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // CREATE STUDENTS (5-10 per school)
      // ═══════════════════════════════════════════════════════════
      const numStudentsForSchool =
        STUDENTS_PER_SCHOOL_MIN +
        Math.floor(
          Math.random() *
            (STUDENTS_PER_SCHOOL_MAX - STUDENTS_PER_SCHOOL_MIN + 1)
        );

      for (let studentNum = 1; studentNum <= numStudentsForSchool; studentNum++) {
        const studentEmail = `student${schoolNum}-${studentNum}@school${schoolNum}.local`;

        // Check if student exists
        const existingStudent = await db.query.students.findFirst({
          where: and(
            eq(students.school_id, school.id),
            eq(students.email, studentEmail)
          ),
        });

        if (existingStudent) {
          continue;
        }

        // Create student
        const [student] = await db
          .insert(students)
          .values({
            school_id: school.id,
            first_name: `Student`,
            last_name: `${schoolNum}-${studentNum}`,
            email: studentEmail,
            password_hash: hashedPassword,
            cumulative_xp: Math.floor(Math.random() * 10000),
            is_active: true,
            is_verified: true,
          })
          .returning();

        studentCount++;

        // Assign student to a random class (one per session)
        const randomClass =
          classesToMap[Math.floor(Math.random() * classesToMap.length)];

        await db
          .insert(studentAcademicRecords)
          .values({
            user_id: student.id,
            school_id: school.id,
            session_id: academicSession.id,
            class_id: randomClass.id,
            roll_number: `${schoolNum}-${studentNum}`,
          })
          .onConflictDoNothing();

        // Enroll student in all courses mapped to their class
        for (const course of allCourses) {
          try {
            await db
              .insert(enrollments)
              .values({
                student_id: student.id,
                course_id: course.id,
                school_id: school.id,
                session_id: academicSession.id,
                is_active: true,
              })
              .onConflictDoNothing();

            enrollmentCount++;
          } catch (e) {
            // Enrollment might already exist, skip silently
          }
        }
      }

      // Progress indicator
      if (schoolNum % 50 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (schoolNum / parseFloat(elapsed)).toFixed(1);
        console.log(
          `✅ Created ${schoolNum} schools | ${studentCount} students | ${rate} schools/sec`
        );
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Print summary
    console.log(`
╔════════════════════════════════════════════════════════════╗
║              SEEDING COMPLETE - SUMMARY                   ║
╚════════════════════════════════════════════════════════════╝

📊 CREATED:
   • Schools: ${schoolCount}
   • School Admins: ${adminCount} (1 per school)
   • Academic Sessions: ${schoolCount} (1 per school)
   • Class Mappings: ${schoolCount * CLASSES_TO_MAP_PER_SCHOOL}
   • Students: ${studentCount}
   • Student Academic Records: ${studentCount}
   • Enrollments: ${enrollmentCount}
   • Total Records: ${schoolCount + adminCount + studentCount + enrollmentCount}

⏱️  TIME TAKEN: ${duration}s

🔐 CREDENTIALS (All users):
   • Username: Email address (see examples below)
   • Password: ${DEFAULT_PASSWORD}

📧 LOGIN EXAMPLES:

   School Admin:
     • admin@school1.local / ${DEFAULT_PASSWORD}
     • admin@school500.local / ${DEFAULT_PASSWORD}

   Students:
     • student1-1@school1.local / ${DEFAULT_PASSWORD}
     • student1-5@school1.local / ${DEFAULT_PASSWORD}
     • student500-10@school500.local / ${DEFAULT_PASSWORD}

🏗️  ARCHITECTURE:
   • 3 User Types: Super Admin (platform), School Admin (per school), Student
   • NO Teachers: System designed for admin + student only
   • School Isolation: Each school is completely isolated by school_id
   • Academic Model: School → Session → Class → Students → Courses → Lessons

✅ SYSTEM READY FOR PERFORMANCE TESTING
   Run: npm run test:perf:simple  (5 min local test)
   Run: npm run test:perf         (20 min full Docker test)
`);
  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error);
    process.exit(1);
  }
}

seedCorrectly();
