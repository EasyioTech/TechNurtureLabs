'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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
import { StatPill, QuickStatCard } from '@/modules/student/components/stat-pill';
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
  const [stats, setStats] = useState({
    xp: 0,
    streak: 0,
    level: 1,
    lessonsCompleted: 0,
    totalTime: 0,
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
        setCourses(data.courses);
        setUserProfile(data.profile);
        setDailyChallenges(data.dailyChallenges);
        setAchievements(data.achievements);
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-8 h-8 text-sky-500" />
        </motion.div>
      </div>
    );
  }

  const currentLevelXp = stats.xp % 1000;
  const levelProgress = (currentLevelXp / 1000) * 100;

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-sky-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl" />
      </div>

      <header className="relative z-50 border-b border-stone-200 bg-white/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-200">
                <GraduationCap className="text-white" size={20} />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-black text-xl text-slate-800">EduQuest</h1>
                <p className="text-sm text-slate-500">Student Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="hidden md:flex items-center gap-2">
                <StatPill icon={Flame} value={stats.streak} label="Streak" color="orange" pulse />
                <StatPill icon={Star} value={stats.xp.toLocaleString()} label="XP" color="amber" />
                <StatPill icon={Crown} value={stats.level} label="Level" color="sky" />
              </div>

              <div className="flex md:hidden items-center gap-1">
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-orange-100 text-orange-600">
                  <Flame size={14} fill="currentColor" />
                  <span className="font-bold text-xs">{stats.streak}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-100 text-amber-600">
                  <Star size={14} fill="currentColor" />
                  <span className="font-bold text-xs">{stats.level}</span>
                </div>
              </div>

              <button className="relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white hover:bg-stone-50 border border-stone-200 transition-colors shadow-sm">
                <Bell size={16} className="text-slate-500 sm:w-[18px] sm:h-[18px]" />
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white hover:bg-stone-50 border border-stone-200 transition-colors shadow-sm"
                title="Logout"
              >
                <LogOut size={16} className="text-slate-500 sm:w-[18px] sm:h-[18px]" />
              </button>

              <Link href="/student/profile" className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-sky-500 flex items-center justify-center font-bold text-xs sm:text-sm text-white shadow-lg shadow-sky-200 hover:scale-105 transition-transform cursor-pointer">
                {userProfile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            <div className="flex-1 flex flex-col">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-700 text-sm font-semibold mb-4 shadow-sm">
                  <Sparkles size={14} className="text-amber-500" />
                  {getGreeting()}, {userProfile?.full_name?.split(' ')[0] || 'Student'}!
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight text-slate-800">
                  Ready to conquer<br />
                  <span className="text-sky-500">
                    new challenges?
                  </span>
                </h2>
                <p className="text-slate-500 text-base sm:text-lg mb-6 max-w-lg">
                  You&apos;re on a <span className="font-bold text-orange-500">{stats.streak}-day streak</span>! Keep up the momentum and unlock your next achievement.
                </p>
              </motion.div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <QuickStatCard
                  icon={BookOpen}
                  value={stats.lessonsCompleted}
                  label="Lessons Done"
                  gradient="from-emerald-400 to-teal-500"
                  bgColor="bg-emerald-50"
                />
                <QuickStatCard
                  icon={Clock}
                  value={`${stats.totalTime}h`}
                  label="Learning Time"
                  gradient="from-sky-400 to-blue-500"
                  bgColor="bg-sky-50"
                />
                <QuickStatCard
                  icon={Target}
                  value="85%"
                  label="Accuracy"
                  gradient="from-violet-400 to-purple-500"
                  bgColor="bg-violet-50"
                />
                <QuickStatCard
                  icon={Medal}
                  value={`#${stats.rank}`}
                  label="Class Rank"
                  gradient="from-amber-400 to-orange-500"
                  bgColor="bg-amber-50"
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full lg:w-72 xl:w-80"
            >
              <Card className="bg-white border-stone-200 shadow-sm overflow-hidden h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">Current Level</p>
                      <p className="text-3xl sm:text-4xl font-black text-slate-800">{stats.level}</p>
                    </div>
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-200">
                        <Crown size={22} className="text-white sm:w-[26px] sm:h-[26px]" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-md"
                      >
                        <Sparkles size={10} className="text-white" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500">Progress to Level {stats.level + 1}</span>
                      <span className="font-bold text-sky-600">{currentLevelXp} / 1000 XP</span>
                    </div>
                    <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-sky-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <Flame size={14} className="text-emerald-500" />
                        <span className="text-[10px] text-slate-500">Best Streak</span>
                      </div>
                      <p className="text-lg font-bold text-slate-800 mt-0.5">{userProfile?.longest_streak || stats.streak} days</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-violet-500" />
                        <span className="text-[10px] text-slate-500">Total XP</span>
                      </div>
                      <p className="text-lg font-bold text-slate-800 mt-0.5">{stats.xp.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-400 flex items-center justify-center shadow-md">
                      <Zap className="text-white" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-700">Next reward</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate">Premium Badge</p>
                    </div>
                    <Award className="text-amber-500 flex-shrink-0" size={22} />
                  </div>

                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-700">My Badges</p>
                      <Link href="/student/profile" className="text-[10px] text-sky-500 hover:text-sky-600 font-medium">View all</Link>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                      {achievements.filter(a => a.unlocked).slice(0, 4).map((badge) => (
                        <div key={badge.id} className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center" title={badge.name}>
                          <Trophy size={16} className="text-amber-600" />
                        </div>
                      ))}
                      {achievements.filter(a => a.unlocked).length === 0 && (
                        <>
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center opacity-40">
                            <Trophy size={16} className="text-slate-400" />
                          </div>
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center opacity-40">
                            <Medal size={16} className="text-slate-400" />
                          </div>
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center opacity-40">
                            <Award size={16} className="text-slate-400" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center shadow-md">
                <Target className="text-white" size={16} />
              </div>
              Daily Challenges
            </h3>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-slate-600 text-sm">
              <Calendar size={14} />
              <span>Resets in {resetTime}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {dailyChallenges.length > 0 ? dailyChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                title={challenge.title}
                progress={challenge.current_progress}
                total={challenge.target_value}
                reward={challenge.xp_reward}
                icon={getChallengeIcon(challenge.icon)}
                color={getChallengeColor(challenge.challenge_type)}
                unit={challenge.challenge_type === 'learning_time' ? 'min' : ''}
              />
            )) : (
              <>
                <ChallengeCard
                  title="Complete 2 Lessons"
                  progress={0}
                  total={2}
                  reward={150}
                  icon={BookOpen}
                  color="emerald"
                />
                <ChallengeCard
                  title="Score 80%+ on Quiz"
                  progress={0}
                  total={1}
                  reward={200}
                  icon={Trophy}
                  color="amber"
                />
                <ChallengeCard
                  title="Study for 30 Minutes"
                  progress={0}
                  total={30}
                  reward={100}
                  icon={Clock}
                  color="sky"
                  unit="min"
                />
              </>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center shadow-md">
                <GraduationCap className="text-white" size={16} />
              </div>
              Your Courses
            </h3>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-sky-600 hover:bg-sky-50">
              View All <ChevronRight size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-md">
                <Award className="text-white" size={16} />
              </div>
              Recent Achievements
            </h3>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
            {achievements.length > 0 ? achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                title={achievement.name}
                description={achievement.description}
                unlocked={achievement.unlocked}
                locked={!achievement.unlocked}
              />
            )) : (
              <>
                <AchievementBadge title="First Steps" description="Complete your first lesson" locked />
                <AchievementBadge title="Week Warrior" description="7-day streak" locked />
                <AchievementBadge title="Quiz Master" description="Score 100% on a quiz" locked />
                <AchievementBadge title="Night Owl" description="Study after midnight" locked />
                <AchievementBadge title="Perfectionist" description="Complete a course with 100%" locked />
              </>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
}


