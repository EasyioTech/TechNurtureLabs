'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, TrendingUp, Award, BarChart3, Clock } from 'lucide-react';
import { getStudentDailyAnalytics } from '@/modules/student/actions/analytics-actions';
import { Skeleton } from '@/components/ui/skeleton';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getStudentDailyAnalytics().then(res => {
            if (isMounted) {
                setData(res);
                setLoading(false);
            }
        }).catch(err => {
            console.error(err);
            if (isMounted) setLoading(false);
        });
        return () => { isMounted = false; };
    }, []);

    if (loading || !data) {
        return <div className="p-12 min-h-screen bg-slate-50/30"><Skeleton className="h-[400px] w-full rounded-[3rem]" /></div>;
    }

    const { profile, chartData, summary } = data;

    return (
        <div className="min-h-screen bg-slate-50/30 pb-32">
            {/* Header / Hero Section */}
            <div className="relative bg-slate-900 overflow-hidden py-16 px-6 lg:px-12 border-b border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/student">
                            <button className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/10 hover:border-white/20">
                                <ArrowLeft size={18} />
                            </button>
                        </Link>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Daily Analytics</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none mb-8">
                                Learning <span className="text-indigo-500">Insights</span>
                            </h1>
                            <p className="text-slate-400 font-medium text-lg max-w-lg mb-12">
                                Track your daily engagement, XP gains, and quiz accuracy across the last 7 days.
                            </p>

                            <div className="flex flex-wrap items-center gap-10">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Weekly XP</span>
                                    <div className="flex items-center gap-3">
                                        <TrendingUp size={24} className="text-emerald-400" />
                                        <span className="text-3xl font-black text-white">+{summary.weeklyXp} XP</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:flex justify-end">
                            <div className="w-full max-w-sm aspect-square bg-indigo-600 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl shadow-indigo-600/30 border border-indigo-500/50">
                                <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-white mb-6 border border-white/20">
                                    <BarChart3 size={40} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">My Profile</h3>
                                <div className="flex flex-col gap-1 w-full mt-4 bg-black/20 rounded-2xl p-4">
                                    <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest flex justify-between">
                                        <span>Level</span> <span className="text-white">{profile.level}</span>
                                    </p>
                                    <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest flex justify-between">
                                        <span>Total XP</span> <span className="text-white">{profile.xp}</span>
                                    </p>
                                    <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest flex justify-between">
                                        <span>Longest Streak</span> <span className="text-white">{profile.longest_streak} Days</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <StatCard title="Weekly Lessons" value={summary.weeklyLessons} icon={Clock} color="bg-indigo-600" />
                    <StatCard title="Avg Accuracy" value={`${summary.avgWeeklyAccuracy}%`} icon={Target} color="bg-slate-800" />
                    <StatCard title="Weekly XP Rate" value={`+${summary.weeklyXp}`} icon={Award} color="bg-slate-600" />
                </div>

                {/* Performance Chart */}
                <div className="bg-white rounded-[3rem] p-8 sm:p-12 border border-slate-100 shadow-xl shadow-slate-200/20">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-4 sm:mb-0 border-l-4 border-indigo-600 pl-4">
                            7-Day XP Trend
                        </h3>
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            Updates dynamically
                        </p>
                    </div>

                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 700 }}
                                    dy={15}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 700 }}
                                    dx={-15}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    contentStyle={{
                                        borderRadius: '1.5rem',
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                        padding: '16px'
                                    }}
                                    itemStyle={{ color: '#0f172a', fontWeight: '900', fontSize: '14px' }}
                                    labelStyle={{ color: '#64748b', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="xp"
                                    stroke="#4f46e5"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#ffffff' }}
                                    activeDot={{ r: 8, fill: '#4f46e5', strokeWidth: 0 }}
                                    name="XP Earned"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </main>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-1">
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
                <p className="text-4xl font-black text-slate-900 mt-2">{value}</p>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white ${color}`}>
                <Icon size={32} />
            </div>
        </div>
    );
}
