'use client';

import React, { useState, useEffect } from 'react';
import {
    Trophy, Award, Medal, Star, Shield,
    ChevronRight, Zap, Target, Flame,
    ArrowLeft, Search, Filter, Share2
} from 'lucide-react';
import { getStudentAchievementsData } from '@/modules/student/actions/achievement-actions';
import { AchievementBadge } from '@/modules/student/components/achievement-badge';
import { StudentDashboardLoader } from '@/modules/student/components/dashboard-loader';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AchievementsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const result = await getStudentAchievementsData();
                setData(result);
            } catch (err) {
                console.error('Failed to load achievements:', err);
            }
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return <StudentDashboardLoader message="Synchronizing learning milestones..." />;
    }

    const { achievements = [], stats = { xp: 0, level: 0 } } = data || {};
    const unlockedCount = achievements.filter((a: any) => a.unlocked).length;
    const progressPct = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

    const beginnerBadges = achievements.filter((a: any) => a.category === 'Beginner');
    const advancedBadges = achievements.filter((a: any) => a.category === 'Advanced');
    const persistenceBadges = achievements.filter((a: any) => a.category === 'Persistence');
    const rankPercentage = stats.rankPercentage || 100;

    // Find next locked achievement as goal
    const nextGoalAch = achievements.find((a: any) => !a.unlocked);
    const nextGoal = nextGoalAch ? {
        name: nextGoalAch.name,
        requirement: nextGoalAch.description,
        progress: Math.min(100, Math.floor((stats.xp % 1000) / 10))
    } : null;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">

            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16">
                    {/* Left: Summary Stats */}
                    <div className="lg:col-span-4 space-y-8 md:space-y-10">
                        <div className="bg-white border border-slate-100 rounded-3xl md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />

                            <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 md:mb-12">Mastery</h3>

                            <div className="relative w-40 h-40 md:w-56 md:h-56 mx-auto mb-8 md:mb-12">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="none" className="text-slate-50 md:stroke-[18px]" />
                                    <circle
                                        cx="50%" cy="50%" r="45%"
                                        stroke="currentColor" strokeWidth="12" fill="none"
                                        strokeDasharray={`${progressPct * 2.8} 280`}
                                        className="text-indigo-600 shadow-xl md:stroke-[18px]"
                                        style={{ transition: 'stroke-dasharray 2s cubic-bezier(0.16, 1, 0.3, 1)', filter: 'drop-shadow(0 0 8px rgba(79, 70, 229, 0.4))' }}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{progressPct}<span className="text-lg md:text-xl text-slate-400">%</span></span>
                                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{unlockedCount} / {achievements.length}</span>
                                </div>
                            </div>

                            <div className="space-y-6 pt-10 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Zap size={14} fill="currentColor" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total XP</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">{stats.xp.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                            <Shield size={14} fill="currentColor" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery Level</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">Elite Scholar</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950 rounded-3xl md:rounded-[3.5rem] p-8 md:p-12 text-white shadow-2xl shadow-indigo-950/20 border border-white/5 overflow-hidden group relative">
                            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                            <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8 md:mb-10">{nextGoal ? 'Next Milestone' : 'Legacy Unlocked'}</h4>
                            <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 backdrop-blur-md shadow-inner ring-1 ring-white/10 group-hover:rotate-12 transition-transform">
                                    <Award size={32} className="md:size-[40px]" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-lg md:text-xl font-black uppercase tracking-tight mb-2 leading-none text-white transition-colors group-hover:text-amber-400">
                                        {nextGoal?.name || 'Grand Master'}
                                    </p>
                                    <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                        {nextGoal ? nextGoal.requirement : 'You have completed the current curriculum milestones.'}
                                    </p>
                                </div>
                            </div>
                            {nextGoal && (
                                <div className="space-y-4">
                                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-1000" style={{ width: `${nextGoal.progress}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        <span>Current Effort</span>
                                        <span className="text-white">{nextGoal.progress}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Achievement Grid */}
                    <div className="lg:col-span-8 space-y-8 md:space-y-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Milestone Gallery</h2>
                            </div>
                        </div>

                        {/* Sections by Category */}
                        {beginnerBadges.length > 0 && (
                            <AchievementSection title="Beginner Badges" count={beginnerBadges.length}>
                                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-12">
                                    {beginnerBadges.map((a: any) => (
                                        <AchievementBadge
                                            key={a.id}
                                            title={a.name}
                                            description={a.description}
                                            unlocked={a.unlocked}
                                            locked={!a.unlocked}
                                            category={a.tier}
                                            icon={a.icon_url}
                                        />
                                    ))}
                                </div>
                            </AchievementSection>
                        )}

                        {advancedBadges.length > 0 && (
                            <AchievementSection title="Advanced Badges" count={advancedBadges.length}>
                                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-12">
                                    {advancedBadges.map((a: any) => (
                                        <AchievementBadge
                                            key={a.id}
                                            title={a.name}
                                            description={a.description}
                                            unlocked={a.unlocked}
                                            locked={!a.unlocked}
                                            category={a.tier}
                                            icon={a.icon_url}
                                        />
                                    ))}
                                </div>
                            </AchievementSection>
                        )}

                        {persistenceBadges.length > 0 && (
                            <AchievementSection title="Persistence Badges" count={persistenceBadges.length}>
                                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-12">
                                    {persistenceBadges.map((a: any) => (
                                        <AchievementBadge
                                            key={a.id}
                                            title={a.name}
                                            description={a.description}
                                            unlocked={a.unlocked}
                                            locked={!a.unlocked}
                                            category={a.category}
                                            icon={a.icon}
                                        />
                                    ))}
                                </div>
                            </AchievementSection>
                        )}

                        {achievements.length === 0 && (
                            <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-inner">
                                <Shield size={48} className="mx-auto text-slate-200 mb-6" />
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Milestones Yet</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-xs mx-auto">Complete your first lesson to begin your journey.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function AchievementSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
    return (
        <section className="bg-white border border-slate-100 rounded-3xl md:rounded-[3.5rem] p-6 md:p-12 pb-12 md:pb-16 shadow-2xl shadow-slate-200/40 relative overflow-hidden group/section transition-all hover:border-slate-300">
            <div className="flex items-center justify-between mb-8 md:mb-16">
                <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs md:text-sm">
                        {title.charAt(0)}
                    </div>
                    <h3 className="text-sm md:text-base font-black text-slate-950 uppercase tracking-tight leading-none">{title}</h3>
                </div>
                <span className="text-[8px] md:text-[9px] font-black text-slate-400 bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-slate-100 uppercase tracking-widest">{count} Milestone{count !== 1 ? 's' : ''}</span>
            </div>
            {children}
            <div className="absolute bottom-0 right-0 w-24 h-1 bg-gradient-to-l from-indigo-500 to-transparent group-hover/section:w-full transition-all duration-1000" />
        </section>
    );
}
