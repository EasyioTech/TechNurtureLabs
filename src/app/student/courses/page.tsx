import React from 'react';
import { getStudentDashboardCourses } from '@/modules/student/actions';
import { CoursesClient } from '@/modules/student/components/dashboard/courses-client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MyCoursesPage() {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    const data = await getStudentDashboardCourses();

    const initialData = {
        courses: data.courses as any[]
    };

    return <CoursesClient initialData={initialData} />;
}
