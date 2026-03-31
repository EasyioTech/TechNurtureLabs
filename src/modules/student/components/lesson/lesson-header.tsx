'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowLeft, Star } from 'lucide-react';

interface LessonHeaderProps {
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  xpReward: number;
  isSyllabusOpen: boolean;
  onToggleSyllabus: () => void;
}

export function LessonHeader({
  courseId,
  courseTitle,
  lessonTitle,
  xpReward,
  isSyllabusOpen,
  onToggleSyllabus,
}: LessonHeaderProps) {
  return (
    <header className="sticky top-0 z-[120] bg-white/95 backdrop-blur-2xl border-b border-slate-100 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-12 gap-2 shadow-sm">
      {/* Left: back + title */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
        <button 
          onClick={() => window.history.back()}
          className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-all active:scale-90 shadow-sm"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-500 truncate leading-none mb-0.5">
            {courseTitle}
          </p>
          <h1 className="text-[13px] sm:text-sm lg:text-base font-black uppercase tracking-tight truncate leading-none text-slate-900 max-w-[220px] xs:max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-2xl">
            {lessonTitle}
          </h1>
        </div>
      </div>

      {/* Right: XP + menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* XP always visible */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
          <Star size={12} fill="currentColor" className="sm:w-3.5 sm:h-3.5 animate-pulse" />
          <span>+{xpReward}</span>
          <span className="hidden sm:inline text-amber-500/70">XP</span>
        </div>

        <button
          onClick={onToggleSyllabus}
          className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all active:scale-90",
            isSyllabusOpen
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200"
              : "bg-white border-slate-100 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
          )}
        >
          {/* Hamburger → X morph */}
          <div className="relative w-4 h-4 flex flex-col justify-center gap-[4px]">
            <span className={cn(
              "block h-[2px] rounded-full bg-current transition-all duration-300 origin-center",
              isSyllabusOpen ? "rotate-45 translate-y-[3px]" : ""
            )} />
            <span className={cn(
              "block h-[2px] rounded-full bg-current transition-all duration-300",
              isSyllabusOpen ? "opacity-0 scale-x-0" : ""
            )} />
            <span className={cn(
              "block h-[2px] rounded-full bg-current transition-all duration-300 origin-center",
              isSyllabusOpen ? "-rotate-45 -translate-y-[3px]" : ""
            )} />
          </div>
        </button>
      </div>
    </header>
  );
}
