'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/auth';
import { profiles, courses, lessons, progressTracking, dailyChallenges, userDailyChallenges, achievements, userAchievements } from '@/db/schema';
import { eq, and, gt, inArray, sql } from 'drizzle-orm';

export type DashboardData = {
    profile: any;
    stats: { xp: number; streak: number; level: number; lessonsCompleted: number; totalTime: number; rank: number; };
    dailyChallenges: any[];
    achievements: any[];
    courses: any[];
};

export async function getStudentDashboardData(): Promise<DashboardData> {
    throw new Error("Not implemented");
}
// I will rewrite the entire content of student-actions.ts so it contains everything 
