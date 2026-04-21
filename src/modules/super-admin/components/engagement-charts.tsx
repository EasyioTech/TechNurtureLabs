'use client';

import React, { useState, useEffect } from 'react';
import { Activity, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useAdminTheme, t } from '../theme-context';

const CHART_COLORS = [
    '#a3e635', // Lime 400 (Primary)
    '#38bdf8', // Sky 400
    '#818cf8', // Indigo 400
    '#fbbf24', // Amber 400
    '#34d399', // Emerald 400
    '#f87171', // Red 400
];

interface EngagementChartsProps {
    engagementData: any[];
    planDistribution: any[];
    revenueData: any[];
}

export function EngagementCharts({ engagementData, planDistribution, revenueData }: EngagementChartsProps) {
    const { isDark, accent } = useAdminTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const grid = isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0';
    const axis = isDark ? '#94a3b8' : '#64748b'; // Slate 400 for dark mode, Slate 500 for light mode
    const ttBg = isDark ? '#0f172a' : '#ffffff';
    const ttBorder = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0';
    const ttColor = isDark ? '#f8fafc' : '#0f172a';
    const areaStroke = isDark ? accent.swatchDark : accent.swatchLight;
    const barFill = isDark ? accent.swatchDark : accent.swatchLight;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 rounded-[24px] border p-7 transition-all duration-500 shadow-xl shadow-black/5 min-w-0 ${t.card(isDark)}`}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-[#171717] text-white'}`}>
                                <Activity size={16} />
                            </div>
                            <div>
                                <h3 className={`text-xs font-black tracking-widest uppercase ${t.textPrimary(isDark)}`}>Growth Dynamics</h3>
                                <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Monitor student activity and institutional onboarding trends.</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[280px] w-full relative min-w-0 overflow-hidden">
                        {!mounted ? <div className="h-[280px] w-full" /> : <ResponsiveContainer width="100%" height="100%" minHeight={280} minWidth={0}>
                            <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={areaStroke} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={areaStroke} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="grad3" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                                <XAxis dataKey="name" stroke={axis} axisLine={false} tickLine={false} fontSize={10} tick={{ fontWeight: 700 }} />
                                <YAxis stroke={axis} axisLine={false} tickLine={false} fontSize={10} tick={{ fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: ttBg, border: `1px solid ${ttBorder}`, borderRadius: '16px', color: ttColor, fontSize: '11px', fontWeight: 800, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))', padding: '12px' }}
                                    itemStyle={{ padding: '2px 0' }}
                                />
                                <Area type="monotone" dataKey="students" name="Active Students" stroke={areaStroke} fill="url(#grad1)" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#1e293b' : '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="schools" name="Active Schools" stroke={isDark ? '#38bdf8' : '#0ea5e9'} fill="url(#grad2)" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                                <Area type="monotone" dataKey="peak_concurrent" name="Peak Concurrent" stroke={isDark ? '#a78bfa' : '#7c3aed'} fill="url(#grad3)" strokeWidth={2} dot={false} strokeDasharray="3 4" />
                            </AreaChart>
                        </ResponsiveContainer>}
                    </div>
                </div>

                <div className={`rounded-[24px] border p-7 transition-all duration-500 shadow-xl shadow-black/5 min-w-0 ${t.card(isDark)}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-[#171717] text-white'}`}>
                            <PieChartIcon size={16} />
                        </div>
                        <div>
                            <h3 className={`text-xs font-black tracking-widest uppercase ${t.textPrimary(isDark)}`}>Plan Distribution</h3>
                            <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Current market share across pricing tiers.</p>
                        </div>
                    </div>
                    <div className="h-[200px] w-full relative min-w-0 overflow-hidden">
                        {!mounted ? <div className="h-[200px] w-full" /> : <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={0}>
                            <PieChart>
                                <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" strokeWidth={0}>
                                    {planDistribution.map((_, i) => (
                                        <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: ttBg, border: `1px solid ${ttBorder}`, borderRadius: '12px', fontSize: '11px', fontWeight: 800 }} />
                            </PieChart>
                        </ResponsiveContainer>}
                    </div>
                    <div className="flex flex-col gap-2 mt-4 max-h-[140px] overflow-y-auto no-scrollbar">
                        {planDistribution.map((item, i) => (
                            <div key={item.name} className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-neutral-100 dark:hover:border-white/[0.02] hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                    <span className={`text-[11px] font-black uppercase tracking-tighter ${t.textPrimary(isDark)}`}>{item.name}</span>
                                </div>
                                <span className={`text-[11px] font-black ${t.textMuted(isDark)}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`rounded-[24px] border p-7 transition-all duration-500 shadow-xl shadow-black/5 ${t.card(isDark)}`}>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-[#171717] text-white'}`}>
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <h3 className={`text-xs font-black tracking-widest uppercase ${t.textPrimary(isDark)}`}>Revenue Performance</h3>
                            <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Track daily revenue growth and incoming transactions.</p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black ${isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-neutral-50 text-neutral-500 shadow-inner'}`}>
                        LAST 30 DAYS
                    </div>
                </div>
                <div className="h-[240px] w-full relative min-w-0 overflow-hidden">
                    {!mounted ? <div className="h-[240px] w-full" /> : <ResponsiveContainer width="100%" height="100%" minHeight={240} minWidth={0}>
                        <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                            <XAxis dataKey="month" stroke={axis} axisLine={false} tickLine={false} fontSize={10} tick={{ fontWeight: 700 }} />
                            <YAxis stroke={axis} axisLine={false} tickLine={false} fontSize={10} tick={{ fontWeight: 700 }} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`} />
                            <Tooltip
                                cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                                contentStyle={{ backgroundColor: ttBg, border: `1px solid ${ttBorder}`, borderRadius: '16px', color: ttColor, fontSize: '11px', fontWeight: 800, padding: '12px' }}
                                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill={barFill} radius={[6, 6, 6, 6]} barSize={revenueData.length > 10 ? 12 : 32} />
                        </BarChart>
                    </ResponsiveContainer>}
                </div>
            </div>
        </div>
    );
}
