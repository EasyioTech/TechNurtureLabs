import React from 'react';
import { getStudentProfileAndStats } from '@/modules/student/actions';
import { SettingsClient } from '@/modules/student/components/dashboard/settings-client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentSettingsPage() {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    const data = await getStudentProfileAndStats();

    return <SettingsClient initialData={data} />;
}
