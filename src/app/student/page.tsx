'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { getStudentDashboardData } from '@/modules/student/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Flame, Star, Trophy, Zap, BookOpen, Clock, Target,
  ChevronRight, Sparkles, Award,
  Play, GraduationCap, Medal, Crown, Calendar, Bell,
  User, Search, ArrowRight, Activity, LogOut, Settings
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { StudentHeader } from '../../modules/student/components/header';
import { QuickStatCard } from '@/modules/student/components/stat-pill';
import { ChallengeCard } from '@/modules/student/components/challenge-card';
import { CourseCard } from '@/modules/student/components/course-card';
import { Course, UserProfile, DailyChallenge, Achievement } from '@/modules/student/types';

export default function StudentDashboard() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<any>(null);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [resetTime, setResetTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    xp: 0,
    streak: 0,
    level: 1,
    lessonsCompleted: 0,
    totalTime: 0,
    accuracy: 0,
    rank: 0
  });

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
        setSchool(data.school);
        setDailyChallenges(data.dailyChallenges || []);
        setAchievements(data.achievements || []);
        setActivities(data.activities || []);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-8">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap size={40} className="text-slate-900" />
          </div>
        </div>
      </div>
    );
  }

  const currentLevelXp = stats.xp % 1000;
  const levelProgress = Math.min(100, (currentLevelXp / 1000) * 100);
  const lastCourse = courses[0];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Mobile Header Overlay */}
      <div className="lg:hidden">
        <StudentHeader
          profile={userProfile as any}
          school={school}
          stats={stats}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* Top Desktop Bar */}
        <div className="hidden lg:flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
              {getGreeting()}, <span className="text-indigo-600">{userProfile?.full_name?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {userProfile?.className || 'Class Not Set'} • Academic Year {new Date().getFullYear()}-{String(new Date().getFullYear() + 1).slice(2)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search for courses..."
                className="bg-white border border-slate-100 pl-12 pr-6 py-3 rounded-2xl w-80 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-sans"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                <Bell size={20} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(v => !v)}
                  className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all outline-none"
                >
                  <User size={20} />
                </button>
                <AnimatePresence>
                  {profileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setProfileMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 p-2 space-y-1"
                      >
                        <div className="px-3 py-2 mb-1 border-b border-slate-50 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {userProfile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{userProfile?.full_name}</p>
                            <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-widest mt-0.5">Student</p>
                          </div>
                        </div>
                        <Link href="/student/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold">
                          <User size={16} /> My Profile
                        </Link>
                        <Link href="/student/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold">
                          <Settings size={16} /> Settings
                        </Link>
                        <div className="pt-1 pb-1">
                          <div className="w-full h-px bg-slate-100" />
                        </div>
                        <button onClick={() => { setProfileMenuOpen(false); signOut(); }} className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors text-sm font-bold border-t border-slate-50/0">
                          <LogOut size={16} /> Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8 space-y-12">

            {/* Quick Resume Hero - Indigo Themed */}
            {lastCourse && (
              <section className="relative overflow-hidden rounded-[3rem] bg-indigo-600 p-10 text-white shadow-xl shadow-indigo-200 group">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div>
                    <Badge className="bg-white/20 text-white border-0 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-6">Continue Learning</Badge>
                    <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-4">{lastCourse.title}</h2>
                    <div className="flex items-center gap-6 mb-8 text-[10px] font-black text-white/60 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><BookOpen size={14} /> {lastCourse.totalLessons} Lessons</span>
                      <span className="flex items-center gap-2"><Clock size={14} /> {Math.ceil((lastCourse.totalLessons || 0) * 0.4)}h Total Est.</span>
                    </div>
                    <Link href={`/student/course/${lastCourse.id}`}>
                      <Button className="h-14 px-10 rounded-2xl bg-white text-indigo-600 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-black/5">
                        Resume Course <ArrowRight size={16} className="ml-3" />
                      </Button>
                    </Link>
                  </div>

                  <div className="relative w-32 h-32 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-white/10" />
                      <circle
                        cx="64" cy="64" r="56"
                        stroke="currentColor" strokeWidth="12" fill="none"
                        strokeDasharray={`${(lastCourse.completedLessons / (lastCourse.totalLessons || 1)) * 351.8} 351.8`}
                        className="text-white"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black">{Math.round((lastCourse.completedLessons / (lastCourse.totalLessons || 1)) * 100)}%</span>
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-widest mt-1">Sync</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Performance Snapshot */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <QuickStatCard icon={BookOpen} value={stats.lessonsCompleted} label="Finished Lessons" />
              <QuickStatCard icon={Clock} value={`${stats.totalTime}h`} label="Total Learning" />
              <QuickStatCard icon={Target} value={`${stats.accuracy}%`} label="Average Score" />
              <QuickStatCard icon={Medal} value={`#${stats.rank}`} label="My Rank" />
            </div>

            {/* Daily Challenges */}
            <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Daily Challenges</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Next reset in: {resetTime}</p>
                </div>
                <Link href="/student/challenges">
                  <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                    All Challenges <ChevronRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(dailyChallenges || []).slice(0, 3).map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    title={challenge.title}
                    progress={challenge.current_progress}
                    total={challenge.target_value}
                    reward={challenge.xp_reward}
                    icon={getChallengeIcon(challenge.icon)}
                    color="bg-slate-900"
                    unit={challenge.challenge_type === 'learning_time' ? 'm' : ''}
                  />
                ))}
              </div>
            </section>

            {/* Active Courses */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">My Active Courses</h3>
                <Link href="/student/courses">
                  <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                    View All <ChevronRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {courses.length > 0 ? (
                  courses.slice(0, 4).map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))
                ) : (
                  <div className="md:col-span-2 py-12 px-6 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
                      <BookOpen size={32} />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 uppercase">No courses found</h4>
                    <p className="text-sm text-slate-400 font-medium mt-2 max-w-sm">
                      We couldn't find any courses assigned to your class yet. Check back soon or contact your school administrator!
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="xl:col-span-4 space-y-10">
            {/* Level Persistence */}
            <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 border border-white/5">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">My Progress</p>
                    <p className="text-4xl font-black tracking-tighter">Level {stats.level}</p>
                  </div>
                  <div className="w-16 h-16 rounded-[1.75rem] bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 ring-1 ring-white/10">
                    <Crown size={32} className="text-indigo-500" />
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="flex items-end justify-between">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">XP PROGRESS</p>
                    <p className="text-xs font-black text-indigo-500">{Math.round(levelProgress)}%</p>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 flex border border-white/10">
                    <div
                      className="h-full bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Yields</p>
                    <p className="text-xl font-black text-white">{stats.xp.toLocaleString()}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Streak</p>
                    <div className="flex items-center gap-2 text-orange-500">
                      <Flame size={18} fill="currentColor" />
                      <p className="text-xl font-black text-white">{stats.streak}D</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Preview */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">My Badges</h4>
                <Link href="/student/achievements" className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">View All</Link>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                {(achievements || []).filter(a => a.unlocked).slice(0, 4).map((achievement) => (
                  <div key={achievement.id} className="aspect-square rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center p-6 hover:border-amber-200 transition-all cursor-pointer overflow-hidden group/badge">
                    <Trophy size={28} className="text-amber-500 group-hover/badge:scale-110 transition-transform" />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 overflow-hidden relative shadow-sm">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-10">Recent Activity</h4>
              <div className="space-y-8">
                {activities.length > 0 ? activities.map((activity) => (
                  <ActivitySummaryItem
                    key={activity.id}
                    icon={getActivityIcon(activity.type)}
                    title={activity.title}
                    time={new Date(activity.time).toLocaleDateString()}
                  />
                )) : (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No recent activity found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getActivityIcon(type: string) {
  const icons: Record<string, any> = {
    'login': User,
    'lesson_complete': BookOpen,
    'challenge_complete': Trophy,
    'enroll': Sparkles
  };
  return icons[type] || Activity;
}

function ActivitySummaryItem({ icon: Icon, title, time }: any) {
  return (
    <div className="flex items-center gap-5">
      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-1">{title}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{time}</p>
      </div>
    </div>
  );
}
