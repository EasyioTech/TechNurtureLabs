import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
    const session = await verifySession();

    if (!session || session.role !== 'school_admin') {
        redirect('/school-portal/login');
    }

    return <>{children}</>;
}
