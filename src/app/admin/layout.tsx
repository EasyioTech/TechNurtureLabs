import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import React from 'react';
import { AdminThemeProvider } from '@/modules/super-admin/theme-context';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await verifySession();

    if (!session || session.role !== 'super_admin') {
        redirect('/admin-portal/login');
    }

    return <AdminThemeProvider>{children}</AdminThemeProvider>;
}
