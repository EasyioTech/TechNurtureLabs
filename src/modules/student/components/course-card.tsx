'use client';

import React from 'react';
import { Play, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  totalLessons: number;
  completedLessons: number;
}

const COLOR_THEMES = [
  { accent: 'bg-indigo-600', text: 'text-indigo-600', bar: 'bg-indigo-600', glow: 'shadow-indigo-500/20', hoverBorder: 'hover:border-indigo-200', badge: 'bg-indigo-50 text-indigo-600' },
  { accent: 'bg-emerald-600', text: 'text-emerald-600', bar: 'bg-emerald-600', glow: 'shadow-emerald-500/20', hoverBorder: 'hover:border-emerald-200', badge: 'bg-emerald-50 text-emerald-600' },
  { accent: 'bg-rose-600', text: 'text-rose-600', bar: 'bg-rose-600', glow: 'shadow-rose-500/20', hoverBorder: 'hover:border-rose-200', badge: 'bg-rose-50 text-rose-600' },
  { accent: 'bg-amber-600', text: 'text-amber-600', bar: 'bg-amber-600', glow: 'shadow-amber-500/20', hoverBorder: 'hover:border-amber-200', badge: 'bg-amber-50 text-amber-600' },
  { accent: 'bg-sky-600', text: 'text-sky-600', bar: 'bg-sky-600', glow: 'shadow-sky-500/20', hoverBorder: 'hover:border-sky-200', badge: 'bg-sky-50 text-sky-600' },
  { accent: 'bg-violet-600', text: 'text-violet-600', bar: 'bg-violet-600', glow: 'shadow-violet-500/20', hoverBorder: 'hover:border-violet-200', badge: 'bg-violet-50 text-violet-600' },
];

export function CourseCard({ course }: { course: Course }) {
  const progress = course.totalLessons > 0
    ? (course.completedLessons / course.totalLessons) * 100
    : 0;
  const isComplete = progress === 100 && course.totalLessons > 0;

  const hash = course.title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const theme = COLOR_THEMES[hash % COLOR_THEMES.length];

  return (
    <Link href={`/student/course/${course.id}`} className="block h-full group">
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`bg-white border border-slate-100 rounded-2xl sm:rounded-3xl overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl ${theme.glow} ${theme.hoverBorder} active:scale-[0.98]`}
      >
        {/* ── Thumbnail ── */}
        <div className="relative h-44 sm:h-48 overflow-hidden bg-slate-100 flex-shrink-0">
          <img
            src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600'}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

          {/* Lesson count badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/25 rounded-full text-[9px] font-black text-white uppercase tracking-wider">
              {course.totalLessons} Lessons
            </span>
          </div>

          {/* Completion badge */}
          {isComplete && (
            <div className="absolute top-3 right-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 size={16} className="text-white" />
              </div>
            </div>
          )}

          {/* Play button */}
          {!isComplete && (
            <div className="absolute bottom-3 right-3">
              <div className={`w-9 h-9 rounded-full bg-white flex items-center justify-center ${theme.text} shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                <Play size={15} fill="currentColor" />
              </div>
            </div>
          )}

          {/* Progress bar at bottom of thumbnail */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div
                className={`h-full ${theme.bar} transition-all duration-700`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* ── Card body ── */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          <h4 className="font-black text-base sm:text-lg text-slate-900 tracking-tight leading-snug uppercase mb-1.5 line-clamp-2">
            {course.title}
          </h4>

          <p className="text-[11px] sm:text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4 flex-1">
            {course.description || 'A comprehensive learning path designed for academic excellence.'}
          </p>

          {/* Progress section */}
          <div className="mt-auto space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                <span className={`text-[10px] font-black ${theme.text}`}>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={`h-full ${theme.bar} rounded-full`}
                  transition={{ duration: 1.2, ease: 'circOut' }}
                />
              </div>
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500">
                  {course.completedLessons}
                  <span className="text-slate-300 mx-1">/</span>
                  {course.totalLessons}
                  <span className="text-slate-400 ml-1 font-medium text-[9px]">done</span>
                </span>
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${theme.text} group-hover:gap-2 transition-all`}>
                {isComplete ? 'Review' : progress > 0 ? 'Resume' : 'Start'}
                <ChevronRight size={13} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
