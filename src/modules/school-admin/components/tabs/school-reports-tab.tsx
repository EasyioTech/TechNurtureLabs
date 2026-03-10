'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SchoolCourseMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { BarChart3, TrendingUp, Clock, Target, Zap, ChevronRight, FileText, FileDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ReportsTabProps { courseMetrics: SchoolCourseMetric[]; }

export function SchoolReportsTab({ courseMetrics }: ReportsTabProps) {
    const { isDark } = useSchoolTheme();
    const router = useRouter();

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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-[32px] border overflow-hidden ${ts.card(isDark)}`}>

                {/* Header */}
                <div className={`px-8 py-8 border-b ${ts.border(isDark)} flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-slate-500/[0.01]`}>
                    <div className="flex-1">
                        <h3 className={`font-black text-2xl tracking-tight mb-1 ${ts.textPrimary(isDark)}`}>Performance Analytics</h3>
                        <p className={`text-[13px] font-bold ${ts.textMuted(isDark)}`}>Detailed metrics across {courseMetrics.length} active courses</p>
                    </div>
                    <Button
                        onClick={handleDownload}
                        variant="ghost"
                        className={`rounded-2xl h-12 px-6 font-black text-[13px] border ${isDark ? 'bg-white/5 text-slate-100 border-white/10 hover:bg-white/10' : 'bg-transparent text-slate-800 border-slate-200 hover:bg-slate-50'}`}>
                        <FileDown size={16} className="mr-2" />
                        Download Report
                    </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${ts.border(isDark)} bg-slate-500/[0.02]`}>
                                {['Course Title', 'Status', 'Engagement', 'Success Rate', 'Avg. XP', 'Time Spent', ''].map((h, i) => (
                                    <th key={h} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-left' : 'text-right'} ${ts.textMuted(isDark)}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={ts.divider(isDark)}>
                            {courseMetrics.map((c, i) => (
                                <motion.tr key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className={`group transition-all ${ts.cardHover(isDark)}`}>

                                    {/* Title */}
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-indigo-500 font-black ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                                <BarChart3 size={18} />
                                            </div>
                                            <p className={`font-black text-[14px] tracking-tight group-hover:text-indigo-500 transition-colors ${ts.textPrimary(isDark)}`}>{c.title}</p>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-8 py-6 text-right">
                                        <Badge className={`px-3 py-1 rounded-full border-0 text-[10px] font-black ${c.is_published ? ts.live(isDark) : ts.draft(isDark)}`}>
                                            {c.is_published ? 'ACTIVE' : 'DRAFT'}
                                        </Badge>
                                    </td>

                                    {/* Engagement */}
                                    <td className="px-8 py-6 text-right">
                                        <div className="inline-flex flex-col items-end">
                                            <p className={`text-[14px] font-black ${ts.textPrimary(isDark)}`}>{c.enrolled_count.toLocaleString()}</p>
                                            <p className={`text-[10px] font-bold ${ts.textMuted(isDark)}`}>Enrolled Learners</p>
                                        </div>
                                    </td>

                                    {/* Completion / Success */}
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[14px] font-black ${ts.textPrimary(isDark)}`}>{c.completion_rate}%</span>
                                                <Target size={12} className="text-emerald-500" />
                                            </div>
                                            <div className={`w-24 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${c.completion_rate}%` }}
                                                    className="h-full bg-indigo-500" />
                                            </div>
                                        </div>
                                    </td>

                                    {/* XP */}
                                    <td className="px-8 py-6 text-right">
                                        <Badge className={`px-3 py-1 rounded-full border-0 text-[10px] font-black ${isDark ? 'bg-amber-400/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                                            <Zap size={10} className="mr-1" fill="currentColor" /> {c.avg_xp} XP
                                        </Badge>
                                    </td>

                                    {/* Time Spent */}
                                    <td className="px-8 py-6 text-right">
                                        <div className="inline-flex flex-col items-end">
                                            <div className="flex items-center gap-1.5">
                                                <p className={`text-[14px] font-black ${ts.textPrimary(isDark)}`}>{c.total_time_mins}</p>
                                                <Clock size={12} className={ts.textMuted(isDark)} />
                                            </div>
                                            <p className={`text-[10px] font-bold ${ts.textMuted(isDark)}`}>Total Minutes</p>
                                        </div>
                                    </td>

                                    {/* Icon / Action */}
                                    <td className="px-8 py-6 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => router.push(`/school-admin/course/${c.id}`)}
                                            className={`w-9 h-9 rounded-xl border ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-indigo-400' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                            <ExternalLink size={18} />
                                        </Button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
