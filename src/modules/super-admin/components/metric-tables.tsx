'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserMetric, CourseMetric } from '../types';
import { useAdminTheme, t } from '../theme-context';
import { USER_METRICS_PAGE_SIZE } from '../hooks/use-admin-data';
import { Zap, Trophy, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface MetricTablesProps {
    userMetrics: UserMetric[];
    courseMetrics: CourseMetric[];
    page?: number;
    setPage?: (p: number) => void;
}

export function MetricTables({ userMetrics, courseMetrics, page = 0, setPage }: MetricTablesProps) {
    const { isDark, accent } = useAdminTheme();
    const totalPages = Math.ceil(userMetrics.length / USER_METRICS_PAGE_SIZE);
    const pagedMetrics = userMetrics
        .sort((a, b) => b.total_xp - a.total_xp)
        .slice(page * USER_METRICS_PAGE_SIZE, (page + 1) * USER_METRICS_PAGE_SIZE);

    return (
        <div className="space-y-6">
            {userMetrics.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[24px] border overflow-hidden transition-all duration-300 shadow-xl shadow-black/5 ${t.card(isDark)}`}>
                    <div className={`px-6 py-5 border-b ${t.border(isDark)} flex items-center justify-between`}>
                        <div>
                            <h3 className={`font-black text-lg tracking-tight ${t.textPrimary(isDark)}`}>Student Leaderboard</h3>
                            <p className={`text-[12px] font-medium ${t.textMuted(isDark)}`}>
                                Engagement rankings based on earned experience points
                                <span className={`ml-2 font-black ${isDark ? accent.text : 'text-slate-600'}`}>
                                    ({userMetrics.length} students)
                                </span>
                            </p>
                        </div>
                        <Badge className={`text-[10px] font-black px-3 py-1 rounded-full ${isDark ? 'bg-white/[0.08] text-white' : 'bg-slate-900 text-white'}`}>GLOBAL</Badge>
                    </div>
                    <div className={t.divider(isDark)}>
                        {pagedMetrics.map((u, i) => {
                            const globalRank = page * USER_METRICS_PAGE_SIZE + i;
                            const isTop3 = globalRank < 3;
                            return (
                                <motion.div key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                    className={`px-6 py-4 flex items-center gap-4 transition-all group ${t.cardHover(isDark)}`}>
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0
                                            ${isTop3 ? (isDark ? `${accent.bg} text-slate-900 ${accent.ring.replace('ring-', 'ring-4 ring-')}` : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20') : isDark ? 'bg-white/[0.05] text-slate-500 border border-white/5' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                            {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        {isTop3 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f1219]">
                                                <Trophy size={10} className="text-slate-900" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-black text-sm tracking-tight ${t.textPrimary(isDark)}`}>{u.full_name}</p>
                                            <Badge className={`text-[9px] font-black h-4 px-1.5 ${isDark ? 'bg-sky-400/10 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>LVL {u.level}</Badge>
                                        </div>
                                        <p className={`text-[11px] font-medium leading-none mt-0.5 ${t.textMuted(isDark)}`}>{u.email}</p>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end mr-6">
                                        <p className={`text-[10px] font-black tracking-widest uppercase mb-1 ${t.textMuted(isDark)}`}>School</p>
                                        <p className={`text-[11px] font-bold ${t.textSecondary(isDark)}`}>{u.school_name}</p>
                                    </div>
                                    <div className="flex flex-col items-end min-w-[100px]">
                                        <p className={`text-lg font-[900] tracking-tighter ${isDark ? accent.text : 'text-slate-900'}`}>{u.total_xp.toLocaleString()} XP</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-orange-500 font-black flex items-center gap-0.5"><Zap size={10} fill="currentColor" />{u.current_streak}D</span>
                                            <span className="text-[10px] text-emerald-500 font-black flex items-center gap-0.5"><CheckCircle2 size={10} />{u.lessons_completed}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 1 && setPage && (
                        <div className={`px-6 py-4 border-t ${t.border(isDark)} flex items-center justify-between`}>
                            <p className={`text-[11px] font-bold ${t.textMuted(isDark)}`}>
                                Showing {page * USER_METRICS_PAGE_SIZE + 1}–{Math.min((page + 1) * USER_METRICS_PAGE_SIZE, userMetrics.length)} of {userMetrics.length} students
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" disabled={page === 0}
                                    onClick={() => setPage(page - 1)}
                                    className={`rounded-full h-8 px-4 text-[11px] font-black disabled:opacity-30 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                                    <ChevronLeft size={14} className="mr-1" /> Prev
                                </Button>
                                <span className={`text-[11px] font-black px-2 ${t.textMuted(isDark)}`}>{page + 1} / {totalPages}</span>
                                <Button variant="ghost" size="sm" disabled={page >= totalPages - 1}
                                    onClick={() => setPage(page + 1)}
                                    className={`rounded-full h-8 px-4 text-[11px] font-black disabled:opacity-30 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
                                    Next <ChevronRight size={14} className="ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {courseMetrics.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`rounded-[24px] border overflow-hidden transition-all duration-300 shadow-xl shadow-black/5 ${t.card(isDark)}`}>
                    <div className={`px-6 py-5 border-b ${t.border(isDark)}`}>
                        <h3 className={`font-black text-lg tracking-tight ${t.textPrimary(isDark)}`}>Course Performance Analytics</h3>
                        <p className={`text-[12px] font-medium ${t.textMuted(isDark)}`}>Detailed engagement and completion data for all active training modules.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className={`border-b ${t.border(isDark)} bg-slate-500/[0.02]`}>
                                {['Course', 'Status', 'Lessons', 'Students', 'Completion Rate', 'Avg. XP', 'Time Spent'].map(h => (
                                    <th key={h} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${h === 'Course' ? 'text-left' : 'text-right'} ${t.textMuted(isDark)}`}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody className={t.divider(isDark)}>
                                {courseMetrics.map((c, i) => (
                                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                        className={`transition-all group ${t.cardHover(isDark)}`}>
                                        <td className="px-6 py-5">
                                            <p className={`font-black text-[13px] tracking-tight ${t.textPrimary(isDark)}`}>{c.title}</p>
                                            <p className={`text-[10px] font-bold ${t.textMuted(isDark)} mt-0.5`}>ID: {c.id.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Badge className={`text-[9px] font-black px-2 py-0.5 rounded-md ${c.is_published ? t.live(isDark) : t.draft(isDark)}`}>
                                                {c.is_published ? 'ACTIVE' : 'DRAFT'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-right font-bold text-[13px]">{c.lesson_count}</td>
                                        <td className="px-6 py-5 text-right font-black text-[13px] text-sky-500">{c.enrolled_count}</td>
                                        <td className="px-6 py-5 text-right min-w-[140px]">
                                            <div className="flex items-center justify-end gap-2.5">
                                                <div className={`w-16 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-slate-100'} ring-1 ring-black/5`}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${c.completion_rate}%` }}
                                                        className={`h-full rounded-full ${accent.bg}`} style={t.barGlow(isDark, accent)} />
                                                </div>
                                                <span className={`text-[12px] font-black tracking-tight ${t.textPrimary(isDark)}`}>{c.completion_rate}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right"><Badge className="bg-sky-500/10 text-sky-500 border-sky-400/20 text-[10px] font-black">{c.avg_xp} XP</Badge></td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[12px] font-black ${t.textPrimary(isDark)}`}>{c.total_time_mins}m</span>
                                                <span className={`text-[9px] font-bold ${t.textMuted(isDark)} uppercase tracking-tighter`}>Total Time</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
