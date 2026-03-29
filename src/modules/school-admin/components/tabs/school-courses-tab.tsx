'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SchoolCourseMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { BookOpen, Users, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { handleThumbnailError } from '@/lib/media-client';

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
                    className={`rounded-2xl h-12 px-8 text-[12px] font-black tracking-widest uppercase transition-all whitespace-nowrap border-2 ${selectedTab === 'all'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                        : `border-transparent ${isDark ? 'text-slate-400 hover:text-indigo-400 hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`
                        }`}
                >
                    All Courses
                </Button>

                {classTabs.length > 0 && (
                    <div className={`w-px h-8 mx-2 ${ts.divider(isDark)}`} />
                )}

                {classTabs.map(cls => (
                    <Button
                        key={cls}
                        variant="ghost"
                        onClick={() => setSelectedTab(cls)}
                        className={`rounded-2xl h-12 px-7 text-[12px] font-black tracking-widest uppercase transition-all whitespace-nowrap border-2 ${selectedTab === cls
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                            : `border-transparent ${isDark ? 'text-slate-400 hover:text-indigo-400 hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`
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
                        className={`group relative rounded-[40px] overflow-hidden border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col ${ts.card(isDark)}`}>

                        {/* Course Image */}
                        <div className="aspect-[16/10] relative overflow-hidden flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f1a]/80 to-transparent z-10 opacity-60" />
                            {course.thumbnail_url ? (
                                <img src={course.thumbnail_url} alt={course.title} decoding="async" onError={handleThumbnailError} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                    <BookOpen size={48} className="text-indigo-500/30" strokeWidth={1.5} />
                                </div>
                            )}
                            <Badge className={`absolute top-5 right-5 z-20 px-3.5 py-1 rounded-lg border-0 text-[10px] font-black tracking-widest ${course.is_published ? ts.live(isDark) : ts.draft(isDark)
                                }`}>
                                {course.is_published ? '● PUBLISHED' : 'DRAFT'}
                            </Badge>
                        </div>

                        {/* Content */}
                        <div className="p-8 flex flex-col flex-1">
                            {course.mapped_classes && course.mapped_classes.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mb-5">
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

                            <h3 className={`text-[19px] font-black tracking-tight mb-3 group-hover:text-indigo-500 transition-colors line-clamp-2 leading-tight ${ts.textPrimary(isDark)}`}>
                                {course.title}
                            </h3>

                            {course.description && (
                                <p className={`text-[13px] font-medium leading-relaxed mb-8 line-clamp-3 ${ts.textMuted(isDark)}`}>
                                    {course.description}
                                </p>
                            )}

                            <div className={`p-6 rounded-[24px] mt-auto grid grid-cols-3 gap-4 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200/50'}`}>
                                <div className="space-y-1">
                                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${ts.textPrimary(isDark)}`}>Users</p>
                                    <p className={`text-[15px] font-black leading-none ${ts.textPrimary(isDark)}`}>{course.enrolled_count.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${ts.textPrimary(isDark)}`}>Status</p>
                                    <p className={`text-[15px] font-black leading-none ${ts.textPrimary(isDark)}`}>{course.lesson_count} Mod</p>
                                </div>
                                <div className="space-y-2">
                                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${ts.textPrimary(isDark)}`}>Comp.</p>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-[15px] font-black leading-none ${ts.textPrimary(isDark)}`}>{course.completion_rate}%</p>
                                    </div>
                                    <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.completion_rate}%` }}
                                            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                            className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/school-admin/course/${course.id}`)}
                                className={`w-full mt-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-black transition-all border ${isDark ? 'bg-white/5 border-white/5 text-indigo-400 hover:bg-indigo-500 hover:text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                            >
                                VIEW INSIGHTS
                                <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
