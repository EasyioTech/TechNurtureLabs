'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Users, School, IndianRupee, TrendingUp,
    Activity, GraduationCap, RefreshCw,
    CalendarDays, BarChart2, Wifi
} from 'lucide-react';
import { EngagementCharts } from '../engagement-charts';
import { Stats, PaymentPlan, SchoolInfo } from '../../types';
import { useAdminTheme, t } from '../../theme-context';
import { Button } from '@/components/ui/button';

interface OverviewTabProps {
    stats: Stats;
    paymentPlans: PaymentPlan[];
    schoolsList: SchoolInfo[];
    platformMetrics: any[];
    loginHeatmap: number[][];
    onSync?: () => Promise<void>;
}

// ─── Reusable card atoms ──────────────────────────────────────────────────────

function StatCard({ label, value, badge, icon: Icon, subvalue, delay = 0 }: {
    label: string; value: string; badge?: string; subvalue?: string;
    icon?: React.ElementType; delay?: number;
}) {
    const { isDark, accent } = useAdminTheme();
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`relative rounded-[24px] p-6 lg:p-7 border transition-all duration-500 overflow-hidden group ${t.card(isDark)} ${t.cardHover(isDark)}`}
        >
            <div
                className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl transition-all
                    ${isDark ? 'opacity-[0.04] group-hover:opacity-[0.08]' : 'bg-neutral-400/[0.04] group-hover:bg-neutral-400/[0.08]'}`}
                style={isDark ? { backgroundColor: accent.swatchDark } : {}}
            />
            <div className="flex justify-between items-start mb-6">
                <p className={`text-[12px] font-bold tracking-widest uppercase ${t.textMuted(isDark)}`}>{label}</p>
                {Icon && (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${t.border(isDark)} ${isDark ? 'bg-white/[0.03]' : 'bg-neutral-50'}`}>
                        <Icon size={14} className={isDark ? accent.text : 'text-neutral-600'} />
                    </div>
                )}
            </div>
            <div className="flex items-baseline gap-2">
                <p className={`text-[32px] lg:text-[40px] font-black tracking-tighter leading-none ${t.textPrimary(isDark)}`}>{value}</p>
                {subvalue && <p className={`text-sm font-black tracking-tight ${t.textSecondary(isDark)}`}>{subvalue}</p>}
            </div>
            {badge && (
                <div className="mt-4 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${t.accentBadge(isDark, accent)}`}>
                        {badge}
                    </span>
                </div>
            )}
        </motion.div>
    );
}

function MiniStat({ label, value, icon: Icon, theme = 'accent', delay = 0 }: {
    label: string; value: string; icon?: React.ElementType;
    theme?: 'emerald' | 'violet' | 'sky' | 'amber' | 'rose' | 'cyan' | 'accent'; delay?: number;
}) {
    const { isDark, accent } = useAdminTheme();
    const themes: Record<string, string> = {
        accent:  isDark ? accent.softDark : accent.softLight,
        emerald: isDark ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
        violet:  isDark ? 'bg-violet-400/10 text-violet-400 border-violet-400/20' : 'bg-violet-50 text-violet-600 border-violet-100',
        sky:     isDark ? 'bg-sky-400/10 text-sky-400 border-sky-400/20' : 'bg-sky-50 text-sky-600 border-sky-100',
        amber:   isDark ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-amber-50 text-amber-600 border-amber-100',
        rose:    isDark ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' : 'bg-rose-50 text-rose-600 border-rose-100',
        cyan:    isDark ? 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20' : 'bg-cyan-50 text-cyan-600 border-cyan-100',
    };
    const activeTheme = themes[theme] || themes.accent;
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35 }}
            className={`rounded-2xl border p-5 flex items-center gap-4 transition-all duration-300 ${t.card(isDark)} ${t.cardHoverAccent(isDark, accent)} shadow-sm hover:shadow-xl shadow-black/5 group`}
        >
            <div className={`w-12 h-12 rounded-full ${activeTheme} border flex items-center justify-center flex-shrink-0`}>
                {Icon ? <Icon size={20} /> : <div className="w-4 h-4 rounded-sm" />}
            </div>
            <div className="min-w-0">
                <p className={`text-xl lg:text-2xl font-black tracking-tighter leading-tight ${t.textPrimary(isDark)}`}>{value}</p>
                <p className={`text-[10px] font-[900] uppercase tracking-widest truncate ${t.textMuted(isDark)}`}>{label}</p>
            </div>
        </motion.div>
    );
}

// ─── Login Activity Heatmap (7 days × 24 hours) ──────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) =>
    i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`
);

function LoginHeatmap({ heatmap }: { heatmap: number[][] }) {
    const { isDark, accent } = useAdminTheme();

    // Find max value + peak day/hour for summary text
    const max = Math.max(1, ...heatmap.flatMap(row => row));
    
    const peakActivity = useMemo(() => {
        let pVal = -1;
        let pDay = 0;
        let pHour = 0;
        heatmap.forEach((row, dow) => {
            row.forEach((count, hour) => {
                if (count > pVal) {
                    pVal = count;
                    pDay = dow;
                    pHour = hour;
                }
            });
        });
        return { value: pVal, day: DAYS[pDay], hour: HOURS[pHour] };
    }, [heatmap]);

    const cellColor = (count: number) => {
        if (count === 0) return isDark ? 'bg-white/[0.04]' : 'bg-slate-100';
        const ratio = count / max;
        // Theme-responsive opacity mapping
        if (ratio < 0.2) return isDark ? `${accent.bg}/20` : `${accent.bg}/10`;
        if (ratio < 0.45) return isDark ? `${accent.bg}/40` : `${accent.bg}/30`;
        if (ratio < 0.7) return isDark ? `${accent.bg}/65` : `${accent.bg}/60`;
        if (ratio < 0.9) return isDark ? `${accent.bg}/85` : `${accent.bg}/80`;
        return isDark ? `${accent.bg} shadow-sm shadow-${accent.name}-500/20` : `${accent.bg} shadow-sm shadow-${accent.name}-500/30`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className={`rounded-[24px] border p-6 lg:p-8 shadow-xl shadow-black/5 ${t.card(isDark)}`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:rotate-3 ${isDark ? 'bg-white/[0.04]' : 'bg-[#171717] text-white'}`}>
                        <CalendarDays size={22} className={isDark ? accent.text : 'text-white'} />
                    </div>
                    <div>
                        <h3 className={`text-base font-black tracking-tight ${t.textPrimary(isDark)}`}>User Peak Times</h3>
                        <p className={`text-[11px] font-bold ${t.textMuted(isDark)} uppercase tracking-[0.15em]`}>Tracking login frequency across the platform</p>
                    </div>
                </div>

                {/* Plain-English summary for non-technical admins */}
                <div className={`px-4 py-2.5 rounded-xl border ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-neutral-50'} max-w-xs`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)} mb-0.5`}>Peak Performance</p>
                    <p className={`text-[11px] font-bold ${t.textPrimary(isDark)}`}>
                        Highest activity on <span className={accent.text}>{peakActivity.day}</span> around <span className={accent.text}>{peakActivity.hour}</span> 
                        {peakActivity.value > 0 && ` (${peakActivity.value} logins)`}
                    </p>
                </div>
            </div>

            <div className="relative overflow-x-auto pb-6 -mx-2 px-2 scrollbar-thin scrollbar-thumb-neutral-300">
                <div className="min-w-[700px]">
                    {/* Hour labels — spread across the top */}
                    <div className="flex gap-1 mb-2 ml-10">
                        {HOURS.map((h, i) => (
                            <div key={i} className={`flex-1 text-center text-[9px] font-black uppercase tracking-tighter transition-opacity ${i % 3 === 0 ? 'opacity-100' : 'opacity-20'} ${t.textMuted(isDark)}`}>
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* Heatmap Grid */}
                    <div className="space-y-1">
                        {DAYS.map((day, dow) => (
                            <div key={dow} className="flex items-center gap-1 group/row">
                                <div className={`w-9 flex-shrink-0 text-[10px] font-black uppercase text-right pr-2 ${t.textMuted(isDark)} group-hover/row:${t.textPrimary(isDark)} transition-colors`}>
                                    {day}
                                </div>
                                <div className="flex flex-1 gap-1">
                                    {heatmap[dow].map((count, hour) => (
                                        <motion.div
                                            key={hour}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5 + (dow * 0.05) + (hour * 0.01), duration: 0.2 }}
                                            className={`flex-1 h-6 rounded-md transition-all duration-300 cursor-help hover:scale-110 active:scale-90 hover:z-10 ${cellColor(count)} border ${isDark ? 'border-white/[0.02]' : 'border-black/[0.02]'}`}
                                            title={`${day} ${HOURS[hour]}: ${count} logins`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Legend + Insights */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Quiet</span>
                    <div className="flex items-center gap-1">
                        {[0, 0.2, 0.5, 0.8, 1].map((v, i) => (
                            <div key={i} className={`w-4 h-4 rounded-md ${cellColor(Math.round(v * max))}`} />
                        ))}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Very Busy</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${accent.bg}`} />
                    <p className={`text-[10px] font-bold ${t.textMuted(isDark)} uppercase tracking-widest`}>Data updating in real-time</p>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main OverviewTab ─────────────────────────────────────────────────────────

export function OverviewTab({ stats, paymentPlans, schoolsList, platformMetrics, loginHeatmap, onSync }: OverviewTabProps) {
    const { isDark, accent } = useAdminTheme();

    const fmt = (n: number) => n.toLocaleString('en-IN');
    const fmtRupee = (n: number) =>
        n >= 1_00_00_000 ? `₹${(n / 1_00_00_000).toFixed(2)}Cr`
        : n >= 1_00_000 ? `₹${(n / 1_00_000).toFixed(1)}L`
        : `₹${n.toLocaleString('en-IN')}`;

    // Memoised — only recomputed when source data actually changes
    const engagementData = useMemo(() => {
        if (platformMetrics.length === 0) {
            return [{ name: 'Active', students: stats.activeStudents, schools: stats.activeSchools, peak_concurrent: stats.pcu }];
        }
        return platformMetrics.map(m => ({
            name: new Date(m.metric_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            students: m.active_students,
            schools: m.active_schools,
            peak_concurrent: m.peak_concurrent || 0,
        }));
    }, [platformMetrics, stats.activeStudents, stats.activeSchools, stats.pcu]);

    const revenueData = useMemo(() => {
        if (platformMetrics.length === 0) return [{ month: 'Total', revenue: stats.totalRevenue }];
        return platformMetrics.map(m => ({
            month: new Date(m.metric_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            revenue: Number(m.revenue_total),
        }));
    }, [platformMetrics, stats.totalRevenue]);

    const planDistribution = useMemo(() => {
        const dist = paymentPlans.length > 0
            ? paymentPlans
                .map(p => ({ name: p.name, value: schoolsList.filter(s => s.plan_name === p.name).length }))
                .filter(item => item.value > 0)
            : [];
        if (dist.length === 0) {
            return [paymentPlans.length > 0
                ? { name: paymentPlans[0].name, value: 0 }
                : { name: 'No Active Subscriptions', value: 1 }];
        }
        return dist;
    }, [paymentPlans, schoolsList]);

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${t.accentSoft(isDark, accent)}`}>
                        <Activity size={20} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Real-time Platform Pulse</h3>
                        <p className={`text-[10px] font-bold ${t.textMuted(isDark)} uppercase tracking-widest`}>Aggregated platform performance metrics</p>
                    </div>
                </div>
                <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSync?.(); }} size="sm" variant="outline"
                    className={`rounded-full h-9 px-5 text-[10px] font-black border-2 gap-2 ${t.btnOutline(isDark)} transition-all hover:scale-105 active:scale-95`}>
                    <RefreshCw size={14} /> SYNC DATA
                </Button>
            </div>

            {/* ── Row 1: Primary KPI cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* MRR — Financial Health replaces "Onboarding Success" */}
                <StatCard
                    label="Monthly Recurring Revenue"
                    value={fmtRupee(stats?.mrr || 0)}
                    badge={`ARR ${fmtRupee(stats?.arr || 0)}`}
                    icon={IndianRupee}
                    delay={0}
                />
                <StatCard
                    label="Total Learners"
                    value={fmt(stats?.totalStudents || 0)}
                    icon={Users}
                    delay={0.05}
                />
                {/* DAU / MAU dual card */}
                <StatCard
                    label="Daily / Monthly Active"
                    value={fmt(stats?.dau || 0)}
                    subvalue={`/ ${fmt(stats?.mau || 0)} MAU`}
                    icon={TrendingUp}
                    delay={0.1}
                />
                <StatCard
                    label="Institutional Reach"
                    value={`${stats?.activeSchools || 0}`}
                    subvalue={`/ ${stats?.totalSchools || 0} total`}
                    icon={School}
                    delay={0.15}
                />
            </div>

            {/* ── Row 2: Supporting mini stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MiniStat label="All-time Revenue"  value={fmtRupee(stats?.totalRevenue || 0)} icon={BarChart2}      theme="accent" delay={0.2}  />
                <MiniStat label="Live Right Now"    value={fmt(stats?.pcu || 0)}               icon={Wifi}          theme="accent"   delay={0.24} />
                <MiniStat label="Paid Institutions" value={`${stats?.activeSubscriptions || 0} schools`} icon={GraduationCap} theme="accent" delay={0.28} />
            </div>

            {/* ── Row 3: Charts ── */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.36 }}>
                <EngagementCharts engagementData={engagementData} planDistribution={planDistribution} revenueData={revenueData} />
            </motion.div>

            {/* ── Row 4: Login Activity Heatmap ── */}
            <LoginHeatmap heatmap={loginHeatmap} />
        </div>
    );
}
