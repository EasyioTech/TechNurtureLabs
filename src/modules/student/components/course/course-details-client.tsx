'use client';

import React from 'react';
import { CourseDetailsHeader } from '@/modules/student/components/course/course-header';
import { LessonRow } from '@/modules/student/components/course/lesson-row';
import {
  BookOpen, Clock, Star, Trophy, Zap,
  ArrowRight, ShieldCheck, Target, Layers, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { handleThumbnailError } from '@/lib/media';

interface CourseDetailsClientProps {
  initialData: {
    course: any;
    lessons: any[];
    enrolledCount: number;
  }
}

export function CourseDetailsClient({ initialData }: CourseDetailsClientProps) {
  const { course, lessons, enrolledCount } = initialData;

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const totalXP = lessons.reduce((acc, l) => acc + (l.xp_reward || 0), 0);
  const earnedXP = lessons.filter(l => l.status === 'completed').reduce((acc, l) => acc + (l.xp_reward || 0), 0);
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 10), 0);
  const nextLesson = lessons.find(l => l.status === 'available') || lessons.find(l => l.status === 'current') || lessons[0];

  const ctaLabel = completedCount > 0
    ? (progress === 100 ? 'Revise Course' : 'Resume Learning')
    : 'Start Course';

  return (
    <div className="min-h-screen bg-slate-50/30 pb-32 lg:pb-16 selection:bg-indigo-100 selection:text-indigo-900">
      <CourseDetailsHeader title={course?.title || 'Learning Course'} progress={progress} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14">

          {/* ═══ Left / Main ═══ */}
          <div className="lg:col-span-8 space-y-8">

            {/* Hero thumbnail — always 16:9 */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 aspect-video shadow-[0_20px_60px_-10px_rgba(0,0,0,0.35)] border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {course?.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course?.title}
                  decoding="async"
                  onError={handleThumbnailError}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.25)_0%,_transparent_55%)]" />

              {/* Overlay text */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                    {course?.all_grades ? 'All Students' : `Grade ${course?.grade}`}
                  </span>
                  <span className="px-3 py-1 bg-white/10 border border-white/15 text-white/60 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                    {enrolledCount} Enrolled
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-[0.95] max-w-3xl mb-2 sm:mb-3">
                  {course?.title}
                </h1>
                <p className="text-white/50 text-xs sm:text-sm font-medium line-clamp-2 max-w-xl leading-relaxed hidden sm:block">
                  {course?.description}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <QuickStat icon={<Layers size={18} className="text-indigo-500" />} label="Lessons" value={lessons.length} bg="bg-indigo-50" />
              <QuickStat icon={<Clock size={18} className="text-sky-500" />} label="Total Time" value={`${totalDuration}m`} bg="bg-sky-50" />
              <QuickStat icon={<Star size={18} className="text-amber-500 fill-amber-500" />} label="Total XP" value={totalXP.toLocaleString()} bg="bg-amber-50" />
              <QuickStat icon={<ShieldCheck size={18} className="text-emerald-500" />} label="Status" value="Verified" bg="bg-emerald-50" />
            </div>

            {/* ── Mobile-only: Progress + CTA (visible before lesson list) ── */}
            <div className="lg:hidden bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Course Progress</span>
                <span className="text-xl font-black text-indigo-600">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50 shadow-inner mb-3">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {completedCount}/{lessons.length} lessons done
                </span>
                <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black">
                  <Star size={12} fill="currentColor" />
                  {earnedXP.toLocaleString()} XP
                </div>
              </div>
              {nextLesson && (
                <Link href={`/student/lesson/${nextLesson.id}`} className="block mt-4">
                  <button className="w-full bg-slate-900 text-white h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95">
                    {ctaLabel} <ArrowRight size={16} />
                  </button>
                </Link>
              )}
              {progress === 100 && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                    <Trophy size={16} />
                  </div>
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Course Mastered!</p>
                </div>
              )}
            </div>

            {/* Lesson list */}
            <section>
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Course Content</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Follow your learning path</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
                  {lessons.length} Lessons
                </span>
              </div>

              <div className="space-y-3">
                {lessons.map((lesson, index) => (
                  <LessonRow key={lesson.id} lesson={lesson} index={index} />
                ))}
              </div>
            </section>
          </div>

          {/* ═══ Right sidebar (desktop only) ═══ */}
          <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6">

            {/* Progress card */}
            <section className="bg-white border border-slate-100 rounded-[3rem] p-8 shadow-xl shadow-slate-200/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-indigo-600 pointer-events-none">
                <BookOpen size={120} />
              </div>

              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.45em]">Study Record</h4>
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  progress === 100 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' :
                    progress > 0 ? 'bg-indigo-600 animate-pulse shadow-[0_0_12px_rgba(79,70,229,0.5)]' :
                      'bg-slate-200'
                )} />
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Progress</span>
                    <span className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-6 bg-slate-50 rounded-2xl overflow-hidden p-1 border border-slate-100 shadow-inner">
                    <div
                      className="h-full bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">
                    {completedCount} / {lessons.length} lessons
                  </p>
                </div>

                <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm">
                      <Star size={22} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">XP Earned</p>
                      <p className="text-xl font-black text-slate-900">{earnedXP.toLocaleString()} XP</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Still Available</span>
                    <span className="text-xs font-black text-indigo-600">+{(totalXP - earnedXP).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {nextLesson && (
                <Link href={`/student/lesson/${nextLesson.id}`} className="block">
                  <button className="w-full bg-slate-900 text-white h-14 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] hover:bg-indigo-600 hover:shadow-[0_16px_40px_-8px_rgba(79,70,229,0.5)] active:scale-95 transition-all flex items-center justify-center gap-3">
                    {ctaLabel} <ArrowRight size={18} />
                  </button>
                </Link>
              )}

              {progress === 100 && (
                <div className="mt-4 p-4 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 flex items-center gap-3 animate-in fade-in duration-300">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Course Mastered</p>
                    <p className="text-[8px] font-bold text-emerald-600/70 uppercase mt-0.5">All lessons complete</p>
                  </div>
                </div>
              )}
            </section>

            {/* Badges */}
            <section className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-[0_30px_60px_-15px_rgba(15,23,42,0.5)] border border-white/5">
              <div className="absolute top-0 right-0 w-52 h-52 bg-indigo-500/10 rounded-full blur-[60px]" />
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.45em] mb-6">Course Badges</h4>
              <div className="grid grid-cols-3 gap-3">
                <BadgeIcon unlocked={progress >= 25} icon={Target} tooltip="Course Started" />
                <BadgeIcon unlocked={progress >= 50} icon={Zap} tooltip="Halfway There" />
                <BadgeIcon unlocked={progress === 100} icon={Award} tooltip="Course Mastery" />
              </div>
              <div className="mt-6 flex items-center gap-3 opacity-40">
                <div className="w-5 h-px bg-indigo-500" />
                <p className="text-[8px] font-black uppercase tracking-[0.35em]">
                  {progress === 100 ? 'All badges earned' : 'Keep going to unlock'}
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ─── Mobile sticky bottom bar ─── */}
      {nextLesson && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[80] bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 py-3 flex items-center gap-3 shadow-[0_-8px_24px_rgba(0,0,0,0.07)]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{completedCount}/{lessons.length} lessons</span>
              <span className="text-[9px] font-black text-indigo-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <Link href={`/student/lesson/${nextLesson.id}`} className="flex-shrink-0">
            <button className="h-11 px-5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 active:scale-95 whitespace-nowrap">
              {ctaLabel} <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

function QuickStat({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: any; bg: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', bg)}>
        {icon}
      </div>
      <p className="text-lg sm:text-xl font-black text-slate-900 leading-none mb-1">{value}</p>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function BadgeIcon({ unlocked, icon: Icon, tooltip }: { unlocked: boolean; icon: any; tooltip: string }) {
  return (
    <div className={cn(
      'aspect-square rounded-2xl border-2 flex items-center justify-center transition-all duration-500 relative group/badge cursor-help',
      unlocked
        ? 'bg-indigo-600/20 border-indigo-500/40 shadow-[0_0_20px_rgba(79,70,229,0.15)]'
        : 'bg-white/5 border-white/5'
    )}>
      <Icon size={22} className={cn(
        'transition-all duration-500',
        unlocked ? 'text-indigo-400 scale-110 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'text-white opacity-10'
      )} />
      <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {tooltip}
      </div>
    </div>
  );
}
