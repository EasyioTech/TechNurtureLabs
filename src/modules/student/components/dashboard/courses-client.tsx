'use client';

import React, { useState } from 'react';
import {
    BookOpen, Search, Filter, Book,
    ArrowRight, LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CourseCard } from '@/modules/student/components/course-card';
import { Button } from '@/components/ui/button';
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
        if (filter === 'active') {
            matchesFilter = (completed < total) || (total === 0);
        } else if (filter === 'completed') {
            matchesFilter = completed === total && total > 0;
        }

        return matchesSearch && matchesFilter;
    });

    const counts = {
        all: allCourses.length,
        active: allCourses.filter((c: any) => (c.completedLessons || 0) < (c.totalLessons || 0)).length,
        completed: allCourses.filter((c: any) => (c.totalLessons > 0) && (c.completedLessons || 0) === (c.totalLessons || 0)).length
    };

    return (
        <div className="min-h-screen bg-slate-50/10 pb-20 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-100 px-6 lg:px-12 py-10 lg:py-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="max-w-[1440px] mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                                    <BookOpen size={18} />
                                </div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Course Library</p>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6">
                                All <span className="text-indigo-600">Courses</span>
                            </h1>
                            <p className="text-slate-500 font-bold text-xs lg:text-sm uppercase tracking-widest leading-relaxed">
                                Access all your courses and track your learning progress in one place.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                            <div className="relative w-full sm:w-[350px] group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="SEARCH COURSES..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 h-14 bg-slate-50 border border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-[0.15em] focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all outline-none shadow-sm placeholder:text-slate-300"
                                />
                            </div>
                            <Button className="h-14 px-8 rounded-3xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl active:scale-95 group">
                                <Filter size={18} className="group-hover:rotate-180 transition-transform duration-700" /> Filter
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-10 mt-12 lg:mt-16 pb-1 overflow-x-auto no-scrollbar border-b border-slate-100">
                        <FilterTab active={filter === 'all'} label="All Courses" count={counts.all} onClick={() => setFilter('all')} />
                        <FilterTab active={filter === 'active'} label="In Progress" count={counts.active} onClick={() => setFilter('active')} />
                        <FilterTab active={filter === 'completed'} label="Completed" count={counts.completed} onClick={() => setFilter('completed')} />
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
                <AnimatePresence mode="wait">
                    {courses.length > 0 ? (
                        <motion.div 
                            key={filter + searchQuery}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
                        >
                            {courses.map((course: any) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-40 text-center bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/20"
                        >
                            <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-10 border border-slate-100 shadow-inner">
                                <Book size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight mb-6 leading-none">No Courses Found</h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mb-12">No courses match your current search.</p>
                            <Link href="/student">
                                <Button className="h-16 px-12 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 shadow-2xl shadow-indigo-200 active:scale-95">
                                    Back to Home
                                </Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function FilterTab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 whitespace-nowrap pb-6 border-b-2 transition-all relative group ${active ? 'border-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${active ? 'text-slate-900' : 'group-hover:text-slate-700'}`}>{label}</span>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'}`}>
                {count}
            </span>
            {active && (
                <motion.div
                    layoutId="activeTabLibrary"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            )}
        </button>
    );
}
