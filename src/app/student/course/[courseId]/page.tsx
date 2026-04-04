import React from 'react';
import { getCourseDetailsData, getCertificateForCourse } from '@/modules/student/actions';
import { CourseDetailsClient } from '@/modules/student/components/course/course-details-client';
import DatabaseMaintenance from '@/components/DatabaseMaintenance';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    const { courseId } = await params;

    let initialData;
    try {
        const data = await getCourseDetailsData(courseId);

        if (!data || !data.course) {
            // Show friendly empty state instead of 404
            return <DatabaseMaintenance />;
        }

        // Fetch certificate if student has completed the course
        const certificate = await getCertificateForCourse(courseId);

        initialData = {
            course: data.course,
            lessons: data.lessons || [],
            enrolledCount: data.enrolledCount || 0,
            certificate: certificate || null
        };
    } catch (error) {
        console.error('Failed to fetch course details:', error);
        // Show friendly empty state instead of 404
        return <DatabaseMaintenance />;
    }

    return <CourseDetailsClient initialData={initialData} />;
}

