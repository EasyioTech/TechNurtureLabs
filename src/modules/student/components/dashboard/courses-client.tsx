'use client';

import React, { useState } from 'react';
import { BookOpen, Search, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CourseCard } from '@/modules/student/components/course-card';
import Link from 'next/link';

interface CoursesClientProps {
  initialData: {
    courses: any[];
  }
}

export function CoursesClient({ initialData }: CoursesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const allCourses = initialData.courses || [];

  const courses = allCourses.filter((c: any) => {
    const matchesSearch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const completed = c.completedLessons || 0;
    const total = c.totalLessons || 0;
    let matchesFilter = true;
    if (filter === 'active') matchesFilter = completed < total || total === 0;
    else if (filter === 'completed') matchesFilter = completed === total && total > 0;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    all: allCourses.length,
    active: allCourses.filter((c: any) => (c.completedLessons || 0) < (c.totalLessons || 0)).length,
    completed: allCourses.filter((c: any) => (c.totalLessons > 0) && (c.completedLessons || 0) === (c.totalLessons || 0)).length,
  };

  return (
    <div className="min-h-screen bg-slate-50/20 pb-24 lg:pb-10 animate-in fade-in duration-500">

      {/* ─── Header ─── */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-12 pt-5 pb-0 sm:pt-8">
        <div className="max-w-[1440px] mx-auto">
          {/* Title row */}
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <BookOpen size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em] leading-none">Course Library</p>
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                  All <span className="text-indigo-600">Courses</span>
                </h1>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">
              {allCourses.length} Total
            </span>
          </div>

          {/* Search bar */}
          <div className="relative mb-4 sm:mb-5 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <FilterTab
                key={f}
                active={filter === f}
                label={f === 'all' ? 'All' : f === 'active' ? 'In Progress' : 'Completed'}
                count={counts[f]}
                onClick={() => setFilter(f)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Grid ─── */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-5 sm:py-8">
        <AnimatePresence mode="wait">
          {courses.length > 0 ? (
            <motion.div
              key={filter + searchQuery}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            >
              {courses.map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 sm:py-32 text-center bg-white rounded-3xl border border-slate-100 shadow-lg"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                <Book size={36} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">No Courses Found</h2>
              <p className="text-slate-400 font-medium text-sm mb-8 max-w-xs">Nothing matched your search. Try a different keyword or filter.</p>
              <Link href="/student">
                <button className="h-12 px-8 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                  Back to Home
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function FilterTab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 sm:px-4 py-3 whitespace-nowrap transition-all text-[10px] sm:text-[11px] font-black uppercase tracking-widest border-b-2 ${
        active ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
      }`}
    >
      {label}
      <span
        className={`px-2 py-0.5 rounded-full text-[9px] font-black transition-all ${
          active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
        }`}
      >
        {count}
      </span>
      {active && (
        <motion.div
          layoutId="activeTabCourses"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}
