import React from 'react';
import { getLessonData, getCourseDetailsData, completeLessonAndReward } from '@/modules/student/actions';
import { LessonClient } from '@/modules/student/components/lesson/lesson-client';
import DatabaseMaintenance from '@/components/shared/DatabaseMaintenance';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LessonPlayerPage({ params }: { params: Promise<{ lessonId: string }> }) {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    const { lessonId } = await params;

    try {
        const lesson = await getLessonData(lessonId);
        if (!lesson) {
            // Show friendly empty state instead of 404
            return <DatabaseMaintenance />;
        }

        const courseData = await getCourseDetailsData(lesson.course_id);

        const initialData = {
            lesson: lesson as any,
            courseData,
            lessonComplete: !!lesson.user_progress?.completed_at
        };

        const completeLessonAction = async () => {
          'use server';
          return await completeLessonAndReward(lessonId);
        };

        return <LessonClient initialData={initialData} completeLesson={completeLessonAction} />;
    } catch (error) {
        console.error('Failed to load lesson context:', error);
        // Show friendly empty state instead of 404
        return <DatabaseMaintenance />;
    }
}
