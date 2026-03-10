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
    schoolClasses?: { id: string; name: string }[];
}

export function SchoolCoursesTab({ courseMetrics, schoolClasses = [] }: CoursesTabProps) {
    const { isDark } = useSchoolTheme();
    const router = useRouter();
    const [selectedTab, setSelectedTab] = React.useState<string>('all');

    // Use actual school classes for tabs if available, otherwise fallback to ones from courses
    const classTabs = schoolClasses.length > 0
        ? schoolClasses.map(c => c.name).sort()
        : Array.from(new Set(
            courseMetrics.flatMap(c => (c.mapped_classes || []).filter(cls => cls !== 'All Classes'))
        )).sort();

    const displayedCourses = selectedTab === 'all'
        ? courseMetrics
        : courseMetrics.filter(c =>
            c.mapped_classes?.includes(selectedTab) ||
            c.mapped_classes?.includes('All Classes')
        );

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
        <div className="space-y-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedTab('all')}
                    className={`rounded-2xl h-10 px-6 text-[11px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${selectedTab === 'all'
                        ? ts.btnPrimary(isDark)
                        : `border ${ts.border(isDark)} ${isDark ? 'bg-white/5 text-slate-100 hover:bg-white/10' : 'bg-transparent text-slate-800 hover:bg-slate-50'}`
                        }`}
                >
                    All Courses
                </Button>

                {classTabs.length > 0 && (
                    <div className={`w-px h-6 mx-2 ${ts.divider(isDark)}`} />
                )}

                {classTabs.map(cls => (
                    <Button
                        key={cls}
                        variant="ghost"
                        onClick={() => setSelectedTab(cls)}
                        className={`rounded-2xl h-10 px-5 text-[11px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${selectedTab === cls
                            ? ts.btnPrimary(isDark)
                            : `border ${ts.border(isDark)} ${isDark ? 'bg-white/5 text-slate-100 hover:bg-white/10' : 'bg-transparent text-slate-800 hover:bg-slate-50'}`
                            }`}
                    >
                        {cls}
                    </Button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {displayedCourses.map((course, i) => (
                    <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`group relative rounded-[32px] overflow-hidden border transition-all duration-300 hover:-translate-y-2 flex flex-col ${ts.card(isDark)}`}>

                        {/* Course Image */}
                        <div className="aspect-[16/10] relative overflow-hidden flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f1a] to-transparent z-10 opacity-60" />
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
                        <div className="p-8 flex flex-col flex-1">
                            {course.mapped_classes && course.mapped_classes.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    {course.mapped_classes.slice(0, 3).map(cls => (
                                        <Badge key={cls} className={`px-2.5 py-0.5 rounded-full border-0 text-[9px] font-black tracking-widest uppercase ${ts.accentSoft(isDark)}`}>
                                            {cls}
                                        </Badge>
                                    ))}
                                    {course.mapped_classes.length > 3 && (
                                        <Badge className={`px-2.5 py-0.5 rounded-full border-0 text-[9px] font-black tracking-widest uppercase ${ts.accentSoft(isDark)}`}>
                                            +{course.mapped_classes.length - 3} MORE
                                        </Badge>
                                    )}
                                </div>
                            )}

                            <h3 className={`text-xl font-black tracking-tight mb-3 group-hover:text-indigo-500 transition-colors line-clamp-2 ${ts.textPrimary(isDark)}`}>
                                {course.title}
                            </h3>

                            {course.description && (
                                <p className={`text-[13px] font-medium leading-relaxed mb-6 line-clamp-3 ${ts.textMuted(isDark)}`}>
                                    {course.description}
                                </p>
                            )}

                            <div className={`flex items-center gap-6 mb-2 p-4 rounded-2xl mt-auto ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Enrolled</span>
                                    <span className={`text-[16px] font-black ${ts.textPrimary(isDark)}`}>{course.enrolled_count.toLocaleString()}</span>
                                </div>
                                <div className={`w-px h-8 ${ts.divider(isDark)}`} />
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Lessons</span>
                                    <span className={`text-[16px] font-black ${ts.textPrimary(isDark)}`}>{course.lesson_count}</span>
                                </div>
                                <div className={`w-px h-8 ${ts.divider(isDark)}`} />
                                <div className="flex flex-col flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Avg Comp.</span>
                                        <span className={`text-[11px] font-black ${ts.textPrimary(isDark)}`}>{course.completion_rate}%</span>
                                    </div>
                                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.completion_rate}%` }}
                                            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                            className="h-full bg-indigo-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
