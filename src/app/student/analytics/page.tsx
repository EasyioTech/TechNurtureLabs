'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, TrendingUp, Award, BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { getStudentDailyAnalytics } from '@/modules/student/actions/analytics-actions';
import { Skeleton } from '@/components/ui/skeleton';

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
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/student">
                            <button className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/10 hover:border-white/20">
                                <ArrowLeft size={18} />
                            </button>
                        </Link>
                        <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em]">Daily Analytics</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none mb-8">
                                Learning <span className="text-sky-500">Insights</span>
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
                            <div className="w-full max-w-sm aspect-square bg-sky-600 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl shadow-sky-600/30">
                                <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-white mb-6 border border-white/20">
                                    <BarChart3 size={40} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">My Profile</h3>
                                <div className="flex flex-col gap-1 w-full mt-4 bg-black/10 rounded-2xl p-4">
                                    <p className="text-sm font-bold text-sky-100 uppercase tracking-widest flex justify-between">
                                        <span>Level</span> <span className="text-white">{profile.level}</span>
                                    </p>
                                    <p className="text-sm font-bold text-sky-100 uppercase tracking-widest flex justify-between">
                                        <span>Total XP</span> <span className="text-white">{profile.xp}</span>
                                    </p>
                                    <p className="text-sm font-bold text-sky-100 uppercase tracking-widest flex justify-between">
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
                    <StatCard title="Weekly Lessons" value={summary.weeklyLessons} icon={Clock} color="bg-indigo-500" />
                    <StatCard title="Avg Accuracy" value={`${summary.avgWeeklyAccuracy}%`} icon={Target} color="bg-emerald-500" />
                    <StatCard title="Weekly XP Rate" value={`+${summary.weeklyXp}`} icon={Award} color="bg-amber-500" />
                </div>

                {/* Performance Chart Wrapper (Simulated) */}
                <div className="bg-white rounded-[3rem] p-8 sm:p-12 border border-slate-100 shadow-xl shadow-slate-200/20">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-4 sm:mb-0 border-l-4 border-sky-500 pl-4">
                            7-Day XP Trend
                        </h3>
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            Updates dynamically
                        </p>
                    </div>

                    <div className="flex overflow-x-auto gap-4 pb-4 items-end min-h-[300px] border-b-2 border-slate-100">
                        {chartData.map((day: any, idx: number) => {
                            // Find max XP to scale the bars
                            const maxXP = Math.max(...chartData.map((d: any) => d.xp)) || 100;
                            const heightPct = day.xp > 0 ? Math.max((day.xp / maxXP) * 100, 10) : 0;

                            return (
                                <div key={idx} className="flex-1 min-w-[60px] flex flex-col items-center justify-end gap-4 group">
                                    <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-sm font-black text-slate-900">{day.xp}</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">XP</span>
                                    </div>
                                    <div
                                        className={`w-full max-w-[48px] rounded-t-xl transition-all duration-500 ${heightPct > 0 ? 'bg-sky-500 shadow-lg shadow-sky-500/30' : 'bg-slate-100'}`}
                                        style={{ height: heightPct > 0 ? `${heightPct}%` : '8px' }}
                                    />
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">{day.date}</span>
                                    {day.accuracy > 0 && <span className="text-[9px] font-bold text-emerald-500 border border-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-full">{day.accuracy}% Acc</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </main>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between">
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
