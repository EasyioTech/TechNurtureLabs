import React from 'react';
import { getStudentAchievementsData } from '@/modules/student/actions/achievement-actions';
import { AchievementsClient } from '@/modules/student/components/dashboard/achievements-client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    const data = await getStudentAchievementsData();

    return <AchievementsClient initialData={data} />;
}
