'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SchoolCourseMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { BookOpen, Users, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface CoursesTabProps {
    courseMetrics: SchoolCourseMetric[];
}

export function SchoolCoursesTab({ courseMetrics }: CoursesTabProps) {
    const { isDark } = useSchoolTheme();
    const router = useRouter();

    if (courseMetrics.length === 0) {
        return (
            <div className={`rounded-[32px] border py-24 text-center ${ts.card(isDark)}`}>
                <div className={`w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <BookOpen size={32} className={ts.textMuted(isDark)} />
                </div>
                <h4 className={`text-xl font-black mb-1 ${ts.textPrimary(isDark)}`}>No Courses Registered</h4>
                <p className={`text-[13px] font-bold ${ts.textMuted(isDark)}`}>Courses will appear here once they are assigned to students.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {courseMetrics.map((course, i) => (
                    <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`group relative rounded-[32px] overflow-hidden border transition-all duration-300 hover:-translate-y-2 ${ts.card(isDark)}`}>

                        {/* Course Image */}
                        <div className="aspect-[16/10] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                            {course.thumbnail_url ? (
                                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                    <BookOpen size={48} className="text-indigo-500/30" />
                                </div>
                            )}
                            <Badge className={`absolute top-4 right-4 z-20 px-3 py-1 rounded-full border-0 text-[10px] font-black ${course.is_published ? ts.live(isDark) : ts.draft(isDark)
                                }`}>
                                {course.is_published ? 'PUBLISHED' : 'DRAFT'}
                            </Badge>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <h3 className={`text-xl font-black tracking-tight mb-3 group-hover:text-indigo-500 transition-colors line-clamp-1 ${ts.textPrimary(isDark)}`}>
                                {course.title}
                            </h3>

                            <div className={`flex items-center gap-6 mb-8 p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Enrolled</span>
                                    <span className={`text-[16px] font-black ${ts.textPrimary(isDark)}`}>{course.enrolled_count.toLocaleString()}</span>
                                </div>
                                <div className={`w-px h-8 ${ts.divider(isDark)}`} />
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Lessons</span>
                                    <span className={`text-[16px] font-black ${ts.textPrimary(isDark)}`}>{course.lesson_count}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Completion</span>
                                        <span className={`text-[12px] font-black ${ts.textPrimary(isDark)}`}>{course.completion_rate}%</span>
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.completion_rate}%` }}
                                            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                            className="h-full bg-indigo-500 rounded-full"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={() => router.push(`/school-admin/course/${course.id}`)}
                                    className={`w-full rounded-2xl h-12 font-black text-[13px] ${ts.btnOutline(isDark)} group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500`}>
                                    View Details
                                    <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
