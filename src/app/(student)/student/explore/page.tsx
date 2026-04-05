import React from 'react';
import { getStudentDashboardCourses } from '@/modules/student/actions';
import { ExploreClient } from '@/modules/student/components/dashboard/explore-client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    const data = await getStudentDashboardCourses();

    const initialData = {
        courses: data.courses as any[],
        categories: data.categories as any[],
        topics: data.topics as string[]
    };

    return <ExploreClient initialData={initialData} />;
}
