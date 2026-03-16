'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Flame, Star, Trophy, Zap, BookOpen, Clock, Target,
  ChevronRight, Award, Crown, Activity, Settings, User, Bell, Search, ArrowRight, Medal
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { StudentHeader } from '../header';
import { QuickStatCard } from '../stat-pill';
import { ChallengeCard } from '../challenge-card';
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

export function ClientDashboard({ initialData }: ClientDashboardProps) {
  const { profile, stats, school, courses, achievements, activities, challenges, platformSettings } = initialData;
  const [resetTime, setResetTime] = useState('');
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResetTime(calculateResetTime());
    const interval = setInterval(() => setResetTime(calculateResetTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  const levelProgress = Math.min(100, ((stats.xp % 1000) / 1000) * 100);
  const lastCourse = courses[0];

  return (
    <div className="min-h-screen bg-slate-50/10 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Removed Redundant Header - Handled by LayoutShell */}

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Welcome Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase">
              {getGreeting()}, <span className="text-indigo-600">{profile.full_name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-5 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
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

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
          <div className="xl:col-span-8 space-y-12 lg:space-y-16">

            {/* Active Learning Hero */}
            {lastCourse && (
              <section className="group">
                <div className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[3.5rem] bg-slate-950 p-7 sm:p-10 lg:p-16 text-white shadow-2xl shadow-indigo-950/20 border border-white/5 transition-all duration-1000">
                  <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[120px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-[2000ms]" />
                  
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 sm:gap-16">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-8 sm:mb-12 lg:hidden">
                        <Badge className="bg-indigo-600 text-white border-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/40">
                          {lastCourse.completedLessons === lastCourse.totalLessons ? 'Course Finished' : 'Resume Learning'}
                        </Badge>
                        
                        <div className="relative w-14 h-14 flex-shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="20" fill="none" className="text-white/5" />
                            <motion.circle
                              cx="80" cy="80" r="70"
                              stroke="currentColor" strokeWidth="20" fill="none"
                              strokeDasharray="439.8"
                              initial={{ strokeDashoffset: 439.8 }}
                              animate={{ strokeDashoffset: 439.8 - (439.8 * (lastCourse.completedLessons / (lastCourse.totalLessons || 1))) }}
                              transition={{ duration: 2, ease: "easeOut" }}
                              className="text-indigo-500"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-black">{Math.round((lastCourse.completedLessons / (lastCourse.totalLessons || 1)) * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden lg:block mb-10">
                        <Badge className="bg-indigo-600 text-white border-0 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40">
                             {lastCourse.completedLessons === lastCourse.totalLessons ? 'Course Finished' : 'Resume Learning'}
                        </Badge>
                      </div>

                      <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] mb-8 sm:mb-10 max-w-2xl">{lastCourse.title}</h2>
                      
                      <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-10 sm:mb-12">
                        <div className="flex items-center gap-3 bg-white/5 lg:bg-transparent px-4 py-2 sm:px-0 sm:py-0 rounded-xl border border-white/5 lg:border-0 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                          <BookOpen size={18} className="text-indigo-400" />
                          <span>{lastCourse.totalLessons} LESSONS</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 lg:bg-transparent px-4 py-2 sm:px-0 sm:py-0 rounded-xl border border-white/5 lg:border-0 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                          <Clock size={18} className="text-indigo-400" />
                          <span>{Math.ceil(lastCourse.totalLessons * 0.5)}H TOTAL</span>
                        </div>
                      </div>

                      <Link href={`/student/course/${lastCourse.id}`} className="block sm:inline-block">
                        <Button className="w-full sm:w-auto h-16 sm:h-18 px-10 sm:px-14 rounded-[2rem] sm:rounded-[2.5rem] bg-white text-slate-950 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white/90 transition-all active:scale-95 shadow-2xl shadow-indigo-900/20 group/btn">
                          {lastCourse.completedLessons === lastCourse.totalLessons 
                            ? 'Revise Module' 
                            : (lastCourse.completedLessons > 0 ? 'Resume Course' : 'Start Journey')}
                          <ArrowRight size={20} className="ml-4 group-hover/btn:translate-x-2 transition-transform duration-500" />
                        </Button>
                      </Link>
                    </div>

                    <div className="hidden lg:flex relative w-56 h-56 lg:w-64 lg:h-64 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="none" className="text-white/5" />
                        <motion.circle
                          cx="80" cy="80" r="72"
                          stroke="currentColor" strokeWidth="12" fill="none"
                          strokeDasharray="452.3"
                          initial={{ strokeDashoffset: 452.3 }}
                          animate={{ strokeDashoffset: 452.3 - (452.3 * (lastCourse.completedLessons / (lastCourse.totalLessons || 1))) }}
                          transition={{ duration: 2, ease: "easeOut" }}
                          className="text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl lg:text-6xl font-black tracking-tighter">{Math.round((lastCourse.completedLessons / (lastCourse.totalLessons || 1)) * 100)}%</span>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mt-3">Finished</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Performance Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <QuickStatCard icon={BookOpen} value={stats.lessonsCompleted || 0} label="Lessons" />
              <QuickStatCard icon={Clock} value={`${(Number(stats.learningTimeMinutes || 0) / 60).toFixed(1)}h`} label="Time Spent" />
              <QuickStatCard icon={Target} value={`${stats.accuracy || 0}%`} label="Score" />
              <QuickStatCard icon={Medal} value={`#${stats.rank || 0}`} label="Rank" />
            </div>

            {/* Active Courses */}
            <section>
              <div className="flex items-center justify-between mb-10 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                    <Zap size={18} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">My Courses</h3>
                </div>
                <Link href="/student/courses">
                  <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-5 h-10 rounded-2xl border border-transparent hover:border-indigo-100">
                    See All <ChevronRight size={14} className="ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {courses.length > 0 ? (
                  courses.slice(0, 4).map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))
                ) : (
                  <div className="md:col-span-2 py-16 px-10 rounded-[3.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
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
          <div className="xl:col-span-4 space-y-10">
            
            {/* My Progress Dashboard */}
            <div className="bg-slate-950 rounded-[3.5rem] p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-950/40 border border-white/5 group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-1000" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">Overall Progress</p>
                    <p className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none">Level {stats.level}</p>
                  </div>
                  <div className="w-16 h-16 rounded-[2rem] bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 shadow-2xl transition-transform group-hover:rotate-6">
                    <Crown size={32} className="text-indigo-500" />
                  </div>
                </div>

                <div className="space-y-6 mb-12">
                  <div className="flex items-end justify-between">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Level Progress</p>
                    <p className="text-xs font-black text-indigo-500">{Math.round(levelProgress)}% Complete</p>
                  </div>
                  <div className="h-5 bg-white/5 rounded-full overflow-hidden p-1.5 flex border border-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Total XP</p>
                    <p className="text-xl font-black text-white">{stats.xp.toLocaleString()}</p>
                  </div>
                  <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Streak</p>
                    <div className="flex items-center gap-2 text-orange-500">
                      <Flame size={18} fill="currentColor" />
                      <p className="text-xl font-black text-white">{stats.streak}D</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Progress Links */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/student/analytics" className="w-full h-full">
                <Button className="w-full h-20 bg-white text-slate-900 font-black uppercase tracking-widest text-[9px] rounded-[2rem] hover:bg-slate-50 transition-all border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col items-center justify-center gap-2 group">
                  <Activity size={20} className="text-sky-500 group-hover:scale-110 transition-transform duration-500" />
                  Analytics
                </Button>
              </Link>
              <Link href="/student/leaderboard" className="w-full h-full">
                <Button className="w-full h-20 bg-white text-slate-900 font-black uppercase tracking-widest text-[9px] rounded-[2rem] hover:bg-slate-50 transition-all border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col items-center justify-center gap-2 group">
                  <Trophy size={20} className="text-amber-500 group-hover:scale-110 transition-transform duration-500" />
                  Leaderboard
                </Button>
              </Link>
            </div>

            {/* Daily Goals */}
            <section className="bg-white rounded-[3.5rem] p-8 border border-slate-100 shadow-md group">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">Daily Challenges</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2.5 flex items-center gap-2">
                    <Clock size={10} /> {resetTime} until reset
                  </p>
                </div>
                <Link href="/student/challenges">
                  <Button variant="ghost" className="w-10 h-10 p-0 rounded-2xl bg-slate-50 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100">
                    <ChevronRight size={18} />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {challenges.slice(0, 3).map((challenge) => (
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
