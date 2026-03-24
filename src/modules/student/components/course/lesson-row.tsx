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
  assignment: Star,
  image: ImageIcon
};

const LABEL_MAP = {
  video: 'Video Lesson',
  ppt: 'Slideshow',
  pdf: 'Reading Material',
  quiz: 'Practice Quiz',
  assignment: 'Assignment',
  image: 'Image'
};

export function LessonRow({ lesson, index }: { lesson: Lesson; index: number }) {
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';
  const isAvailable = lesson.status === 'available';

  const Icon = ICON_MAP[lesson.content_type as keyof typeof ICON_MAP] || Play;

  const content = (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-[2.5rem] border transition-all duration-500 group/row relative overflow-hidden",
      isCompleted
        ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200'
        : isLocked
          ? 'bg-slate-50/50 border-slate-100 opacity-60 grayscale'
          : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5'
    )}>
      <div className={cn(
        "w-12 h-12 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 border-2 transition-transform group-hover/row:scale-105 duration-500 shadow-sm",
        isCompleted
          ? 'bg-white text-emerald-500 border-emerald-100'
          : isLocked
            ? 'bg-slate-100 text-slate-400 border-slate-200'
            : 'bg-white text-indigo-600 border-indigo-100 shadow-indigo-100'
      )}>
        {isCompleted ? <CheckCircle2 size={24} /> :
          isLocked ? <Lock size={20} /> :
            <Icon size={24} strokeWidth={2.5} />}
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Lesson {index + 1}</span>
          <span className="text-[8px] px-2.5 py-1 rounded-full bg-slate-900 text-white font-black uppercase tracking-widest shadow-lg shadow-slate-200/50">
            {LABEL_MAP[lesson.content_type as keyof typeof LABEL_MAP]}
          </span>
          {isAvailable && (
            <span className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Next Up
            </span>
          )}
        </div>
        <h4 className={cn(
            "text-base font-black truncate tracking-tight uppercase leading-none transition-colors duration-300",
            isLocked ? 'text-slate-400' : 'text-slate-900 group-hover/row:text-indigo-600'
        )}>
          {lesson.title}
        </h4>
      </div>

      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <div className="flex items-center justify-end gap-1 text-amber-500 text-[10px] font-black mb-1">
            <Star size={10} fill="currentColor" />
            <span className="uppercase tracking-widest">{lesson.xp_reward} XP</span>
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">{lesson.duration || 10} MINS</p>
        </div>

        <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
            isAvailable ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 group-hover/row:translate-x-1' : 'text-slate-200 border border-slate-100 bg-slate-50'
        )}>
          {isCompleted ? <CheckCircle2 size={20} className="text-emerald-500" /> : <ChevronRight size={20} />}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-700 w-0 group-hover/row:w-full" />
    </div>
  );

  if (isLocked) return content;

  return (
    <Link href={`/student/lesson/${lesson.id}`} className="block">
      {content}
    </Link>
  );
}
