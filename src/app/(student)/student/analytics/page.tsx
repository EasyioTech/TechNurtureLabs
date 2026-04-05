import React from 'react';
import { getStudentDailyAnalytics } from '@/modules/student/actions/analytics-actions';
import { AnalyticsClient } from '@/modules/student/components/dashboard/analytics-client';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const session = await verifySession();
    if (!session || session.userType !== 'student') {
        redirect('/login');
    }

    const data = await getStudentDailyAnalytics();

    return <AnalyticsClient initialData={data} />;
}
