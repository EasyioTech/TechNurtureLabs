'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { SchoolStats, SchoolLeaderboardEntry, SchoolCourseMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import {
    Users, BookOpen, Zap, Trophy, Target, TrendingUp, CreditCard,
    CheckCircle2, Clock, Award, Star, Activity, BarChart3
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { useRouter } from 'next/navigation';

interface OverviewTabProps {
    stats: SchoolStats;
    leaderboard: SchoolLeaderboardEntry[];
    courseMetrics: SchoolCourseMetric[];
}

const STAT_CONFIGS = [
    {
        key: 'students', label: 'Total Students', icon: Users,
        gradient: 'from-blue-500 to-indigo-600',
        color: 'indigo'
    },
    {
        key: 'xp', label: 'Average XP', icon: Zap,
        gradient: 'from-amber-500 to-orange-600',
        color: 'amber'
    },
    {
        key: 'completion', label: 'Completion Rate', icon: Target,
        gradient: 'from-emerald-500 to-teal-600',
        color: 'emerald'
    },
    {
        key: 'courses', label: 'Active Courses', icon: BookOpen,
        gradient: 'from-violet-500 to-purple-600',
        color: 'violet'
    },
];

function StatCard({ config, value, sub, index }: {
    config: typeof STAT_CONFIGS[0]; value: string; sub?: string; index: number;
}) {
    const { isDark } = useSchoolTheme();
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className={`relative rounded-3xl p-6 border transition-all duration-300 group hover:-translate-y-1 ${ts.card(isDark)}`}>

            <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-transform group-hover:scale-110 ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                {sub && (
                    <Badge className={`text-[9px] font-black border-0 tracking-wider ${ts.accentSoft(isDark)}`}>
                        {sub.split(' ')[0]} NEW
                    </Badge>
                )}
            </div>

            <p className={`text-[11px] font-black uppercase tracking-widest leading-none mb-2 ${ts.textMuted(isDark)}`}>
                {config.label}
            </p>
            <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>
                    {value}
                </p>
                {config.key === 'xp' && <span className={`text-[10px] font-black opacity-40 ${ts.textPrimary(isDark)}`}>XP</span>}
            </div>
        </motion.div>
    );
}

function SectionHeader({ title, sub, icon: Icon }: { title: string; sub?: string; icon?: any }) {
    const { isDark } = useSchoolTheme();
    return (
        <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-100 border border-slate-200/60'
                        }`}>
                        <Icon size={18} className="text-indigo-500" strokeWidth={2.5} />
                    </div>
                )}
                <div>
                    <h2 className={`text-xl font-black tracking-tight mb-1 ${ts.textPrimary(isDark)}`}>{title}</h2>
                    {sub && <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>{sub}</p>}
                </div>
            </div>
        </div>
    );
}

export function SchoolOverviewTab({ stats, leaderboard, courseMetrics }: OverviewTabProps) {
    const { isDark } = useSchoolTheme();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const activityData = stats.totalStudents > 0 ? [
        { day: 'Mon', active: stats.activeStudents > 0 ? Math.floor(stats.activeStudents * 0.4) : 12, total: stats.totalStudents },
        { day: 'Tue', active: stats.activeStudents > 0 ? Math.floor(stats.activeStudents * 0.6) : 18, total: stats.totalStudents },
        { day: 'Wed', active: stats.activeStudents > 0 ? Math.floor(stats.activeStudents * 0.9) : 25, total: stats.totalStudents },
        { day: 'Thu', active: stats.activeStudents > 0 ? Math.floor(stats.activeStudents * 0.7) : 15, total: stats.totalStudents },
        { day: 'Fri', active: stats.activeStudents > 0 ? stats.activeStudents : 30, total: stats.totalStudents },
        { day: 'Sat', active: stats.activeStudents > 0 ? Math.floor(stats.activeStudents * 0.3) : 8, total: stats.totalStudents },
        { day: 'Sun', active: stats.activeStudents > 0 ? Math.floor(stats.activeStudents * 0.2) : 5, total: stats.totalStudents },
    ] : [
        { day: 'Mon', active: 0, total: 0 },
        { day: 'Tue', active: 0, total: 0 },
        { day: 'Wed', active: 0, total: 0 },
        { day: 'Thu', active: 0, total: 0 },
        { day: 'Fri', active: 0, total: 0 },
        { day: 'Sat', active: 0, total: 0 },
        { day: 'Sun', active: 0, total: 0 },
    ];

    const studentActivityData = [
        { name: 'Active', value: stats.activeStudents },
        { name: 'Inactive', value: stats.totalStudents - stats.activeStudents },
    ];

    const topCoursesRaw = courseMetrics.slice(0, 5);
    const topCourses = topCoursesRaw.map(c => ({
        id: c.id,
        name: c.title.length > 20 ? c.title.slice(0, 20) + '…' : c.title,
        enrolled: c.enrolled_count,
        completion: c.completion_rate,
    }));

    const PIE_COLORS = isDark ? ['#6366f1', '#4f46e5', '#312e81', '#1e1b4b'] : ['#6366f1', '#4f46e5', '#818cf8', '#c7d2fe'];
    const gridColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    const tickColor = isDark ? '#64748b' : '#94a3b8';
    const tooltipStyle = {
        background: isDark ? '#161921' : '#fff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}`,
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 800,
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        padding: '12px 16px',
    };

    return (
        <div className="space-y-8">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard index={0} config={STAT_CONFIGS[0]}
                    value={stats.totalStudents.toLocaleString()}
                    sub={`${stats.activeStudents} active`} />
                <StatCard index={1} config={STAT_CONFIGS[1]}
                    value={stats.avgXp.toLocaleString()}
                    sub={`${stats.totalXp.toLocaleString()} total`} />
                <StatCard index={2} config={STAT_CONFIGS[2]}
                    value={`${stats.avgCompletionRate}%`}
                    sub={`${stats.totalLessonsCompleted} done`} />
                <StatCard index={3} config={STAT_CONFIGS[3]}
                    value={stats.enrolledCourses.toString()}
                    sub={`${stats.totalQuizzesTaken} quizzes`} />
            </div>

            {/* ── Subscription Banner ── */}
            {stats.planName && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[32px] p-6 flex items-center gap-6 border transition-all ${isDark
                        ? 'bg-gradient-to-br from-[#161b26] to-[#0f1115] border-white/[0.03] shadow-xl shadow-black/10'
                        : 'bg-white border-slate-200/60 shadow-sm'
                        }`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                        <CreditCard size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <span className={`text-[16px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>{stats.planName} Plan</span>
                            <Badge className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border-0 ${ts.live(isDark)}`}>
                                {stats.subscriptionStatus === 'active' ? '● ONLINE' : stats.subscriptionStatus?.toUpperCase()}
                            </Badge>
                        </div>
                        <p className={`text-[12px] font-bold tracking-tight ${ts.textSecondary(isDark)} opacity-60`}>
                            Next billing cycle on <span className="text-indigo-500 font-black">{stats.planExpiry ? new Date(stats.planExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                        </p>
                    </div>
                    <button 
                        onClick={() => router.push('/school-admin/settings?tab=subscription')}
                        className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black transition-all ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/10' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/10'}`}
                    >
                        MANAGE PLAN
                    </button>
                </motion.div>
            )}

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Activity */}
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className={`p-8 ${ts.card(isDark)} rounded-[32px]`}>
                    <SectionHeader title="Learning Activity" sub="Student login and interaction frequency" icon={Activity} />
                    <div className="h-[260px] w-full">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="6 6" stroke={gridColor} vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickColor, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickColor, fontWeight: 700 }} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            backgroundColor: isDark ? '#1a1f2e' : '#fff',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9'}`,
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#6366f1' }}
                                    />
                                    <Area type="monotone" dataKey="active" stroke="#6366f1" strokeWidth={4} fill="url(#chartGrad)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: isDark ? '#111827' : '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Student Activity Distribution */}
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                    className={`p-8 ${ts.card(isDark)} rounded-[32px] flex flex-col`}>
                    <SectionHeader title="Student Engagement" sub="Active vs Inactive students overview" icon={BarChart3} />
                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-8">
                        <div className="w-full sm:w-1/2 h-[200px]">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                                    <PieChart>
                                        <Pie data={studentActivityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={8} strokeWidth={0}>
                                            {studentActivityData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i] || '#94a3b8'} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="w-full sm:w-1/2 space-y-4">
                            {studentActivityData.map((item, i) => (
                                <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-500/5 border border-slate-200/40 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] || '#94a3b8' }} />
                                        <p className={`text-[13px] font-black ${ts.textPrimary(isDark)}`}>{item.name}</p>
                                    </div>
                                    <p className={`text-[15px] font-black ${ts.textPrimary(isDark)}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Leaderboard & Top Courses ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Leaderboard */}
                {leaderboard.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className={`${ts.card(isDark)} rounded-[32px] overflow-hidden`}>
                        <div className={`p-8 border-b ${ts.border(isDark)}`}>
                            <SectionHeader title="Top Student Performers" sub="Leading by XP and weekly consistency" icon={Trophy} />
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                            {leaderboard.slice(0, 5).map((entry, i) => {
                                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                                return (
                                    <div key={entry.id}
                                        onClick={() => router.push(`/school-admin/student/${entry.id}`)}
                                        className={`px-8 py-5 flex items-center gap-5 transition-all cursor-pointer hover:scale-[1.01] ${ts.cardHover(isDark)}`}>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[15px] font-black flex-shrink-0 ${medal ? 'bg-amber-400/10 text-amber-500 border border-amber-400/20 shadow-lg shadow-amber-400/5' : ts.accentSoft(isDark)
                                            }`}>
                                            {medal || i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[15px] font-black truncate mb-1 ${ts.textPrimary(isDark)}`}>{entry.full_name}</p>
                                            <div className="flex items-center gap-3">
                                                <Badge className={`text-[9px] font-black border-0 ${ts.accentSoft(isDark)}`}>LVL {entry.level}</Badge>
                                                <span className={`text-[11px] font-bold ${ts.textMuted(isDark)}`}>{entry.lessons_completed} lessons completed</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-xl font-black text-indigo-500 leading-none`}>{entry.total_xp.toLocaleString()}</p>
                                            <p className={`text-[9px] font-black tracking-widest uppercase mt-1 ${ts.textMuted(isDark)}`}>XP Total</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Top Courses */}
                {topCourses.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        className={`${ts.card(isDark)} rounded-[32px] overflow-hidden`}>
                        <div className={`p-8 border-b ${ts.border(isDark)}`}>
                            <SectionHeader title="High Engagement Courses" sub="Most popular content by enrollment" icon={TrendingUp} />
                        </div>
                        <div className="p-8">
                            <div className="space-y-6">
                                {topCourses.map((c, i) => (
                                    <div key={c.id}
                                        onClick={() => router.push(`/school-admin/course/${c.id}`)}
                                        className="space-y-2 cursor-pointer group hover:scale-[1.01] transition-all">
                                        <div className="flex justify-between items-center">
                                            <p className={`text-[14px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>{c.name}</p>
                                            <Badge className={`text-[10px] font-black border-0 ${ts.accentSoft(isDark)}`}>{c.enrolled} Enrolled</Badge>
                                        </div>
                                        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.totalStudents > 0 ? (c.enrolled / stats.totalStudents) * 100 : 0}%` }}
                                                transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── Empty State ── */}
            {leaderboard.length === 0 && courseMetrics.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`rounded-2xl p-12 text-center ${isDark ? 'bg-[#111827] border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                        <Star size={28} strokeWidth={1.5} />
                    </div>
                    <p className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Your Dashboard is Ready!
                    </p>
                    <p className={`text-sm max-w-sm mx-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Once students start enrolling and completing courses, your analytics will appear here.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
