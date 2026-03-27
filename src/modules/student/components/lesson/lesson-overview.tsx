'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Star, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Lesson } from '@/modules/student/types';

interface LessonOverviewProps {
  lesson: Lesson;
  lessonComplete: boolean;
  nextLesson?: Lesson | null;
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

      {/* ─── Description (Hidden if using multi-block as it is handled in LessonContent) ─── */}
      {!lesson.content_items && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.35em]">About this lesson</p>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium">
            {lesson.description ||
              `Enhance your proficiency in ${lesson.title} by mastering the core principles and methodologies examined in this module.`}
          </p>
        </div>
      )}

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
