import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SchoolCourseMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { BookOpen, BarChart3 } from 'lucide-react';
import { handleThumbnailError } from '@/lib/media-client';

interface CoursesTabProps {
    courseMetrics: SchoolCourseMetric[];
    schoolClasses?: { id: string; name: string }[];
}

export function SchoolCoursesTab({ courseMetrics, schoolClasses = [] }: CoursesTabProps) {
    const { isDark } = useSchoolTheme();
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

    // Calculate course counts per class for badges
    const courseCountPerClass = classTabs.reduce((acc, cls) => {
        acc[cls] = courseMetrics.filter(c =>
            c.mapped_classes?.includes(cls) ||
            c.mapped_classes?.includes('All Classes')
        ).length;
        return acc;
    }, {} as Record<string, number>);

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
            {/* ─── Page Header Banner ─── */}
            <div className={`rounded-[28px] border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${ts.card(isDark)}`}>
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-600/20">
                        <BookOpen size={28} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${ts.textPrimary(isDark)}`}>
                            Courses
                        </h2>
                        <p className={`text-[13px] font-semibold mt-2 ${ts.textSecondary(isDark)}`}>
                            Manage and track all courses assigned to your school
                        </p>
                    </div>
                </div>
                <div className={`rounded-full px-4 py-2.5 flex items-center gap-2 flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <BarChart3 size={16} className="text-indigo-500" />
                    <span className={`text-[12px] font-black tracking-widest uppercase ${ts.textPrimary(isDark)}`}>
                        {courseMetrics.length} Total
                    </span>
                </div>
            </div>

            {/* ─── Class Filter Chips ─── */}
            <div className={`flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0`}>
                <FilterChip
                    label="All Courses"
                    count={courseMetrics.length}
                    isActive={selectedTab === 'all'}
                    onClick={() => setSelectedTab('all')}
                    isDark={isDark}
                />

                {classTabs.length > 0 && (
                    <div className={`w-px h-6 flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                )}

                {classTabs.map(cls => (
                    <FilterChip
                        key={cls}
                        label={cls}
                        count={courseCountPerClass[cls]}
                        isActive={selectedTab === cls}
                        onClick={() => setSelectedTab(cls)}
                        isDark={isDark}
                    />
                ))}
            </div>

            {/* ─── Courses Grid ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 xl:gap-8">
                {displayedCourses.map((course) => (
                    <div
                        key={course.id}
                        className={`group relative rounded-[28px] overflow-hidden border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 flex flex-col ${ts.card(isDark)}`}>

                        {/* Course Image */}
                        <div className="aspect-[16/9] relative overflow-hidden flex-shrink-0 sm:aspect-[16/10]">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f1a]/80 to-transparent z-10 opacity-60" />
                            {course.thumbnail_url ? (
                                <img src={course.thumbnail_url} alt={course.title} decoding="async" onError={handleThumbnailError} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                    <BookOpen size={48} className="text-indigo-500/30" strokeWidth={1.5} />
                                </div>
                            )}
                            <Badge className={`absolute top-4 right-4 z-20 px-3 py-1 rounded-lg border-0 text-[10px] font-black tracking-widest ${course.is_published ? ts.live(isDark) : ts.draft(isDark)
                                }`}>
                                {course.is_published ? '● PUBLISHED' : 'DRAFT'}
                            </Badge>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col flex-1">
                            {/* Class Badges */}
                            {course.mapped_classes && course.mapped_classes.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    {course.mapped_classes.slice(0, 2).map(cls => (
                                        <Badge key={cls} className={`px-3 py-1 rounded-lg border-0 text-[10px] font-black tracking-widest uppercase ${ts.accentSoft(isDark)}`}>
                                            {cls}
                                        </Badge>
                                    ))}
                                    {course.mapped_classes.length > 2 && (
                                        <Badge className={`px-3 py-1 rounded-lg border-0 text-[10px] font-black tracking-widest uppercase ${ts.accentSoft(isDark)}`}>
                                            +{course.mapped_classes.length - 2} Class
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {/* Title - Larger and More Prominent */}
                            <h3 className={`text-[20px] sm:text-[22px] font-black tracking-tight mb-3 transition-colors line-clamp-2 leading-snug ${ts.textPrimary(isDark)}`}>
                                {course.title}
                            </h3>

                            {/* Description */}
                            {course.description && (
                                <p className={`text-[13px] font-medium leading-relaxed mb-6 line-clamp-3 ${ts.textSecondary(isDark)}`}>
                                    {course.description}
                                </p>
                            )}

                            {/* Stats Grid - Enhanced */}
                            <div className={`p-6 rounded-[24px] mt-auto grid grid-cols-1 gap-4 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${ts.textPrimary(isDark)}`}>Enrollment</p>
                                        <p className={`text-[18px] font-black leading-none ${ts.textPrimary(isDark)}`}>{course.enrolled_count.toLocaleString()} students</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${ts.textPrimary(isDark)}`}>Content</p>
                                        <p className={`text-[18px] font-black leading-none ${ts.textPrimary(isDark)}`}>{course.lesson_count} lessons</p>
                                    </div>
                                </div>
                                
                                <div className="pt-3 border-t border-slate-200/40 dark:border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${ts.textPrimary(isDark)}`}>Average Progress</p>
                                        <p className={`text-[14px] font-black text-indigo-500`}>{course.completion_rate}%</p>
                                    </div>
                                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-200/50'}`}>
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${course.completion_rate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * FilterChip component — a reusable pill/chip for class filtering
 */
function FilterChip({
    label,
    count,
    isActive,
    onClick,
    isDark,
}: {
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
    isDark: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all border text-[11px] sm:text-[12px] font-black tracking-widest uppercase flex-shrink-0 ${
                isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                    : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} ${ts.card(isDark)}`
            }`}
        >
            {label}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ml-1 ${
                isActive
                    ? 'bg-white/20 text-white'
                    : `${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`
            }`}>
                {count}
            </span>
        </button>
    );
}
