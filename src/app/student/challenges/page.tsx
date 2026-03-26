import React from 'react';
import { getStudentProfileAndStats } from '@/modules/student/actions';
import { getOrGenerateDailyChallenges } from '@/modules/student/actions/challenge-actions';
import { ChallengesClient } from '@/modules/student/components/dashboard/challenges-client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ChallengesPage() {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    const [data, dailyChallenges] = await Promise.all([
        getStudentProfileAndStats(),
        getOrGenerateDailyChallenges(session.userId),
    ]);

    return (
        <ChallengesClient
            initialData={{
                dailyChallenges,
                stats: data.stats,
            }}
        />
    );
}
