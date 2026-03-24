import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import React from 'react';
import { SchoolThemeProvider } from '@/modules/school-admin/theme-context';
import { SchoolDataProvider } from '@/modules/school-admin/providers/school-data-provider';
import { SchoolDashboardLayout } from '@/modules/school-admin/components/dashboard-layout';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { schoolAdmins } from '@/db/schema';

export default async function SchoolAdminLayout({ children }: { children: React.ReactNode }) {
    const session = await verifySession();

    if (!session || session.role !== 'school_admin') {
        redirect('/school-portal/login');
    }

    // Fetch school admin info to get correct schoolId and name
    const admin = await db.query.schoolAdmins.findFirst({
        where: eq(schoolAdmins.id, session.userId),
        with: { school: true } as any
    });

    if (!admin || !admin.school_id) {
        redirect('/school-portal/login');
    }

    const schoolName = (admin as any).school?.name || 'Institution';

    return (
        <SchoolThemeProvider>
            <SchoolDataProvider schoolId={admin.school_id}>
                <SchoolDashboardLayout 
                    schoolId={admin.school_id} 
                    schoolName={schoolName}
                >
                    {children}
                </SchoolDashboardLayout>
            </SchoolDataProvider>
        </SchoolThemeProvider>
    );
}
