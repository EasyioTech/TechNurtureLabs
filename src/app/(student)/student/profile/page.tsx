import React from 'react';
import { getStudentProfileData } from '@/modules/student/actions/profile-actions';
import { ProfileClient } from '@/modules/student/components/dashboard/profile-client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentProfilePage() {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    const data = await getStudentProfileData();

    const initialData = {
        profile: data.profile as any,
        stats: data.stats,
        achievements: data.achievements as any[],
        rank: data.rank,
        rankPercentage: data.rankPercentage
    };

    if (!initialData.profile) {
        redirect('/login');
    }

    return <ProfileClient initialData={initialData} />;
}
