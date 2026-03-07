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

    return (
        <Link href={`/student/course/${course.id}`}>
            <div className="group bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 h-full flex flex-col">
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
                    <h4 className="font-black text-xl text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors duration-300 mb-2 uppercase leading-[0.9]">
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
                                <span className="text-xs font-black text-indigo-600">{Math.round(progress)}%</span>
                            </div>
                        </div>

                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex p-0.5">
                            <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ongoing</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white group-hover:bg-indigo-600 transition-colors duration-300">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
