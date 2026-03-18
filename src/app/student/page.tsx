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

  // Fetch all data in parallel on the server
  const [
    statsData,
    coursesData,
    achievements,
    activities,
    platformSettings,
    challenges
  ] = await Promise.all([
    getStudentProfileAndStats(),
    getStudentDashboardCourses(),
    getStudentAchievementsAction(),
    getStudentActivitiesAction(),
    getPlatformSettings(),
    getOrGenerateDailyChallenges(session.userId)
  ]);

  const initialData = {
    profile: statsData.profile,
    stats: statsData.stats,
    school: statsData.school,
    courses: coursesData.courses as any[],
    achievements: achievements as any[],
    activities: activities as any[],
    challenges: challenges as any[],
    platformSettings
  };

  if (!initialData.profile) {
    redirect('/login');
  }

  return <ClientDashboard initialData={initialData} />;
}
