'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SchoolCourseMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { BarChart3, TrendingUp, Clock, Target, Zap, ChevronRight, FileText, FileDown, ExternalLink, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ReportsTabProps { courseMetrics: SchoolCourseMetric[]; }

export function SchoolReportsTab({ courseMetrics }: ReportsTabProps) {
    const { isDark } = useSchoolTheme();
    const router = useRouter();

    const totals = {
        enrollment: courseMetrics.reduce((acc, c) => acc + c.enrolled_count, 0),
        avgCompletion: Math.round(courseMetrics.reduce((acc, c) => acc + c.completion_rate, 0) / (courseMetrics.length || 1)),
        totalTime: courseMetrics.reduce((acc, c) => acc + c.total_time_mins, 0),
    };

    const handleDownload = () => {
        const headers = ['Course Title', 'Enrollments', 'Completion %', 'Avg XP', 'Time (Mins)'];
        const rows = courseMetrics.map(c => [
            c.title,
            c.enrolled_count,
            c.completion_rate,
            c.avg_xp,
            c.total_time_mins
        ].map(v => `"${v}"`).join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `course_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Course report exported successfully');
    };

    if (courseMetrics.length === 0) {
        return (
            <div className={`rounded-[32px] border py-24 text-center ${ts.card(isDark)}`}>
                <div className={`w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <FileText size={32} className={ts.textMuted(isDark)} />
                </div>
                <h4 className={`text-xl font-black mb-1 ${ts.textPrimary(isDark)}`}>No Reports Available</h4>
                <p className={`text-[13px] font-bold ${ts.textMuted(isDark)}`}>Course performance data will appear here once students start engaging.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Enrolled', value: totals.enrollment.toLocaleString(), sub: 'Across all courses', icon: Users, color: 'indigo' },
                    { label: 'Avg Completion', value: `${totals.avgCompletion}%`, sub: 'Engagement rate', icon: Target, color: 'emerald' },
                    { label: 'Learning Time', value: `${totals.totalTime.toLocaleString()}m`, sub: 'Total minutes logged', icon: Clock, color: 'amber' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-8 rounded-[32px] border ${ts.card(isDark)} relative overflow-hidden group hover:-translate-y-1.5 transition-all duration-500`}
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700`} />
                        <div className="flex flex-col gap-6 relative">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5 border border-white/5 shadow-xl shadow-black/10' : 'bg-slate-50 border border-slate-200/50 shadow-sm'}`}>
                                <stat.icon size={24} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className={`text-[11px] font-black uppercase tracking-widest leading-none mb-2 ${ts.textMuted(isDark)}`}>{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className={`text-3xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>{stat.value}</p>
                                </div>
                                <p className={`text-[12px] font-bold mt-2 ${ts.textSecondary(isDark)} opacity-60`}>{stat.sub}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── List Section ── */}
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className={`font-black text-xl tracking-tight ${ts.textPrimary(isDark)}`}>Course Insights</h3>
                        <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>Metrics for your active curriculum</p>
                    </div>
                    <Button
                        onClick={handleDownload}
                        variant="ghost"
                        className={`rounded-2xl h-12 px-6 font-black text-[13px] border ${isDark ? 'bg-white/5 text-slate-100 border-white/10 hover:bg-white/10' : 'bg-transparent text-slate-800 border-slate-200 hover:bg-slate-50'}`}>
                        <FileDown size={16} className="mr-2" />
                        Export Data
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {courseMetrics.map((c, i) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                            className={`group relative p-8 rounded-[40px] border transition-all duration-700 ${ts.card(isDark)} hover:shadow-[0_32px_64px_-16px_rgba(79,70,229,0.12)] hover:border-indigo-500/30 hover:-translate-y-1.5`}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-10">
                                {/* Course Info */}
                                <div className="flex items-center gap-6 lg:w-[35%] min-w-0">
                                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-indigo-500 font-black flex-shrink-0 border-2 shadow-2xl transition-transform group-hover:scale-110 duration-500 ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                                        <div className="relative">
                                            <BarChart3 size={28} strokeWidth={2.5} />
                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white dark:border-[#161921] shadow-xl" />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h4 className={`font-black text-xl tracking-tighter truncate leading-none ${ts.textPrimary(isDark)}`}>{c.title}</h4>
                                            <Badge className={`px-2.5 py-0.5 rounded-lg border-0 text-[9px] font-black tracking-[0.2em] shadow-sm ${c.is_published ? ts.live(isDark) : ts.draft(isDark)}`}>
                                                {c.is_published ? 'LIVE' : 'DRAFT'}
                                            </Badge>
                                        </div>
                                        <p className={`text-[11px] font-black uppercase tracking-widest ${ts.textMuted(isDark)} opacity-60`}>Curriculum Analytics • Last Synced 1h ago</p>
                                    </div>
                                </div>
                                {/* Metrics Row */}
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-10 items-center border-t lg:border-t-0 lg:border-l lg:pl-10 pt-8 lg:pt-0 dark:border-white/5 border-slate-100">
                                    <div className="space-y-2">
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none ${ts.textMuted(isDark)}`}>Enrollment</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className={`text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>{c.enrolled_count.toLocaleString()}</p>
                                            <TrendingUp size={14} className="text-emerald-500 mb-0.5" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none ${ts.textMuted(isDark)}`}>Engagement</p>
                                        <div className="flex items-center gap-3">
                                            <p className={`text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>{c.completion_rate}%</p>
                                            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100 shadow-inner'}`}>
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${c.completion_rate}%` }}
                                                    transition={{ duration: 1.5, ease: "circOut" }}
                                                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.3)]" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none ${ts.textMuted(isDark)}`}>Avg Mastery</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <Zap size={16} className="text-amber-500" fill="currentColor" />
                                                <p className={`text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>{c.avg_xp}</p>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>XP</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-right lg:text-left">
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none ${ts.textMuted(isDark)}`}>Interaction</p>
                                        <div className="flex items-center gap-2 justify-end lg:justify-start">
                                            <p className={`text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>{Math.round(c.total_time_mins / 60)}h</p>
                                            <Clock size={16} className="text-slate-400 opacity-60" />
                                        </div>
                                    </div>
                                </div>
                                {/* Action */}
                                <div className="flex items-center justify-end">
                                    <Button
                                        onClick={() => router.push(`/school-admin/course/${c.id}`)}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${isDark ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-600/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm'}`}
                                    >
                                        <ChevronRight size={20} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
