import React from 'react';
import { getCourseDetailsData } from '@/modules/student/actions';
import { CourseDetailsClient } from '@/modules/student/components/course/course-details-client';
import { verifySession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';

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
            notFound();
        }

        initialData = {
            course: data.course,
            lessons: data.lessons || [],
            enrolledCount: data.enrolledCount || 0
        };
    } catch (error) {
        console.error('Failed to fetch course details:', error);
        notFound();
    }

    return <CourseDetailsClient initialData={initialData} />;
}

