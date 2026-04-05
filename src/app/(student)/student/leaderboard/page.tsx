import React from 'react';
import { getStudentLeaderboard } from '@/modules/student/actions/leaderboard-actions';
import { LeaderboardClient } from '@/modules/student/components/dashboard/leaderboard-client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    const data = await getStudentLeaderboard('school');

    return <LeaderboardClient initialData={data} />;
}
