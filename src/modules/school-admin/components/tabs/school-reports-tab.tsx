'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SchoolCourseMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { BarChart2 } from 'lucide-react';

interface ReportsTabProps { courseMetrics: SchoolCourseMetric[]; }

export function SchoolReportsTab({ courseMetrics }: ReportsTabProps) {
    const { isDark } = useSchoolTheme();

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-[24px] border overflow-hidden shadow-xl shadow-black/5 ${ts.card(isDark)}`}>
                <div className={`px-6 py-5 border-b ${ts.border(isDark)} flex items-center justify-between`}>
                    <div>
                        <h3 className={`font-black text-lg tracking-tight ${ts.textPrimary(isDark)}`}>Course Performance Report</h3>
                        <p className={`text-[12px] font-medium ${ts.textMuted(isDark)}`}>Analytics for all courses your students are enrolled in.</p>
                    </div>
                    <Badge className={`text-[10px] font-black ${isDark ? 'bg-white/[0.08] text-white' : 'bg-slate-900 text-white'}`}>
                        {courseMetrics.length} COURSES
                    </Badge>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${ts.border(isDark)} bg-slate-500/[0.02]`}>
                                {['Course', 'Status', 'Lessons', 'Enrolled', 'Completion', 'Avg. XP', 'Time Spent'].map((h, i) => (
                                    <th key={h} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-left' : 'text-right'} ${ts.textMuted(isDark)}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={ts.divider(isDark)}>
                            {courseMetrics.length > 0 ? courseMetrics.map((c, i) => (
                                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                    className={`transition-all ${ts.cardHover(isDark)}`}>
                                    <td className="px-6 py-4">
                                        <p className={`font-black text-[13px] ${ts.textPrimary(isDark)}`}>{c.title}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Badge className={`text-[9px] font-black ${c.is_published ? ts.live(isDark) : ts.draft(isDark)}`}>
                                            {c.is_published ? 'LIVE' : 'DRAFT'}
                                        </Badge>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold text-[13px] ${ts.textSecondary(isDark)}`}>{c.lesson_count}</td>
                                    <td className={`px-6 py-4 text-right font-black text-[13px] text-sky-500`}>{c.enrolled_count}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2.5">
                                            <div className={`w-16 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-slate-100'}`}>
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${c.completion_rate}%` }}
                                                    className={`h-full rounded-full ${isDark ? 'bg-lime-400' : 'bg-slate-900'}`} />
                                            </div>
                                            <span className={`text-[12px] font-black ${ts.textPrimary(isDark)}`}>{c.completion_rate}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Badge className={`text-[10px] font-black ${isDark ? 'bg-violet-400/10 text-violet-400' : 'bg-violet-50 text-violet-700'}`}>{c.avg_xp} XP</Badge>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black text-[13px] ${ts.textSecondary(isDark)}`}>{c.total_time_mins}m</td>
                                </motion.tr>
                            )) : (
                                <tr><td colSpan={7}>
                                    <div className="py-14 text-center">
                                        <BarChart2 size={28} className={`mx-auto mb-2 ${ts.textMuted(isDark)}`} />
                                        <p className={`text-[11px] ${ts.textMuted(isDark)}`}>No course data available yet.</p>
                                    </div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
