'use client';

import React from 'react';
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
    const { isDark } = useAdminTheme();
    const grid = isDark ? 'rgba(255,255,255,0.03)' : '#f5f5f5';
    const axis = isDark ? '#475569' : '#a3a3a3';
    const ttBg = isDark ? '#0f172a' : '#fff';
    const ttBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e5e5';
    const ttColor = isDark ? '#fff' : '#171717';
    const areaStroke = isDark ? '#a3e635' : '#171717';
    const barFill = isDark ? '#a3e635' : '#171717';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 rounded-[24px] border p-7 transition-all duration-500 shadow-xl shadow-black/5 ${t.card(isDark)}`}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-[#171717] text-white'}`}>
                                <Activity size={16} />
                            </div>
                            <div>
                                <h3 className={`text-xs font-black tracking-widest uppercase ${t.textPrimary(isDark)}`}>User Activity</h3>
                                <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Monitor student engagement and lesson completion trends.</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={engagementData}>
                                <defs>
                                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={areaStroke} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={areaStroke} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                                <XAxis dataKey="name" stroke={axis} axisLine={false} tickLine={false} fontSize={10} tick={{ fontWeight: 700 }} />
                                <YAxis stroke={axis} axisLine={false} tickLine={false} fontSize={10} tick={{ fontWeight: 700 }} />
                                <Tooltip contentStyle={{ backgroundColor: ttBg, border: `1px solid ${ttBorder}`, borderRadius: '12px', color: ttColor, fontSize: '11px', fontWeight: 800, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }} />
                                <Area type="monotone" dataKey="students" stroke={areaStroke} fill="url(#grad1)" strokeWidth={3} dot={false} />
                                <Area type="monotone" dataKey="lessons" stroke={isDark ? '#0ea5e9' : '#475569'} fill="url(#grad2)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`rounded-[24px] border p-7 transition-all duration-500 shadow-xl shadow-black/5 ${t.card(isDark)}`}>
                    <div className="flex items-center gap-3 mb-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-[#171717] text-white'}`}>
                            <PieChartIcon size={16} />
                        </div>
                        <div>
                            <h3 className={`text-xs font-black tracking-widest uppercase ${t.textPrimary(isDark)}`}>Subscription Breakdown</h3>
                            <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Distribution of schools across pricing plans.</p>
                        </div>
                    </div>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value" strokeWidth={0}>
                                    {planDistribution.map((_, i) => (
                                        <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: ttBg, border: `1px solid ${ttBorder}`, borderRadius: '12px', fontSize: '11px', fontWeight: 800 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        {planDistribution.map((item, i) => (
                            <div key={item.name} className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-neutral-100 dark:hover:border-white/[0.02] hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                    <span className={`text-[11px] font-black uppercase tracking-tighter ${t.textPrimary(isDark)}`}>{item.name}</span>
                                </div>
                                <span className={`text-[11px] font-black ${t.textMuted(isDark)}`}>{item.value}%</span>
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
                            <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Track monthly revenue growth and transactions.</p>
                        </div>
                    </div>
                </div>
                <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                            <XAxis dataKey="month" stroke={axis} axisLine={false} tickLine={false} fontSize={10} tick={{ fontWeight: 700 }} />
                            <YAxis stroke={axis} axisLine={false} tickLine={false} fontSize={10} tick={{ fontWeight: 700 }} />
                            <Tooltip
                                cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                                contentStyle={{ backgroundColor: ttBg, border: `1px solid ${ttBorder}`, borderRadius: '12px', color: ttColor, fontSize: '11px', fontWeight: 800 }}
                                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill={barFill} radius={[8, 8, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
