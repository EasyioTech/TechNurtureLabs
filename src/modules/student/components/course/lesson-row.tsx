'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Play, CheckCircle2, Lock, FileText, MonitorPlay, HelpCircle, Star, ChevronRight, ImageIcon } from 'lucide-react';
import { Lesson } from '@/modules/student/types';

const ICON_MAP = {
  video: Play,
  quiz: HelpCircle,
  ppt: MonitorPlay,
  pdf: FileText,
  image: ImageIcon
};

const LABEL_MAP = {
  video: 'Video Lesson',
  ppt: 'Slideshow',
  pdf: 'Reading Material',
  quiz: 'Practice Quiz',
  image: 'Images'
};

export function LessonRow({ lesson, index }: { lesson: Lesson; index: number }) {
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';
  const isAvailable = lesson.status === 'available';

  const Icon = ICON_MAP[lesson.content_type as keyof typeof ICON_MAP] || Play;

  const content = (
    <div className={cn(
      "flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-300 group/row relative overflow-hidden",
      isCompleted
        ? 'bg-emerald-50/10 border-emerald-100/50 hover:border-emerald-200'
        : isLocked
          ? 'bg-slate-50/30 border-slate-100/50 opacity-60'
          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/20 active:scale-[0.99]'
    )}>
      {/* Subtle background glow on hover instead of heavy colors */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/[0.02] opacity-0 group-hover/row:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all duration-500 relative z-10",
        isCompleted
          ? 'bg-white text-emerald-500 border-emerald-100 shadow-sm shadow-emerald-500/5'
          : isLocked
            ? 'bg-slate-50 text-slate-300 border-slate-100'
            : 'bg-white text-slate-600 border-slate-100 group-hover/row:border-indigo-100 group-hover/row:text-indigo-600 shadow-sm'
      )}>
        {isCompleted ? <CheckCircle2 size={24} strokeWidth={2.5} /> :
          isLocked ? <Lock size={20} strokeWidth={2.5} /> :
            <Icon size={24} strokeWidth={2} className="transition-transform duration-500 group-hover/row:scale-110" />}
      </div>

      <div className="flex-1 min-w-0 pr-4 relative z-10">
        <div className="flex flex-wrap items-center gap-2.5 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/80">Lesson {index + 1}</span>
          <div className={cn(
              "text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border transition-colors",
              isLocked ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-white text-slate-500 border-slate-100 group-hover/row:border-indigo-100 group-hover/row:text-indigo-600"
          )}>
            {LABEL_MAP[lesson.content_type as keyof typeof LABEL_MAP]}
          </div>
          {isAvailable && (
            <span className="flex items-center gap-1.5 text-[8px] font-black text-indigo-500 uppercase tracking-[0.15em] bg-indigo-50/50 px-2.5 py-1 rounded-full border border-indigo-100/50">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              Resume
            </span>
          )}
        </div>
        <h4 className={cn(
            "text-base sm:text-lg font-black truncate tracking-tight uppercase leading-none transition-all duration-300",
            isLocked ? 'text-slate-300' : 'text-slate-700 group-hover/row:text-slate-900 group-hover/row:translate-x-1'
        )}>
          {lesson.title}
        </h4>
      </div>

      <div className="flex items-center gap-6 flex-shrink-0 relative z-10">
        <div className="text-right hidden sm:block">
          <div className="flex items-center justify-end gap-1 text-amber-500/80 text-[10px] font-black mb-1 transition-transform group-hover/row:-translate-y-0.5">
            <Star size={10} fill="currentColor" />
            <span className="uppercase tracking-widest">{lesson.xp_reward} XP</span>
          </div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] group-hover/row:text-slate-400 transition-colors">{lesson.duration || 10} MINS</p>
        </div>

        <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border",
            isAvailable 
                ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200 group-hover/row:bg-indigo-600 group-hover/row:border-indigo-600 group-hover/row:shadow-indigo-200' 
                : 'text-slate-200 border-slate-100 bg-slate-50/50'
        )}>
          {isCompleted ? <CheckCircle2 size={18} strokeWidth={3} className="text-emerald-500" /> : <ChevronRight size={18} strokeWidth={3} />}
        </div>
      </div>
    </div>
  );

  if (isLocked) return content;

  return (
    <Link href={`/student/lesson/${lesson.id}`} className="block">
      {content}
    </Link>
  );
}
