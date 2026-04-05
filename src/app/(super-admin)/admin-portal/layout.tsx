import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import React from 'react';

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const session = await verifySession();

    return <>{children}</>;
}
