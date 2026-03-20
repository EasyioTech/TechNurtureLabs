'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ChevronRight, BookOpen, Clock, Star, Zap, Activity } from 'lucide-react';
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

export function CourseCard({ course }: { course: Course }) {
    const progress = course.totalLessons > 0
        ? (course.completedLessons / course.totalLessons) * 100
        : 0;

    // Tactical Color Spectrum Matrix
    const colors = [
        { accent: 'bg-indigo-600', text: 'text-indigo-600', border: 'hover:border-indigo-200', shadow: 'hover:shadow-indigo-500/10', glow: 'shadow-indigo-500/20' },
        { accent: 'bg-emerald-600', text: 'text-emerald-600', border: 'hover:border-emerald-200', shadow: 'hover:shadow-emerald-500/10', glow: 'shadow-emerald-500/20' },
        { accent: 'bg-rose-600', text: 'text-rose-600', border: 'hover:border-rose-200', shadow: 'hover:shadow-rose-500/10', glow: 'shadow-rose-500/20' },
        { accent: 'bg-amber-600', text: 'text-amber-600', border: 'hover:border-amber-200', shadow: 'hover:shadow-amber-500/10', glow: 'shadow-amber-500/20' },
        { accent: 'bg-sky-600', text: 'text-sky-600', border: 'hover:border-sky-200', shadow: 'hover:shadow-sky-500/10', glow: 'shadow-sky-500/20' },
        { accent: 'bg-violet-600', text: 'text-violet-600', border: 'hover:border-violet-200', shadow: 'hover:shadow-violet-500/10', glow: 'shadow-violet-500/20' },
    ];
    
    const hash = course.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const theme = colors[hash % colors.length];

    return (
        <Link href={`/student/course/${course.id}`} className="block h-full group">
            <motion.div 
                whileHover={{ y: -4 }}
                className={`bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden transition-all duration-500 h-full flex flex-col ${theme.shadow} hover:shadow-xl`}
            >
                {/* Course Thumbnail */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-[1500ms] ease-out"
                    />
                    
                    {/* Tactical Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-4 left-4">
                        <div className="px-4 py-1.5 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em] shadow-2xl">
                            {course.totalLessons} Lessons
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-4">
                        <div className={`w-9 h-9 rounded-full bg-white flex items-center justify-center ${theme.text} shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                            <Play size={16} fill="currentColor" />
                        </div>
                    </div>
                </div>

                {/* Course Info */}
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-black text-lg text-slate-950 tracking-tighter leading-[0.95] uppercase transition-colors duration-500`}>
                            {course.title}
                        </h4>
                    </div>

                    <p className="text-[10px] text-slate-500/80 font-bold uppercase tracking-wider line-clamp-2 leading-relaxed mb-5 opacity-80">
                        {course.description || 'A comprehensive learning path designed for academic excellence.'}
                    </p>

                    <div className="mt-auto space-y-6">
                        {/* Learning Progress */}
                        <div>
                            <div className="flex items-end justify-between mb-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Course Progress</span>
                                <span className={`text-xs font-black ${theme.text}`}>{Math.round(progress)}% Complete</span>
                            </div>

                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50 shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className={`h-full ${theme.accent} rounded-full ${theme.glow} shadow-lg shadow-indigo-500/20`}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Finished</span>
                                    <span className="text-[9px] font-black text-slate-900">{course.completedLessons} / {course.totalLessons}</span>
                                </div>
                                <div className="w-px h-5 bg-slate-100" />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Level</span>
                                    <span className="text-[9px] font-black text-indigo-600">Standard</span>
                                </div>
                            </div>

                            <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.3em] ${theme.text} group-hover:translate-x-1 transition-transform duration-500`}>
                                View <ChevronRight size={12} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
