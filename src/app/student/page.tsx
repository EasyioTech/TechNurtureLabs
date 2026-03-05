'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { getStudentDashboardData } from '@/modules/student/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Flame, Star, Trophy, Zap, BookOpen, Clock, Target,
  ChevronRight, Sparkles, Award,
  Play, GraduationCap, Medal, Crown, Calendar, Bell, LogOut
} from 'lucide-react';
import { StudentHeader } from '../../modules/student/components/header';
import { QuickStatCard } from '@/modules/student/components/stat-pill';
import { ChallengeCard } from '@/modules/student/components/challenge-card';
import { CourseCard } from '@/modules/student/components/course-card';
import { AchievementBadge } from '@/modules/student/components/achievement-badge';
import { Course, UserProfile, DailyChallenge, Achievement } from '@/modules/student/types';

export default function StudentDashboard() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [resetTime, setResetTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    xp: 0,
    streak: 0,
    level: 1,
    lessonsCompleted: 0,
    totalTime: 0,
    accuracy: 0,
    rank: 0
  });

  const handleLogout = async () => {
    await signOut();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getChallengeIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'book-open': BookOpen,
      'trophy': Trophy,
      'clock': Clock,
      'star': Star,
      'target': Target,
      'zap': Zap,
      'flame': Flame,
    };
    return icons[iconName] || Target;
  };

  const getChallengeColor = (type: string) => {
    const colors: Record<string, string> = {
      'lessons_completed': 'emerald',
      'quiz_score': 'amber',
      'learning_time': 'sky',
      'quiz_perfect': 'violet',
    };
    return colors[type] || 'emerald';
  };

  const calculateResetTime = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  useEffect(() => {
    setResetTime(calculateResetTime());
    const interval = setInterval(() => {
      setResetTime(calculateResetTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchUserAndCourses() {
      try {
        const data = await getStudentDashboardData();
        setCourses((data.courses || []) as Course[]);
        setUserProfile(data.profile);
        setDailyChallenges(data.dailyChallenges || []);
        setAchievements(data.achievements || []);
        setStats(data.stats);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchUserAndCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Sparkles className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const currentLevelXp = stats.xp % 1000;
  const levelProgress = (currentLevelXp / 1000) * 100;

  const filteredCourses = (courses || []).filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <StudentHeader
        profile={userProfile as any}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <section className="mb-10 sm:mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            <div className="flex-1 flex flex-col justify-center">
              <div>
                <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium mb-4 shadow-sm">
                  {getGreeting()}, {userProfile?.full_name?.split(' ')[0] || 'Student'}
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight text-slate-900 leading-tight">
                  Ready to continue<br />
                  <span className="text-indigo-600">
                    your learning path?
                  </span>
                </h2>
                <p className="text-slate-600 text-base sm:text-lg mb-8 max-w-lg">
                  You have a <span className="font-semibold text-slate-900">{stats.streak}-day streak</span>. Keep going to complete your current modules.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-auto max-w-2xl">
                <QuickStatCard icon={BookOpen} value={stats.lessonsCompleted} label="Lessons Done" />
                <QuickStatCard icon={Clock} value={`${stats.totalTime}h`} label="Time Spent" />
                <QuickStatCard icon={Target} value={`${stats.accuracy}%`} label="Accuracy" />
                <QuickStatCard icon={Medal} value={`#${stats.rank}`} label="Class Rank" />
              </div>
            </div>

            <div className="w-full lg:w-80 xl:w-96">
              <Card className="bg-white border-slate-200 shadow-sm h-full rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Current Level</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.level}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Crown size={24} />
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">Progress to Level {stats.level + 1}</span>
                      <span className="font-semibold text-indigo-600">{currentLevelXp} / 1000 XP</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-[width] duration-700 ease-out"
                        style={{ width: `${levelProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame size={14} className="text-slate-500" />
                        <span className="text-xs text-slate-500 font-medium">Best Streak</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{userProfile?.longest_streak || stats.streak} days</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Star size={14} className="text-slate-500" />
                        <span className="text-xs text-slate-500 font-medium">Total XP</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{stats.xp.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-slate-800">Recent Badges</p>
                      <Link href="/student/profile" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                      {achievements.filter(a => a.unlocked).slice(0, 4).map((badge) => (
                        <div key={badge.id} className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center flex-shrink-0" title={badge.name}>
                          <Trophy size={18} />
                        </div>
                      ))}
                      {achievements.filter(a => a.unlocked).length === 0 && (
                        <p className="text-sm text-slate-500">No badges earned yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Target className="text-slate-400" size={20} />
              Daily Challenges
            </h3>
            <span className="text-sm text-slate-500 font-medium">Resets in {resetTime}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5">
            {dailyChallenges.length > 0 ? dailyChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                title={challenge.title}
                progress={challenge.current_progress}
                total={challenge.target_value}
                reward={challenge.xp_reward}
                icon={getChallengeIcon(challenge.icon)}
                color={getChallengeColor(challenge.challenge_type)}
                unit={challenge.challenge_type === 'learning_time' ? 'm' : ''}
              />
            )) : (
              <p className="text-slate-500 text-sm col-span-3 py-4">No daily challenges available today.</p>
            )}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <BookOpen className="text-slate-400" size={20} />
              Enrolled Courses
            </h3>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-slate-100 hover:text-indigo-700 font-medium">
              View Curriculum <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
            {filteredCourses.length > 0 ? filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            )) : (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                <BookOpen size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">
                  {searchQuery ? `No courses matching "${searchQuery}"` : 'You have no active courses.'}
                </p>
                <p className="text-slate-500 text-sm mt-1">Browse the catalog to find something new.</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Award className="text-slate-400" size={20} />
              Recent Achievements
            </h3>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {achievements.length > 0 ? achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                title={achievement.name}
                description={achievement.description}
                unlocked={achievement.unlocked}
                locked={!achievement.unlocked}
              />
            )) : (
              <p className="text-slate-500 text-sm">No recent achievements.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
