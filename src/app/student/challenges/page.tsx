'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Target, Flame, Star, Trophy, Timer,
    ChevronRight, Zap, Award, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { getStudentDashboardData } from '@/modules/student/actions';
import { ChallengeCard } from '@/modules/student/components/challenge-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BookOpen as LucideBookOpen,
    Clock,
    Activity
} from 'lucide-react';

export default function ChallengesPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const result = await getStudentDashboardData();
                setData(result);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return <div className="p-12"><Skeleton className="h-96 w-full rounded-[3rem]" /></div>;
    }

    const { dailyChallenges = [], stats = { streak: 0, xp: 0, lessonsCompleted: 0, accuracy: 0, rank: 0, rankPercentage: 0 } } = data || {};

    const getChallengeIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            'book-open': LucideBookOpen,
            'trophy': Trophy,
            'clock': Clock,
            'star': Star,
            'target': Target,
            'zap': Zap,
            'flame': Flame,
        };
        return icons[iconName] || Target;
    };

    const getChallengeColor = (type: string) => {
        const colors: Record<string, string> = {
            'xp_gain': 'amber',
            'learning_time': 'sky',
            'quiz_complete': 'violet',
            'streak': 'emerald'
        };
        return colors[type] || 'emerald';
    };

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
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Challenges Hub</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none mb-8">
                                Daily <span className="text-indigo-500">Challenges</span>
                            </h1>
                            <p className="text-slate-400 font-medium text-lg max-w-lg mb-12">
                                Push your limits and earn extra rewards by completing daily learning goals.
                            </p>

                            <div className="flex flex-wrap items-center gap-10">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Streak</span>
                                    <div className="flex items-center gap-3">
                                        <Flame size={24} className="text-orange-500" />
                                        <span className="text-3xl font-black text-white">{stats.streak} Days</span>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-white/10 hidden sm:block" />
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total XP</span>
                                    <div className="flex items-center gap-3">
                                        <Star size={24} className="text-amber-400" />
                                        <span className="text-3xl font-black text-white">{stats.xp.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:flex justify-end">
                            <div className="w-full max-w-sm aspect-square bg-white/5 rounded-[3rem] border border-white/10 p-10 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-600/20">
                                    <Trophy size={40} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">My Rank</h3>
                                <p className="text-sm font-bold text-slate-500 uppercase mb-8">Rank #{stats.rank} (Top {stats.rankPercentage}%)</p>
                                <Button className="w-full h-14 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-100 transition-all">
                                    View Leaderboard
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Active Challenges List */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-12">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">Active Tasks</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Timer size={14} className="text-indigo-600" /> Resets in 14 hours
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {dailyChallenges.length > 0 ? dailyChallenges.map((challenge: any) => (
                                    <ChallengeCard
                                        key={challenge.id || challenge.title}
                                        title={challenge.title}
                                        progress={challenge.current_progress}
                                        total={challenge.target_value}
                                        reward={challenge.xp_reward}
                                        icon={getChallengeIcon(challenge.icon)}
                                        color={getChallengeColor(challenge.challenge_type)}
                                        unit={challenge.challenge_type === 'learning_time' ? 'm' : ''}
                                    />
                                )) : (
                                    <div className="col-span-full py-20 bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed flex flex-col items-center justify-center text-center">
                                        <CheckCircle2 size={40} className="text-emerald-500 mb-4" />
                                        <p className="text-sm font-black text-slate-900 uppercase">All caught up!</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Check back tomorrow for new challenges.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-10">Learning Stats</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                <StatItem label="Lessons Done" value={stats.lessonsCompleted} icon={LucideBookOpen} color="text-indigo-600" />
                                <StatItem label="Accuracy" value={`${stats.accuracy}%`} icon={Target} color="text-emerald-600" />
                                <StatItem label="XP Earned" value={stats.xp.toLocaleString()} icon={Star} color="text-amber-500" />
                            </div>
                        </section>
                    </div>

                    {/* Sidebar / Profile Snapshot */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-xl shadow-indigo-200">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-8">Quick Progress</h4>
                            <div className="space-y-8">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-black uppercase tracking-tight">Performance</span>
                                        <span className="text-xl font-black">{stats.accuracy}%</span>
                                    </div>
                                    <div className="h-4 bg-white/10 rounded-full p-1 overflow-hidden">
                                        <div className="h-full bg-white rounded-full" style={{ width: `${stats.accuracy}%` }} />
                                    </div>
                                </div>
                                <Button className="w-full h-14 bg-white text-indigo-600 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-50 transition-all">
                                    Daily Analytics
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm group">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10">Reward Progress</h4>
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-16 h-16 rounded-[1.75rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Award size={32} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-900 leading-none">Level {Math.floor(stats.xp / 500) + 1}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{stats.xp % 500} / 500 XP to Next Level</p>
                                </div>
                            </div>
                            <Link href="/student/achievements">
                                <Button variant="ghost" className="w-full h-14 rounded-2xl border border-slate-100 font-black uppercase tracking-widest text-[10px] text-slate-900 group-hover:bg-slate-50">
                                    My Achievements <ChevronRight size={14} className="ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatItem({ label, value, icon: Icon, color }: any) {
    return (
        <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
            <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center ${color} mb-4 shadow-sm`}>
                <Icon size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        </div>
    );
}
