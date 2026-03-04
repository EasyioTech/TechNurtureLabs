'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SchoolStats, SchoolLeaderboardEntry, SchoolCourseMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { Users, BookOpen, Zap, Trophy, GraduationCap, CheckCircle2, Target, TrendingUp, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface OverviewTabProps {
    stats: SchoolStats;
    leaderboard: SchoolLeaderboardEntry[];
    courseMetrics: SchoolCourseMetric[];
}

function StatCard({ value, label, sub, icon: Icon, theme }: { value: string; label: string; sub?: string; icon: any; theme: string }) {
    const { isDark } = useSchoolTheme();
    const themes: Record<string, string> = {
        lime: isDark ? 'bg-lime-400/10 text-lime-400 border-lime-400/20' : 'bg-lime-50 text-lime-700 border-lime-100',
        sky: isDark ? 'bg-sky-400/10 text-sky-400 border-sky-400/20' : 'bg-sky-50 text-sky-600 border-sky-100',
        violet: isDark ? 'bg-violet-400/10 text-violet-400 border-violet-400/20' : 'bg-violet-50 text-violet-600 border-violet-100',
        amber: isDark ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-amber-50 text-amber-600 border-amber-100',
    };
    return (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-[24px] border p-6 flex flex-col gap-4 shadow-lg shadow-black/5 transition-all hover:-translate-y-0.5 ${ts.card(isDark)} border-transparent hover:border-lime-400/20`}>
            <div className="flex items-start justify-between">
                <p className={`text-[10px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>{label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${themes[theme]}`}><Icon size={16} /></div>
            </div>
            <div>
                <p className={`text-3xl font-[900] tracking-tighter ${ts.textPrimary(isDark)}`}>{value}</p>
                {sub && <p className={`text-[11px] font-bold mt-1 ${ts.textMuted(isDark)}`}>{sub}</p>}
            </div>
        </motion.div>
    );
}

export function SchoolOverviewTab({ stats, leaderboard, courseMetrics }: OverviewTabProps) {
    const { isDark } = useSchoolTheme();

    // Placeholder activity data (real data would come from school_metrics_daily)
    const activityData = [
        { day: 'Mon', students: Math.round(stats.activeStudents * 0.6) },
        { day: 'Tue', students: Math.round(stats.activeStudents * 0.8) },
        { day: 'Wed', students: Math.round(stats.activeStudents * 0.9) },
        { day: 'Thu', students: Math.round(stats.activeStudents * 0.7) },
        { day: 'Fri', students: Math.round(stats.activeStudents * 1.0) },
        { day: 'Sat', students: Math.round(stats.activeStudents * 0.4) },
        { day: 'Sun', students: Math.round(stats.activeStudents * 0.3) },
    ];

    const courseStatusData = [
        { name: 'Active', value: courseMetrics.filter(c => c.is_published).length },
        { name: 'Draft', value: courseMetrics.filter(c => !c.is_published).length },
    ];
    const COLORS = isDark ? ['#a3e635', '#334155'] : ['#1a1a1a', '#e2e8f0'];

    return (
        <div className="space-y-6">
            {/* Stat grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard value={stats.totalStudents.toLocaleString()} label="Total Students" sub={`${stats.activeStudents} active this week`} icon={Users} theme="lime" />
                <StatCard value={`${stats.avgXp.toLocaleString()} XP`} label="Avg. XP / Student" sub={`${stats.totalXp.toLocaleString()} total earned`} icon={Zap} theme="violet" />
                <StatCard value={`${stats.avgCompletionRate}%`} label="Avg. Completion" sub={`${stats.totalLessonsCompleted} lessons done`} icon={Target} theme="sky" />
                <StatCard value={stats.enrolledCourses.toString()} label="Active Courses" sub={`${stats.totalQuizzesTaken} quizzes taken`} icon={BookOpen} theme="amber" />
            </div>

            {/* Subscription banner */}
            {stats.planName && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`rounded-2xl border p-4 flex items-center gap-4 ${isDark ? 'bg-lime-400/5 border-lime-400/20' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-lime-400/10 text-lime-400' : 'bg-emerald-100 text-emerald-700'}`}><CreditCard size={18} /></div>
                    <div className="flex-1">
                        <p className={`text-[12px] font-black ${isDark ? 'text-lime-400' : 'text-emerald-700'}`}>{stats.planName} Plan</p>
                        <p className={`text-[11px] font-medium ${ts.textMuted(isDark)}`}>
                            {stats.subscriptionStatus?.toUpperCase()} · Expires {stats.planExpiry ? new Date(stats.planExpiry).toLocaleDateString('en-IN') : 'N/A'}
                        </p>
                    </div>
                    <Badge className={`text-[9px] font-black ${isDark ? 'bg-lime-400/10 text-lime-400' : 'bg-emerald-100 text-emerald-700'}`}>{stats.subscriptionStatus?.toUpperCase()}</Badge>
                </motion.div>
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity chart */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`lg:col-span-2 rounded-[24px] border p-6 shadow-xl shadow-black/5 ${ts.card(isDark)}`}>
                    <h3 className={`font-black text-sm mb-4 ${ts.textPrimary(isDark)}`}>Weekly Student Activity</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="grad-school" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isDark ? '#a3e635' : '#1a1a1a'} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={isDark ? '#a3e635' : '#1a1a1a'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} />
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: isDark ? '#475569' : '#94a3b8', fontWeight: 800 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: isDark ? '#475569' : '#94a3b8', fontWeight: 800 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: isDark ? '#0f1219' : '#fff', border: 'none', borderRadius: 12, fontSize: 11, fontWeight: 800 }} />
                            <Area type="monotone" dataKey="students" stroke={isDark ? '#a3e635' : '#1a1a1a'} strokeWidth={2.5} fill="url(#grad-school)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Course pie */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className={`rounded-[24px] border p-6 shadow-xl shadow-black/5 ${ts.card(isDark)}`}>
                    <h3 className={`font-black text-sm mb-4 ${ts.textPrimary(isDark)}`}>Course Status</h3>
                    <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                            <Pie data={courseStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" paddingAngle={4}>
                                {courseStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 800 }} />
                            <Tooltip contentStyle={{ background: isDark ? '#0f1219' : '#fff', border: 'none', borderRadius: 12, fontSize: 11, fontWeight: 800 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Top 5 Leaderboard preview */}
            {leaderboard.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className={`rounded-[24px] border overflow-hidden shadow-xl shadow-black/5 ${ts.card(isDark)}`}>
                    <div className={`px-6 py-5 border-b ${ts.border(isDark)} flex items-center justify-between`}>
                        <h3 className={`font-black text-base ${ts.textPrimary(isDark)}`}>Top Performers</h3>
                        <Badge className={`text-[9px] font-black ${isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-50 text-amber-700'}`}><Trophy size={9} className="mr-1" />LEADERBOARD</Badge>
                    </div>
                    <div className={ts.divider(isDark)}>
                        {leaderboard.slice(0, 5).map((entry, i) => (
                            <div key={entry.id} className={`px-6 py-3.5 flex items-center gap-4 ${ts.cardHover(isDark)}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0
                                    ${i < 3 ? (isDark ? 'bg-lime-400 text-slate-900' : 'bg-slate-900 text-white') : (isDark ? 'bg-white/[0.05] text-slate-500' : 'bg-slate-100 text-slate-500')}`}>
                                    #{entry.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-black text-[13px] truncate ${ts.textPrimary(isDark)}`}>{entry.full_name}</p>
                                    <p className={`text-[10px] ${ts.textMuted(isDark)}`}>{entry.lessons_completed} lessons · {entry.current_streak}d streak</p>
                                </div>
                                <p className={`font-[900] text-[14px] ${isDark ? 'text-lime-400' : 'text-slate-900'}`}>{entry.total_xp.toLocaleString()} XP</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
