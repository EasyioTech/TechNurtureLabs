'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    totalLessons: number;
    completedLessons: number;
}

export function CourseCard({ course }: { course: Course }) {
    const progress = course.totalLessons > 0
        ? (course.completedLessons / course.totalLessons) * 100
        : 0;

    // Generate a stable color based on the title
    const colors = [
        { accent: 'bg-indigo-600', text: 'text-indigo-600', ring: 'ring-indigo-100', border: 'hover:border-indigo-100', shadow: 'hover:shadow-indigo-500/5', badge: 'bg-indigo-505/10' },
        { accent: 'bg-emerald-600', text: 'text-emerald-600', ring: 'ring-emerald-100', border: 'hover:border-emerald-100', shadow: 'hover:shadow-emerald-500/5', badge: 'bg-emerald-500/10' },
        { accent: 'bg-rose-600', text: 'text-rose-600', ring: 'ring-rose-100', border: 'hover:border-rose-100', shadow: 'hover:shadow-rose-500/5', badge: 'bg-rose-500/10' },
        { accent: 'bg-amber-600', text: 'text-amber-600', ring: 'ring-amber-100', border: 'hover:border-amber-100', shadow: 'hover:shadow-amber-500/5', badge: 'bg-amber-500/10' },
        { accent: 'bg-sky-600', text: 'text-sky-600', ring: 'ring-sky-100', border: 'hover:border-sky-100', shadow: 'hover:shadow-sky-500/5', badge: 'bg-sky-500/10' },
        { accent: 'bg-violet-600', text: 'text-violet-600', ring: 'ring-violet-100', border: 'hover:border-violet-100', shadow: 'hover:shadow-violet-500/5', badge: 'bg-violet-500/10' },
    ];
    const hash = course.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const theme = colors[hash % colors.length];

    return (
        <Link href={`/student/course/${course.id}`}>
            <div className={`group bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden ${theme.border} hover:shadow-2xl ${theme.shadow} transition-all duration-300 h-full flex flex-col`}>
                <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100">
                    <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-4 left-4">
                        <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-sm border border-white/20">
                            {course.totalLessons} Lessons
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col">
                    <h4 className={`font-black text-xl text-slate-900 tracking-tight leading-tight group-hover:${theme.text} transition-colors duration-300 mb-2 uppercase leading-[0.9]`}>
                        {course.title}
                    </h4>
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium mb-6">
                        {course.description || 'Interactive lessons and practice exercises designed for deep learning.'}
                    </p>

                    <div className="mt-auto space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</span>
                                <span className="text-xs font-bold text-slate-700">{course.completedLessons} / {course.totalLessons} Completed</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 block">Progress</span>
                                <span className={`text-xs font-black ${theme.text}`}>{Math.round(progress)}%</span>
                            </div>
                        </div>

                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex p-0.5">
                            <div
                                className={`h-full ${theme.accent} rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${theme.accent}`} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ongoing</span>
                            </div>
                            <div className={`w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white group-hover:${theme.accent} transition-colors duration-300`}>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
