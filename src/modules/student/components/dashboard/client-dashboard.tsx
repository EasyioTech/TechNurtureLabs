'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Flame, Star, Trophy, Zap, BookOpen, Clock, Target,
  ChevronRight, Award, Crown, Activity, Settings, User, ArrowRight, Medal, Wand2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { StudentHeader } from '../header';
import { QuickStatCard } from '../stat-pill';
import { ChallengeItem } from '../challenge-item';
import { CourseCard } from '../course-card';
import { AchievementBadge } from '../achievement-badge';
import { Course, UserProfile, DailyChallenge, Achievement } from '../../types';

interface ClientDashboardProps {
  initialData: {
    profile: UserProfile;
    stats: any;
    school: any;
    courses: Course[];
    achievements: Achievement[];
    activities: any[];
    challenges: DailyChallenge[];
    platformSettings: any;
  }
}

function calcResetTime(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function ClientDashboard({ initialData }: ClientDashboardProps) {
  const { profile, stats, school, courses, achievements, activities, challenges, platformSettings } = initialData;
  const [resetTime, setResetTime] = useState('');

  if (!profile) return null;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    setResetTime(calcResetTime());
    const interval = setInterval(() => setResetTime(calcResetTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  const levelProgress = Math.min(100, ((stats.xp % 1000) / 1000) * 100);
  const lastCourse = courses[0];

  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setBarWidth(levelProgress));
    return () => cancelAnimationFrame(raf);
  }, [levelProgress]);

  const mobileCircumference = 439.8; 
  const desktopCircumference = 452.3;
  const courseProgress = lastCourse
    ? lastCourse.completedLessons / (lastCourse.totalLessons || 1)
    : 0;

  const [mobileOffset, setMobileOffset] = useState(mobileCircumference);
  const [desktopOffset, setDesktopOffset] = useState(desktopCircumference);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMobileOffset(mobileCircumference - mobileCircumference * courseProgress);
      setDesktopOffset(desktopCircumference - desktopCircumference * courseProgress);
    });
    return () => cancelAnimationFrame(raf);
  }, [courseProgress]);

  return (
    <div className="min-h-screen bg-slate-50/20 pb-10 lg:pb-10">
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-10">

        {/* Welcome Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
              {greeting}, <span className="text-indigo-600">{profile.full_name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-3 flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              {profile.className || 'Assigned Class'} • Session {new Date().getFullYear()} Active
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Portal Status</p>
              <Badge className="bg-slate-900 text-white border-0 px-4 py-1.5 rounded-full text-xs font-semibold shadow-xl">Session Active</Badge>
            </div>
          </div>
        </div>

        {/* Mobile-Only Greeting: High Priority */}
        <div className="lg:hidden mb-6 pt-2">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">
              {greeting}, <span className="text-indigo-600">{profile.full_name.split(' ')[0]}</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Ready to crushed it today?</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 lg:gap-8">
          {/* Main content - reordered for mobile priority: Active Learning -> Analytics -> Progress */}
          <div className="xl:col-span-8 space-y-6 lg:space-y-10 order-1 lg:order-none">

            {/* 1. Active Learning Hero (Resume) */}
            {lastCourse && (
              <section className="group">
                <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-indigo-950 p-5 sm:p-7 lg:p-10 text-white shadow-xl shadow-indigo-950/20 border border-white/5">
                  <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 sm:gap-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-6 sm:mb-10 lg:hidden">
                        <Badge className="bg-indigo-600 text-white border-0 px-3 py-1 rounded-full text-[10px] font-bold shadow-lg shadow-indigo-600/30">
                          {lastCourse.completedLessons === lastCourse.totalLessons ? 'Finished' : 'In Progress'}
                        </Badge>

                        {/* Mobile circle */}
                        <div className="relative w-14 h-14 flex-shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="20" fill="none" className="text-white/5" />
                            <circle
                              cx="80" cy="80" r="70"
                              stroke="currentColor" strokeWidth="20" fill="none"
                              strokeDasharray={mobileCircumference}
                              strokeDashoffset={mobileOffset}
                              strokeLinecap="round"
                              className="text-indigo-400"
                              style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-black">{Math.round(courseProgress * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden lg:block mb-6">
                        <Badge className="bg-indigo-600 text-white border-0 px-3 py-1 rounded-full text-[10px] font-bold shadow-lg shadow-indigo-600/30">
                          {lastCourse.completedLessons === lastCourse.totalLessons ? 'Course Finished' : 'Resume Learning'}
                        </Badge>
                      </div>

                      <h2 className="text-xl sm:text-2xl lg:text-4xl font-black uppercase tracking-tight leading-tight mb-4 sm:mb-5 max-w-2xl">{lastCourse.title}</h2>

                      <div className="flex flex-wrap items-center gap-3 mb-5 sm:mb-7">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200/50">
                          <BookOpen size={13} className="text-indigo-400" />
                          <span>{lastCourse.totalLessons} lessons</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200/50">
                          <Clock size={13} className="text-indigo-400" />
                          <span>{Math.ceil(lastCourse.totalLessons * 0.5)}h total</span>
                        </div>
                      </div>

                      <Link href={`/student/course/${lastCourse.id}`} className="block sm:inline-block">
                        <Button className="w-full sm:w-auto h-11 px-7 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-white/90 transition-colors active:scale-95 shadow-lg shadow-indigo-900/20 group/btn">
                          {lastCourse.completedLessons === lastCourse.totalLessons
                            ? 'Revise Module'
                            : (lastCourse.completedLessons > 0 ? 'Resume Course' : 'Start Journey')}
                          <ArrowRight size={16} className="ml-2.5 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                        </Button>
                      </Link>
                    </div>

                    {/* Desktop circle */}
                    <div className="hidden lg:flex relative w-36 h-36 lg:w-44 lg:h-44 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="none" className="text-white/5" />
                        <circle
                          cx="80" cy="80" r="72"
                          stroke="currentColor" strokeWidth="12" fill="none"
                          strokeDasharray={desktopCircumference}
                          strokeDashoffset={desktopOffset}
                          strokeLinecap="round"
                          className="text-indigo-400"
                          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl lg:text-4xl font-black tracking-tighter">{Math.round(courseProgress * 100)}%</span>
                        <span className="text-[10px] font-semibold text-indigo-300/40 mt-1 uppercase tracking-widest">Done</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 2. Mobile Mini Dashboard: Analytics & Leaderboard */}
            <div className="lg:hidden grid grid-cols-2 gap-4">
              <Link href="/student/analytics" className="group">
                <div className="h-24 rounded-2xl bg-indigo-50/50 p-4 flex flex-col justify-between border border-indigo-100/50 hover:bg-indigo-100 active:scale-95 transition-[background-color,transform] duration-150">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                    <Activity size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-bold text-indigo-900 text-sm leading-tight">Analytics</p>
                    <p className="text-[10px] text-indigo-400 mt-0.5">Performance</p>
                  </div>
                </div>
              </Link>
              <Link href="/student/leaderboard" className="group">
                <div className="h-24 rounded-2xl bg-amber-50/50 p-4 flex flex-col justify-between border border-amber-100/50 hover:bg-amber-100 active:scale-95 transition-[background-color,transform] duration-150">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm border border-amber-100/50">
                    <Trophy size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 text-sm leading-tight">Leaderboard</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">Rank #{stats.rank || '-'}</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* 3. Overall Progress (Global Level) - Mobile only here */}
            <div className="lg:hidden bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl shadow-indigo-950/40 border border-white/5 group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Overall Progress</p>
                    <p className="text-xl font-black tracking-tight uppercase leading-none">Level {stats.level}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl">
                    <Crown size={24} className="text-indigo-400" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Next Level</p>
                    <p className="text-[10px] font-bold text-indigo-400">{Math.round(levelProgress)}%</p>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden p-1 flex border border-white/10">
                    <div
                      className="h-full bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Daily Goals (Missions) - Before Performance Stats */}
            <section className="lg:hidden bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase flex items-center gap-2">
                    Mission Protocols
                    <Wand2 size={12} className="text-indigo-500 animate-pulse" />
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                    <Clock size={10} /> Resets in {resetTime}
                  </p>
                </div>
                <Link href="/student/challenges">
                  <Button variant="ghost" className="w-8 h-8 p-0 rounded-lg bg-slate-50 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100">
                    <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3.5">
                {challenges.slice(0, 2).map((challenge) => (
                  <ChallengeItem
                    key={challenge.id}
                    title={challenge.title}
                    progress={challenge.current_progress}
                    total={challenge.target_value}
                    reward={challenge.xp_reward}
                    icon={getChallengeIcon(challenge.icon)}
                    color="indigo"
                    isCompact={true}
                  />
                ))}
              </div>
            </section>

            {/* 6. Active Courses List */}
            <section>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg">
                    <Zap size={16} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">My Courses</h3>
                </div>
                <Link href="/student/courses">
                  <Button variant="ghost" className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-3 h-9 rounded-xl border border-transparent hover:border-indigo-100">
                    See All <ChevronRight size={14} className="ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {courses.length > 0 ? (
                  courses.slice(0, 4).map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))
                ) : (
                  <div className="md:col-span-2 py-16 px-10 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
                      <BookOpen size={32} />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Courses Found</h4>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-3 max-w-sm leading-relaxed">No courses have been assigned to you yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Desktop Sidebar - Hidden on Mobile */}
          <div className="hidden xl:block xl:col-span-4 space-y-6">
            {/* My Progress Dashboard */}
            <div className="bg-slate-950 rounded-[2rem] p-6 lg:p-7 text-white relative overflow-hidden shadow-2xl shadow-indigo-950/40 border border-white/5 group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Overall Progress</p>
                    <p className="text-xl font-black tracking-tight uppercase leading-none">Level {stats.level}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl transition-transform duration-300 group-hover:rotate-6">
                    <Crown size={24} className="text-indigo-500" />
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-end justify-between">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Next Level</p>
                    <p className="text-[10px] font-bold text-indigo-400">{Math.round(levelProgress)}%</p>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden p-1 flex border border-white/10">
                    <div
                      className="h-full bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                      style={{
                        width: `${barWidth}%`,
                        transition: 'width 1.2s ease-out',
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">XP</p>
                    <p className="text-base font-black text-white">{stats.xp.toLocaleString()}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Streak</p>
                    <div className="flex items-center gap-1.5 text-orange-500">
                      <Flame size={14} fill="currentColor" />
                      <p className="text-base font-black text-white">{stats.streak}D</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Progress Analytics & Leaderboard */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/student/analytics" className="group">
                <div className="h-24 rounded-2xl bg-indigo-50 p-4 flex flex-col justify-between border border-indigo-100 hover:bg-indigo-100 active:scale-95 transition-[background-color,transform] duration-150">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <Activity size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-bold text-indigo-900 text-sm leading-tight">Analytics</p>
                    <p className="text-[10px] text-indigo-400 mt-0.5">View insights</p>
                  </div>
                </div>
              </Link>
              <Link href="/student/leaderboard" className="group">
                <div className="h-24 rounded-2xl bg-amber-50 p-4 flex flex-col justify-between border border-amber-100 hover:bg-amber-100 active:scale-95 transition-[background-color,transform] duration-150">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                    <Trophy size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 text-sm leading-tight">Leaderboard</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">Your rank</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Daily Goals */}
            <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase flex items-center gap-2">
                    Mission Protocols
                    <Wand2 size={12} className="text-indigo-500 animate-pulse" />
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                    <Clock size={10} /> Resets in {resetTime}
                  </p>
                </div>
                <Link href="/student/challenges">
                  <Button variant="ghost" className="w-8 h-8 p-0 rounded-lg bg-slate-50 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100">
                    <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3.5 px-0.5">
                {challenges.slice(0, 3).map((challenge) => {
                  return (
                    <ChallengeItem
                      key={challenge.id}
                      title={challenge.title}
                      progress={challenge.current_progress}
                      total={challenge.target_value}
                      reward={challenge.xp_reward}
                      icon={getChallengeIcon(challenge.icon)}
                      color="indigo"
                      isCompact={true}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function getChallengeIcon(iconName: string) {
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
}
