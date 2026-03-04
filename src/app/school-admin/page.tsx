'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { SchoolDashboard } from '@/modules/school-admin/components/school-dashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SchoolAdminPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const authUser = user as any;

  useEffect(() => {
    if (authUser && authUser.role !== 'school_admin') {
      router.replace('/');
    }
  }, [authUser, router]);

  if (!authUser?.school_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080c14]">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-lime-400/10 flex items-center justify-center mx-auto animate-pulse">
            <div className="w-3 h-3 bg-lime-400 rounded-full" />
          </div>
          <p className="text-[12px] font-black uppercase tracking-widest text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <SchoolDashboard
      schoolId={authUser.school_id}
      schoolName={authUser.school_name || authUser.first_name ? `${authUser.first_name}'s School` : undefined}
      onSignOut={signOut}
    />
  );
}
