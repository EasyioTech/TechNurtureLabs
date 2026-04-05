import React from 'react';
import { requireAnySchoolAdmin } from '@/lib/admin-guard';
import { SchoolThemeProvider } from '@/modules/school-admin/theme-context';
import { SchoolDataProvider } from '@/modules/school-admin/providers/school-data-provider';
import { SchoolDashboardLayout } from '@/modules/school-admin/components/dashboard-layout';

export default async function SchoolAdminLayout({ children }: { children: React.ReactNode }) {

    // SECURITY HARDENING: Use the centralized admin guard.
    // This automatically verifies the session, role, and active status.
    const { admin } = await requireAnySchoolAdmin();

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
