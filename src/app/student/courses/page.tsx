'use client';

import React, { useState, useEffect } from 'react';
import {
    BookOpen, Search, Filter, Book, Clock,
    ArrowRight, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getStudentDashboardData } from '@/modules/student/actions';
import { CourseCard } from '@/modules/student/components/course-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function MyCoursesPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        async function load() {
            const result = await getStudentDashboardData();
            setData(result);
            setLoading(false);
        }
        load();
    }, []);

    const courses = (data?.courses || []).filter((c: any) => {
        const matchesSearch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        const completed = c.completedLessons || 0;
        const total = c.totalLessons || 0;

        let matchesFilter = true;
        if (filter === 'active') {
            // Include those started but not finished, or even not started yet but are in library
            matchesFilter = (completed < total) || (total === 0);
        } else if (filter === 'completed') {
            matchesFilter = completed === total && total > 0;
        }

        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="p-8 lg:p-12 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-64" />
                    </div>
                    <Skeleton className="h-12 w-full md:w-80 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-[3rem]" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/30 pb-20">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-100 px-6 lg:px-12 py-16 lg:py-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <BookOpen size={16} />
                                </div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">My Collection</p>
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none">Learning <span className="text-indigo-600">Library</span></h1>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-6">Manage your curriculum and track your academic progress</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative w-full sm:w-96 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search library..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-14 pr-6 h-16 bg-slate-50 border border-slate-100 rounded-3xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <button className="h-16 px-8 rounded-3xl bg-slate-950 text-white font-black uppercase tracking-widest text-[11px] flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 group">
                                <Filter size={18} className="group-hover:rotate-180 transition-transform duration-500" /> Filter Options
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 mt-16 lg:mt-24 pb-2 overflow-x-auto no-scrollbar">
                        <FilterTab active={filter === 'all'} label="Everything" count={(data?.courses || []).length} onClick={() => setFilter('all')} />
                        <FilterTab active={filter === 'active'} label="In Progress" count={(data?.courses || []).filter((c: any) => (c.completedLessons || 0) < (c.totalLessons || 0)).length} onClick={() => setFilter('active')} />
                        <FilterTab active={filter === 'completed'} label="Completed" count={(data?.courses || []).filter((c: any) => (c.totalLessons > 0) && (c.completedLessons || 0) === (c.totalLessons || 0)).length} onClick={() => setFilter('completed')} />
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course: any) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-100">
                            <Book size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 leading-none">No courses found</h2>
                        <Link href="/student">
                            <Button className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-xl shadow-indigo-200">
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}

function FilterTab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 whitespace-nowrap pb-6 border-b-2 transition-all relative ${active ? 'border-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
            <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${active ? 'text-slate-900' : ''}`}>{label}</span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-colors ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                {count}
            </span>
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                    initial={false}
                />
            )}
        </button>
    );
}
