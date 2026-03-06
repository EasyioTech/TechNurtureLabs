'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Users, School, BookOpen, IndianRupee, TrendingUp,
    Zap, Activity, ArrowUpRight, GraduationCap,
} from 'lucide-react';
import { EngagementCharts } from '../engagement-charts';
import { Stats, PaymentPlan, SchoolInfo } from '../../types';
import { useAdminTheme, t } from '../../theme-context';

interface OverviewTabProps {
    stats: Stats;
    paymentPlans: PaymentPlan[];
    schoolsList: SchoolInfo[];
}

function StatCard({ label, value, badge, icon: Icon, extra, delay = 0 }: {
    label: string; value: string; badge?: string; icon?: React.ElementType; extra?: React.ReactNode; delay?: number;
}) {
    const { isDark, accent } = useAdminTheme();
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`relative rounded-[24px] p-6 lg:p-7 border transition-all duration-500 overflow-hidden group ${t.card(isDark)} ${t.cardHover(isDark)}`}
        >
            <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl transition-all
                ${isDark ? `opacity-[0.04] group-hover:opacity-[0.08]` : 'bg-neutral-400/[0.04] group-hover:bg-neutral-400/[0.08]'}`}
                style={isDark ? { backgroundColor: accent.swatchDark } : {}} />

            <div className="flex justify-between items-start mb-6">
                <p className={`text-[12px] font-bold tracking-widest uppercase ${t.textMuted(isDark)}`}>{label}</p>
                {Icon && (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-neutral-50'}`}>
                        <Icon size={14} className={isDark ? accent.text : 'text-neutral-600'} />
                    </div>
                )}
            </div>

            <div className="flex items-baseline gap-1.5">
                <p className={`text-[32px] lg:text-[40px] font-black tracking-tighter leading-none ${t.textPrimary(isDark)}`}>{value}</p>
            </div>

            {badge && (
                <div className="mt-4 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${t.accentBadge(isDark, accent)}`}>
                        {badge}
                    </span>
                </div>
            )}
            {extra && <div className="mt-5">{extra}</div>}
        </motion.div>
    );
}

function MiniStat({ label, value, icon: Icon, theme = 'accent', delay = 0 }: {
    label: string; value: string; icon?: React.ElementType; theme?: 'emerald' | 'violet' | 'sky' | 'amber' | 'rose' | 'accent'; delay?: number;
}) {
    const { isDark, accent } = useAdminTheme();

    const themes: Record<string, string> = {
        accent: isDark ? accent.softDark : accent.softLight,
        emerald: isDark ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
        violet: isDark ? 'bg-violet-400/10 text-violet-400 border-violet-400/20' : 'bg-violet-50 text-violet-600 border-violet-100',
        sky: isDark ? 'bg-sky-400/10 text-sky-400 border-sky-400/20' : 'bg-sky-50 text-sky-600 border-sky-100',
        amber: isDark ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-amber-50 text-amber-600 border-amber-100',
        rose: isDark ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' : 'bg-rose-50 text-rose-600 border-rose-100',
    };

    const activeTheme = themes[theme] || themes.accent;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35 }}
            className={`rounded-2xl border p-5 flex items-center gap-4 transition-all duration-300 ${t.card(isDark)} ${t.cardHoverAccent(isDark, accent)} shadow-sm hover:shadow-xl shadow-black/5 group`}
        >
            <div className={`w-12 h-12 rounded-full ${activeTheme} border flex items-center justify-center flex-shrink-0 transition-transform`}>
                {Icon ? <Icon size={20} /> : <div className="w-4 h-4 rounded-sm" />}
            </div>
            <div className="min-w-0">
                <p className={`text-xl lg:text-2xl font-black tracking-tighter leading-tight ${t.textPrimary(isDark)}`}>{value}</p>
                <p className={`text-[10px] font-[900] uppercase tracking-widest truncate ${t.textMuted(isDark)}`}>{label}</p>
            </div>
        </motion.div>
    );
}

export function OverviewTab({ stats, paymentPlans, schoolsList }: OverviewTabProps) {
    const { isDark, accent } = useAdminTheme();

    const engagementData = [
        { name: 'Students', students: stats.totalStudents, lessons: stats.totalLessons },
        { name: 'Active', students: stats.activeStudents, lessons: stats.avgCompletion },
        { name: 'Enrolled', students: stats.totalEnrollments, lessons: stats.totalCourses },
    ];

    const revenueData = [
        { month: 'Current Revenue', revenue: stats.totalRevenue },
    ];

    const planDistribution = paymentPlans.length > 0
        ? paymentPlans.map(p => {
            const count = schoolsList.filter(s => s.plan_name === p.name).length;
            return { name: p.name, value: count };
        }).filter(item => item.value > 0)
        : [];

    if (planDistribution.length === 0 && paymentPlans.length > 0) {
        // Show placeholders for empty distribution but existing plans
        planDistribution.push({ name: paymentPlans[0].name, value: 0 });
    } else if (planDistribution.length === 0) {
        planDistribution.push({ name: 'No Active Subscriptions', value: 1 });
    }

    const completionBar = (
        <div className="flex items-center gap-2.5 h-10 px-1">
            <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-neutral-100'}`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.avgCompletion}%` }}
                    className={`h-full rounded-full ${accent.bg}`} style={t.barGlow(isDark, accent)} />
            </div>
            <span className={`text-[12px] font-black tracking-tighter ${t.textPrimary(isDark)}`}>{stats.avgCompletion}%</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={`\u20B9${stats.totalRevenue.toLocaleString('en-IN')}`} icon={IndianRupee} delay={0} />
                <StatCard label="Total Students" value={stats.totalStudents.toLocaleString()} icon={Users} delay={0.05} />
                <StatCard label="Course Completion" value={`${stats.avgCompletion}%`} icon={Zap} extra={completionBar} delay={0.1} />
                <StatCard label="Total Courses" value={stats.totalCourses.toString()} icon={BookOpen} delay={0.15} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MiniStat label="Schools" value={`${stats.activeSchools}`} icon={School} theme="accent" delay={0.2} />
                <MiniStat label="Total XP" value={stats.totalXp.toLocaleString()} icon={Zap} theme="accent" delay={0.24} />
                <MiniStat label="Enrollments" value={stats.totalEnrollments.toString()} icon={GraduationCap} theme="accent" delay={0.28} />
                <MiniStat label="Active Subs" value={stats.activeSubscriptions.toString()} icon={Activity} theme="accent" delay={0.32} />
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.36 }}>
                <EngagementCharts engagementData={engagementData} planDistribution={planDistribution} revenueData={revenueData} />
            </motion.div>
        </div>
    );
}
