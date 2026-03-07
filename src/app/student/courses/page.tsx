'use client';

import React, { useState, useEffect } from 'react';
import {
    BookOpen, Search, Filter, Book, Clock,
    ArrowRight, ChevronRight, LayoutGrid, List
} from 'lucide-react';
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
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
        const completed = c.completedLessons || 0;
        const total = c.totalLessons || 1;

        let matchesFilter = true;
        if (filter === 'active') {
            matchesFilter = completed > 0 && completed < total;
        } else if (filter === 'completed') {
            matchesFilter = completed === total;
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
            <div className="bg-white border-b border-slate-100 px-6 lg:px-12 py-12">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-3">My Library</p>
                            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">My Courses</h1>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="SEARCH COURSES..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 h-14 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                                />
                            </div>
                            <Button className="h-14 px-6 rounded-2xl bg-slate-950 text-white border-0 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-900 transition-all">
                                <Filter size={16} /> Filter
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 mt-12 pb-2 overflow-x-auto no-scrollbar">
                        <FilterTab active={filter === 'all'} label="All Courses" count={(data?.courses || []).length} onClick={() => setFilter('all')} />
                        <FilterTab active={filter === 'active'} label="In Progress" count={(data?.courses || []).filter((c: any) => (c.completedLessons || 0) > 0 && (c.completedLessons || 0) < (c.totalLessons || 1)).length} onClick={() => setFilter('active')} />
                        <FilterTab active={filter === 'completed'} label="Completed" count={(data?.courses || []).filter((c: any) => (c.completedLessons || 0) === (c.totalLessons || 1)).length} onClick={() => setFilter('completed')} />
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
            className={`flex items-center gap-3 whitespace-nowrap pb-4 border-b-2 transition-all ${active ? 'border-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
            <span className={`text-[10px] font-black uppercase tracking-widest`}>{label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
            </span>
        </button>
    );
}
