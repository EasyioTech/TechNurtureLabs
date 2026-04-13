import React from 'react';
import { 
  getStudentProfileAndStats, 
  getStudentDashboardCourses, 
  getStudentAchievementsAction, 
  getStudentActivitiesAction 
} from '@/modules/student/actions';
import { getOrGenerateDailyChallenges } from '@/modules/student/actions/challenge-actions';
import { getPlatformSettings } from '@/components/landing/actions';
import { ClientDashboard } from '@/modules/student/components/dashboard/client-dashboard';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const session = await verifySession();
  if (!session || session.userType !== 'student') {
    redirect('/login');
  }

  // Fetch all data in parallel with individual error handling
  // Never throw — always return fallback data instead
  const [
    statsData,
    coursesData,
    achievements,
    activities,
    platformSettings,
    challenges
  ] = await Promise.all([
    getStudentProfileAndStats().catch((e) => {
      console.error('[Dashboard] getStudentProfileAndStats error:', e?.message || e);
      return null;
    }),
    getStudentDashboardCourses().catch((e) => {
      console.error('[Dashboard] getStudentDashboardCourses error:', e?.message || e);
      return { courses: [] };
    }),
    getStudentAchievementsAction().catch((e) => {
      console.error('[Dashboard] getStudentAchievementsAction error:', e?.message || e);
      return { achievements: [] };
    }),
    getStudentActivitiesAction().catch((e) => {
      console.error('[Dashboard] getStudentActivitiesAction error:', e?.message || e);
      return [];
    }),
    getPlatformSettings().catch((e) => {
      console.error('[Dashboard] getPlatformSettings error:', e?.message || e);
      return null;
    }),
    getOrGenerateDailyChallenges(session.userId).catch((e) => {
      console.error('[Dashboard] getOrGenerateDailyChallenges error:', e?.message || e);
      return [];
    })
  ]);

  // If profile fetch failed completely, redirect to login
  if (!statsData) {
    redirect('/login');
  }

  const initialData = {
    profile: statsData.profile,
    stats: statsData.stats,
    school: statsData.school,
    courses: coursesData?.courses || [],
    achievements: ((achievements as any)?.achievements ?? achievements ?? []) as any[],
    activities: (activities as any[]) || [],
    challenges: (challenges as any[]) || [],
    platformSettings
  };

  if (!initialData.profile) {
    redirect('/login');
  }

  return <ClientDashboard initialData={{ ...initialData, profile: initialData.profile! } as any} />;
}
