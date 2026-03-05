import { db } from './src/lib/db';
import { users, enrollments, courseGradeMapping, studentAcademicRecords, courses } from './src/db/schema';
import { eq, or } from 'drizzle-orm';

async function run() {
    const students = await db.query.users.findMany({
        where: eq(users.role, 'student'),
        limit: 1
    });

    if (students.length === 0) {
        console.log("No student found");
        return;
    }
    const student = students[0];
    console.log("Student:", student.email);

    const currentRecord = await db.query.studentAcademicRecords.findFirst({
        where: eq(studentAcademicRecords.user_id, student.id)
    });
    console.log("Record:", currentRecord);

    const allCourses = await db.query.courses.findMany();
    console.log("All courses:", allCourses.map(c => ({ id: c.id, title: c.title, is_published: c.is_published, all_grades: c.all_grades, grade: c.grade })));

    const courseMappings = await db.query.courseGradeMapping.findMany();
    console.log("All course grade mappings:", courseMappings);

    let gradeMappedCourses: any[] = [];
    if (currentRecord?.grade_id) {
        const mappings = await db.query.courseGradeMapping.findMany({
            where: eq(courseGradeMapping.grade_id, currentRecord.grade_id),
            with: { course: true }
        });
        gradeMappedCourses = mappings.map(m => m.course).filter(c => c && c.is_published === true);
        console.log("gradeMappedCourses:", gradeMappedCourses);
    }

    // what if it's "all_grades"
    const allGradesCourses = await db.query.courses.findMany({
        where: eq(courses.all_grades, true)
    });
    console.log("allGradesCourses:", allGradesCourses);
}

run().catch(console.error).then(() => process.exit(0));
