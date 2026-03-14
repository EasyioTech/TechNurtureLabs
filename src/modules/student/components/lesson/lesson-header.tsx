'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowLeft, Star, Menu, X, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <header className="sticky top-0 z-[120] bg-white/90 backdrop-blur-3xl border-b border-slate-100 shadow-sm h-20 sm:h-24 flex items-center justify-between px-4 sm:px-8 lg:px-16 transition-all duration-300">
      <div className="flex items-center gap-3 sm:gap-8 min-w-0">
        <Link href={`/student/course/${courseId}`}>
          <button className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border bg-white border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-all active:scale-95 group shadow-sm">
            <ArrowLeft size={24} strokeWidth={3} className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
        </Link>
        <div className="min-w-0 pr-4">
          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] mb-0.5 sm:mb-1.5 whitespace-nowrap opacity-60 text-indigo-600 truncate">
            {courseTitle}
          </p>
          <h1 className="text-sm sm:text-lg lg:text-xl font-black uppercase tracking-tight truncate max-w-[140px] sm:max-w-xl leading-none text-slate-950">
            {lessonTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <div className="hidden xs:flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border bg-amber-50 border-amber-100 text-amber-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-none shadow-sm">
          <Star size={16} fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
          <span className="opacity-80 hidden sm:inline">Reward:</span> +{xpReward} XP
        </div>
        
        <div className="w-px h-8 sm:h-10 bg-slate-100 hidden sm:block" />

        <button
          onClick={onToggleSyllabus}
          className={cn(
             "w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all active:scale-95 group shadow-lg",
             isSyllabusOpen 
                ? "bg-indigo-600 border-indigo-500 text-white shadow-indigo-200" 
                : "bg-white border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200"
          )}
        >
          {isSyllabusOpen ? (
            <X size={24} strokeWidth={2.5} className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform" />
          ) : (
            <Menu size={24} strokeWidth={2.5} className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>
    </header>
  );
}
