'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Flame, Star, Trophy, Zap, BookOpen, Clock, Target,
  ChevronRight, Award, Crown, Activity, Settings, User, Bell, Search, ArrowRight, Medal, Wand2
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

// Moved outside component — pure function, no need to recreate on every render
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

  // Memoised — hour of day doesn't change during a session
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

  // ── Progress bar ──────────────────────────────────────────────────────────
  // CSS transition from 0 → levelProgress driven by a single rAF after mount.
  // Eliminates the Framer Motion JS animation loop from every render cycle.
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setBarWidth(levelProgress));
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SVG progress circles ──────────────────────────────────────────────────
  // Same pattern: start at full circumference (no stroke), animate to target via
  // CSS stroke-dashoffset transition — GPU-composited, zero JS per frame.
  const mobileCircumference = 439.8; // 2π × 70
  const desktopCircumference = 452.3; // 2π × 72
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────
  // Stable refs for courses/challenges — these never change after initial render.
  // Removing them from the effect dep array prevents the entire search from
  // re-running whenever the parent component re-renders with a new array identity.
  const coursesRef = useRef(courses);
  const challengesRef = useRef(challenges);
  // Keep refs current when props update
  useEffect(() => { coursesRef.current = courses; }, [courses]);
  useEffect(() => { challengesRef.current = challenges; }, [challenges]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; href: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const q = searchQuery.toLowerCase();
      const results: { type: string; title: string; href: string }[] = [];

      coursesRef.current.forEach(c => {
        if (c.title.toLowerCase().includes(q))
          results.push({ type: 'Course', title: c.title, href: `/student/course/${c.id}` });
      });

      challengesRef.current.forEach(ch => {
        if (ch.title.toLowerCase().includes(q))
          results.push({ type: 'Challenge', title: ch.title, href: '/student/challenges' });
      });

      const staticPages = [
        { title: 'Profile Settings', keywords: ['settings', 'profile', 'password', 'email'], href: '/student/settings' },
        { title: 'Analytics Dashboard', keywords: ['analytics', 'stats', 'progress', 'performance'], href: '/student/analytics' },
        { title: 'Global Leaderboard', keywords: ['leaderboard', 'rank', 'top', 'players'], href: '/student/leaderboard' },
        { title: 'My Achievements', keywords: ['achievements', 'badges', 'awards', 'trophies'], href: '/student/achievements' },
      ];

      staticPages.forEach(p => {
        if (p.title.toLowerCase().includes(q) || p.keywords.some(k => k.includes(q)))
          results.push({ type: 'System', title: p.title, href: p.href });
      });

      setSearchResults(results.slice(0, 5));
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]); // courses/challenges accessed via stable refs — not deps

  return (
    <div className="min-h-screen bg-slate-50/20 pb-24 lg:pb-10">
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

        {/* Welcome Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
              {greeting}, <span className="text-indigo-600">{profile.full_name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-3 flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              {profile.className || 'Assigned Class'} • Session {new Date().getFullYear()} Active
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Portal Status</p>
              <Badge className="bg-slate-900 text-white border-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">Session Secure</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
          <div className="xl:col-span-8 space-y-10 lg:space-y-12">

            {/* Active Learning Hero */}
            {lastCourse && (
              <section className="group">
                <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-slate-950 p-6 sm:p-8 lg:p-10 text-white shadow-2xl shadow-indigo-950/20 border border-white/5">
                  {/*
                    * Decorative glow — was animating on hover via `group-hover:bg-indigo-500/20
                    * transition-all duration-[2000ms]`. A 2-second transition on a 400×400
                    * blur-[100px] element triggers continuous composited repaints on hover.
                    * Now static: same visual at rest, zero hover cost.
                    * blur-3xl (48px) instead of blur-[100px] — still a soft glow, ~50% cheaper.
                    */}
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 sm:gap-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-6 sm:mb-10 lg:hidden">
                        <Badge className="bg-indigo-600 text-white border-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/40">
                          {lastCourse.completedLessons === lastCourse.totalLessons ? 'Course Finished' : 'Resume Learning'}
                        </Badge>

                        {/* Mobile circle — CSS stroke-dashoffset transition (GPU-composited) */}
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="20" fill="none" className="text-white/5" />
                            <circle
                              cx="80" cy="80" r="70"
                              stroke="currentColor" strokeWidth="20" fill="none"
                              strokeDasharray={mobileCircumference}
                              strokeDashoffset={mobileOffset}
                              strokeLinecap="round"
                              className="text-indigo-500"
                              style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-black">{Math.round(courseProgress * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden lg:block mb-6">
                        <Badge className="bg-indigo-600 text-white border-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-indigo-600/40">
                          {lastCourse.completedLessons === lastCourse.totalLessons ? 'Course Finished' : 'Resume Learning'}
                        </Badge>
                      </div>

                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-[0.95] mb-5 sm:mb-6 max-w-2xl">{lastCourse.title}</h2>

                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-7 sm:mb-8">
                        <div className="flex items-center gap-2 bg-white/5 lg:bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 rounded-lg border border-white/5 lg:border-0 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                          <BookOpen size={14} className="text-indigo-400" />
                          <span>{lastCourse.totalLessons} LESSONS</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 lg:bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 rounded-lg border border-white/5 lg:border-0 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                          <Clock size={14} className="text-indigo-400" />
                          <span>{Math.ceil(lastCourse.totalLessons * 0.5)}H TOTAL</span>
                        </div>
                      </div>

                      <Link href={`/student/course/${lastCourse.id}`} className="block sm:inline-block">
                        <Button className="w-full sm:w-auto h-12 sm:h-13 px-8 sm:px-10 rounded-xl bg-white text-slate-950 font-black uppercase tracking-[0.2em] text-[9px] hover:bg-white/90 transition-colors active:scale-95 shadow-2xl shadow-indigo-900/20 group/btn">
                          {lastCourse.completedLessons === lastCourse.totalLessons
                            ? 'Revise Module'
                            : (lastCourse.completedLessons > 0 ? 'Resume Course' : 'Start Journey')}
                          <ArrowRight size={16} className="ml-2.5 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                        </Button>
                      </Link>
                    </div>

                    {/* Desktop circle — CSS stroke-dashoffset transition (GPU-composited) */}
                    <div className="hidden lg:flex relative w-36 h-36 lg:w-44 lg:h-44 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="none" className="text-white/5" />
                        <circle
                          cx="80" cy="80" r="72"
                          stroke="currentColor" strokeWidth="12" fill="none"
                          strokeDasharray={desktopCircumference}
                          strokeDashoffset={desktopOffset}
                          strokeLinecap="round"
                          className="text-indigo-500"
                          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl lg:text-4xl font-black tracking-tighter">{Math.round(courseProgress * 100)}%</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1.5">Finished</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Performance Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <QuickStatCard icon={BookOpen} value={stats?.lessonsCompleted || 0} label="Lessons" />
              <QuickStatCard icon={Clock} value={`${((stats?.learningTimeMinutes || 0) / 60).toFixed(1)}h`} label="Time Spent" />
              <QuickStatCard icon={Target} value={`${stats?.accuracy || 0}%`} label="Score" />
              <QuickStatCard icon={Medal} value={`#${stats?.rank || '-'}`} label="Rank" />
            </div>

            {/* Active Courses */}
            <section>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg">
                    <Zap size={16} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">My Courses</h3>
                </div>
                <Link href="/student/courses">
                  <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-4 h-9 rounded-xl border border-transparent hover:border-indigo-100">
                    See All <ChevronRight size={14} className="ml-1.5" />
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
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-3 max-w-sm leading-relaxed">No courses have been assigned to you yet. Please contact your teacher or administrator.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="xl:col-span-4 space-y-8">

            {/* Quick Intelligence Search */}
            <div className="relative group">
              <div className="bg-white rounded-[2rem] p-2.5 shadow-xl shadow-slate-200/40 border border-slate-100 flex items-center gap-3 transition-shadow focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-100">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses, settings..."
                  className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-bold"
                />
                {isSearching && (
                  <div className="mr-3 w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                )}
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                  >
                    {searchResults.length > 0 ? (
                      <div className="p-3 space-y-1">
                        {searchResults.map((result, idx) => (
                          <Link key={idx} href={result.href} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group/res">
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase
                                ${result.type === 'Course' ? 'bg-indigo-50 text-indigo-600' :
                                  result.type === 'Challenge' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                                {result.type[0]}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 leading-tight group-hover/res:text-indigo-600 transition-colors">{result.title}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{result.type}</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-300" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No intelligence found for "{searchQuery}"</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* My Progress Dashboard */}
            <div className="bg-slate-950 rounded-[2rem] p-6 lg:p-7 text-white relative overflow-hidden shadow-2xl shadow-indigo-950/40 border border-white/5 group">
              {/*
                * Decorative glow — removed `group-hover:bg-indigo-600/20 transition-all duration-1000`.
                * Animating a blur-[80px] element on every hover event causes continuous
                * repaints on the composited layer. Static decoration only.
                */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1.5">Overall Progress</p>
                    <p className="text-xl lg:text-2xl font-black tracking-tighter uppercase leading-none">Level {stats.level}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl transition-transform duration-300 group-hover:rotate-6">
                    <Crown size={24} className="text-indigo-500" />
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-end justify-between">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Next Level Progress</p>
                    <p className="text-[9px] font-black text-indigo-500">{Math.round(levelProgress)}% Complete</p>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden p-1 flex border border-white/10">
                    {/*
                      * Replaced motion.div — the Framer JS animation loop ran on every
                      * dashboard render. CSS transition-[width] is GPU-composited and
                      * fires once (rAF-deferred setState in useEffect above).
                      */}
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
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Total XP</p>
                    <p className="text-base font-black text-white">{stats.xp.toLocaleString()}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Streak</p>
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
                <div className="h-32 rounded-[2rem] bg-indigo-50/50 p-6 flex flex-col justify-between border border-indigo-100/50 hover:bg-indigo-100/80 hover:scale-[1.02] active:scale-95 transition-[background-color,transform] duration-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full -mr-8 -mt-8 blur-2xl" />
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                    <Activity size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-black text-indigo-900/80 uppercase tracking-tighter text-base leading-[0.9]">Analytics</p>
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1.5">View Insights</p>
                  </div>
                </div>
              </Link>
              <Link href="/student/leaderboard" className="group">
                <div className="h-32 rounded-[2rem] bg-amber-50/50 p-6 flex flex-col justify-between border border-amber-100/50 hover:bg-amber-100/80 hover:scale-[1.02] active:scale-95 transition-[background-color,transform] duration-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full -mr-8 -mt-8 blur-2xl" />
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm border border-amber-50">
                    <Trophy size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-black text-amber-900/80 uppercase tracking-tighter text-base leading-[0.9]">Leaderboard</p>
                    <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1.5">Weekly Rank</p>
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
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    <Clock size={10} /> Link Reset in {resetTime}
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
                  const getTheme = (type: string) => {
                    const map: Record<string, string> = {
                      'xp_gain': 'amber',
                      'learning_time': 'sky',
                      'quiz_complete': 'violet',
                      'streak': 'emerald',
                      'lesson_complete': 'emerald'
                    };
                    return map[type] || 'indigo';
                  };
                  return (
                    <ChallengeItem
                      key={challenge.id}
                      title={challenge.title}
                      progress={challenge.current_progress}
                      total={challenge.target_value}
                      reward={challenge.xp_reward}
                      icon={getChallengeIcon(challenge.icon)}
                      color={getTheme(challenge.challenge_type)}
                      unit={challenge.challenge_type === 'learning_time' ? 'm' : ''}
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
