'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Clock, Star, ShieldCheck, Zap, Lock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Lesson } from '@/modules/student/types';

interface LessonOverviewProps {
  lesson: Lesson;
  lessonComplete: boolean;
  nextLesson?: any;
}

export function LessonOverview({ lesson, lessonComplete, nextLesson }: LessonOverviewProps) {
  const typeLabel = lesson.content_type
    ? lesson.content_type.charAt(0).toUpperCase() + lesson.content_type.slice(1)
    : 'Lesson';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6 sm:space-y-10"
    >
      {/* ─── Title + type badge ─── */}
      <div className="space-y-3 sm:space-y-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
          <span className="w-1 h-3 bg-indigo-600 rounded-full" />
          {typeLabel} Module
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
          {lesson.title}
        </h2>
      </div>

      <div className="h-px bg-slate-100" />

      {/* ─── Description ─── */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.35em]">About this lesson</p>
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">
          {lesson.description ||
            `Enhance your proficiency in ${lesson.title} by mastering the core principles and methodologies examined in this module.`}
        </p>
      </div>

      {/* ─── Stats grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Clock size={16} className="text-slate-400" />}
          bg="bg-slate-50"
          label="Duration"
          value={`${lesson.duration || 0} min`}
        />
        <StatCard
          icon={<Star size={16} className="text-amber-500 fill-amber-500" />}
          bg="bg-amber-50"
          label="XP Reward"
          value={`+${lesson.xp_reward} XP`}
          valueClass="text-amber-600"
        />
        <StatCard
          icon={<ShieldCheck size={16} className={lessonComplete ? 'text-emerald-500' : 'text-slate-400'} />}
          bg={lessonComplete ? 'bg-emerald-50' : 'bg-slate-50'}
          label="Status"
          value={lessonComplete ? 'Done' : 'Pending'}
          valueClass={lessonComplete ? 'text-emerald-600' : 'text-slate-900'}
        />
        <StatCard
          icon={<Zap size={16} className="text-indigo-500 fill-indigo-500" />}
          bg="bg-indigo-50"
          label="Format"
          value={typeLabel}
          valueClass="text-indigo-600"
        />
      </div>

      {/* ─── Progression card (desktop sidebar feel, mobile compact) ─── */}
      <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Module {lesson.sequence_index + 1}
            </p>
            <p className="text-base sm:text-lg font-black text-white uppercase leading-tight">
              {lessonComplete
                ? nextLesson ? 'Ready for next lesson' : 'Course milestone reached'
                : 'Currently in progress'}
            </p>
          </div>
          {lessonComplete && nextLesson ? (
            <Link href={`/student/lesson/${nextLesson.id}`} className="flex-shrink-0">
              <button className="h-11 px-5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[9px] hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-500/20 whitespace-nowrap">
                Next <ChevronRight size={14} />
              </button>
            </Link>
          ) : lessonComplete ? (
            <div className="flex-shrink-0 h-10 px-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center text-[9px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap">
              Finished
            </div>
          ) : (
            <div className="flex-shrink-0 h-10 px-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
              <Lock size={11} /> In Progress
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon,
  bg,
  label,
  value,
  valueClass = 'text-slate-900',
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', bg)}>
        {icon}
      </div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={cn('text-sm font-black', valueClass)}>{value}</p>
    </div>
  );
}
