'use client';

import React, { useState, useEffect } from 'react';
import {
    Trophy, Award, Medal, Star, Shield,
    ChevronRight, Zap, Target, Flame,
    ArrowLeft, Search, Filter, Share2
} from 'lucide-react';
import { getStudentDashboardData } from '@/modules/student/actions';
import { AchievementBadge } from '@/modules/student/components/achievement-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function AchievementsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const result = await getStudentDashboardData();
            setData(result);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return <div className="p-12"><Skeleton className="h-96 w-full rounded-[3rem]" /></div>;
    }

    const { achievements = [], stats = { xp: 0, level: 0, rankPercentage: 0 }, nextGoal = null } = data || {};
    const unlockedCount = achievements.filter((a: any) => a.unlocked).length;
    const progressPct = Math.round((unlockedCount / (achievements.length || 1)) * 100);

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Minimalist Top Nav */}
            <div className="bg-white border-b border-slate-100 h-20 flex items-center px-6 lg:px-12 sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/student">
                            <button className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200">
                                <ArrowLeft size={18} />
                            </button>
                        </Link>
                        <div className="h-6 w-px bg-slate-100 hidden sm:block" />
                        <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">My Achievements</h4>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600">
                            <Trophy size={14} fill="currentColor" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{unlockedCount} Badges Earned</span>
                        </div>
                        <Button className="h-10 px-5 rounded-xl bg-slate-950 text-white font-black uppercase tracking-widest text-[9px] hover:bg-slate-900">
                            Export Certificate <Share2 size={12} className="ml-2" />
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Summary Stats */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />

                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Achievement Progress</h3>

                            <div className="relative w-48 h-48 mx-auto mb-10">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="none" className="text-slate-50" />
                                    <circle
                                        cx="96" cy="96" r="88"
                                        stroke="currentColor" strokeWidth="12" fill="none"
                                        strokeDasharray={`${progressPct * 5.529} 552.9`}
                                        className="text-indigo-600"
                                        style={{ transition: 'stroke-dasharray 2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-slate-900 leading-none">{progressPct}<span className="text-sm text-slate-400">%</span></span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{unlockedCount} / {achievements.length}</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</span>
                                    <span className="text-sm font-black text-slate-900">{stats.xp.toLocaleString()} XP</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Rank</span>
                                    <span className="text-sm font-black text-slate-900">Top {stats.rankPercentage}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-900/10 border border-white/5 overflow-hidden group relative">
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-8">{nextGoal ? 'Next Goal' : 'All Badges Unlocked'}</h4>
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-amber-400 backdrop-blur-md">
                                    <Medal size={32} />
                                </div>
                                <div>
                                    <p className="text-lg font-black uppercase tracking-tight mb-1 leading-none text-white transition-colors group-hover:text-amber-400">
                                        {nextGoal?.name || 'Master Learner'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {nextGoal ? nextGoal.requirement : 'You have earned all basic badges!'}
                                    </p>
                                </div>
                            </div>
                            {nextGoal && (
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-amber-400 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]" style={{ width: `${nextGoal.progress}%` }} />
                                </div>
                            )}
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                                {nextGoal ? `Progress ${nextGoal.progress}%` : 'Complete!'}
                            </p>
                        </div>
                    </div>

                    {/* Right: Achievement Grid */}
                    <div className="lg:col-span-8 space-y-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">My Badges</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A record of your learning milestones</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-3 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all"><Search size={18} /></button>
                                <button className="p-3 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all"><Filter size={18} /></button>
                            </div>
                        </div>

                        {/* Sections by Category */}
                        <AchievementSection title="Beginner Badges" count={4}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-12">
                                {achievements.slice(0, 8).map((a: any) => (
                                    <AchievementBadge
                                        key={a.id}
                                        title={a.name}
                                        description={a.requirement || "Learning Milestone"}
                                        unlocked={a.unlocked}
                                        locked={!a.unlocked}
                                    />
                                ))}
                            </div>
                        </AchievementSection>

                        <AchievementSection title="Advanced Badges" count={2}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-12">
                                {achievements.slice(8, 12).map((a: any) => (
                                    <AchievementBadge
                                        key={a.id}
                                        title={a.name}
                                        description={a.requirement || "Elite Performance"}
                                        unlocked={a.unlocked}
                                        locked={!a.unlocked}
                                        category="academic"
                                    />
                                ))}
                            </div>
                        </AchievementSection>

                        <AchievementSection title="Persistence Badges" count={1}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-12">
                                {achievements.slice(12, 16).map((a: any) => (
                                    <AchievementBadge
                                        key={a.id}
                                        title={a.name}
                                        description={a.requirement || "Persistence Badge"}
                                        unlocked={a.unlocked}
                                        locked={!a.unlocked}
                                        category="speed"
                                    />
                                ))}
                            </div>
                        </AchievementSection>
                    </div>
                </div>
            </main>
        </div>
    );
}

function AchievementSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
    return (
        <section className="bg-white border border-slate-100 rounded-[3rem] p-10 pb-16 shadow-sm">
            <div className="flex items-center gap-4 mb-12">
                <div className="h-6 w-1 bg-indigo-600 rounded-full" />
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">{title}</h3>
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{count} Active</span>
            </div>
            {children}
        </section>
    );
}
