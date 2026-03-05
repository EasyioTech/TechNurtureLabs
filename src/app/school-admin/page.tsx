'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { SchoolDashboard } from '@/modules/school-admin/components/school-dashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SchoolAdminPage() {
  const { profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Once loading is done, if no profile or wrong role → redirect
    if (!loading && (!profile || profile.role !== 'school_admin')) {
      router.replace('/school-portal/login');
    }
  }, [profile, loading, router]);

  // Show loading spinner while auth is being resolved
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080c14]">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto animate-pulse">
            <div className="w-3 h-3 bg-indigo-500 rounded-full" />
          </div>
          <p className="text-[12px] font-black uppercase tracking-widest text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (profile.role !== 'school_admin') return null;

  return (
    <SchoolDashboard
      schoolId={profile.school_id!}
      schoolName={profile.full_name ? `${profile.full_name}'s School` : 'My School'}
      onSignOut={signOut}
    />
  );
}
