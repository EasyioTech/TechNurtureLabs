'use client';

import React from 'react';
import Link from 'next/link';
import {
    Target, Flame, Star, Trophy, Timer,
    ChevronRight, Zap, Award as AwardIcon, CheckCircle2,
    BookOpen as BookIcon, Clock, Activity, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ChallengeCard } from '@/modules/student/components/challenge-card';
import { Button } from '@/components/ui/button';

interface ChallengesClientProps {
  initialData: {
    dailyChallenges: any[];
    stats: any;
  }
}

export function ChallengesClient({ initialData }: ChallengesClientProps) {
    const { dailyChallenges = [], stats } = initialData;

    const getChallengeIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            'book-open': BookIcon,
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
        <div className="min-h-screen bg-slate-50/10 pb-32 animate-in fade-in duration-700">
            {/* Strategic Header */}
            <div className="relative bg-slate-950 overflow-hidden py-24 lg:py-32 px-6 lg:px-12 border-b border-white/5">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="max-w-[1440px] mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-7">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-10 shadow-2xl"
                            >
                                <Target size={18} fill="currentColor" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Learning Goals</span>
                            </motion.div>

                            <h1 className="text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-12">
                                Daily <br />
                                <span className="text-indigo-500">Challenges</span>
                            </h1>

                            <div className="flex flex-wrap items-center gap-12 mt-16">
                                <QuickStat label="Learning Streak" value={`${stats.streak} Days`} icon={Flame} color="text-orange-500" />
                                <div className="hidden sm:block w-px h-16 bg-white/10" />
                                <QuickStat label="Total Points Earned" value={stats.xp.toLocaleString()} icon={Star} color="text-amber-400" />
                            </div>
                        </div>

                        <div className="lg:col-span-5 flex justify-end">
                            <div className="w-full max-w-md p-12 rounded-[4rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-600/40 group-hover:scale-110 transition-transform duration-500">
                                        <Trophy size={48} />
                                    </div>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Your Standing</h3>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-12">Rank #{stats.rank} / Top {stats.rankPercentage}%</p>
                                    <Link href="/student/leaderboard" className="w-full">
                                        <Button className="w-full h-20 bg-white text-slate-900 font-black uppercase tracking-widest text-[11px] rounded-[2.25rem] hover:bg-slate-50 transition-all flex items-center justify-center gap-4 hover:shadow-2xl active:scale-95">
                                            View Leaderboard <ArrowRight size={18} />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Content */}
            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 -mt-16 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    {/* Primary Objectives */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="bg-white rounded-[4rem] p-10 lg:p-16 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-slate-950 pointer-events-none">
                                <Activity size={200} />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-16 pb-8 border-b border-slate-50">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3">Active Challenges</h3>
                                    <div className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                                        <Timer size={16} /> Resets in {24 - new Date().getHours()}H
                                    </div>
                                </div>
                                <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">ID: CHALLENGE_SRV_2024</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">
                                {dailyChallenges.length > 0 ? dailyChallenges.map((challenge: any) => (
                                    <div key={challenge.id} className="group">
                                        <ChallengeCard
                                            title={challenge.title}
                                            progress={challenge.current_progress}
                                            total={challenge.target_value}
                                            reward={challenge.xp_reward}
                                            icon={getChallengeIcon(challenge.icon)}
                                            color={getChallengeColor(challenge.challenge_type)}
                                            unit={challenge.challenge_type === 'learning_time' ? 'm' : ''}
                                        />
                                    </div>
                                )) : (
                                    <div className="col-span-full py-32 bg-slate-50/50 rounded-[3rem] border-2 border-slate-100 border-dashed flex flex-col items-center justify-center text-center p-12">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center text-emerald-500 shadow-xl mb-8">
                                            <CheckCircle2 size={48} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">All Finished!</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-xs leading-relaxed">You have completed all your daily challenges. Check out the course library for more learning.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-slate-900 rounded-[4rem] p-10 lg:p-16 text-white border border-white/5 shadow-2xl shadow-indigo-950/20">
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-12">Your Stats Summary</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                <DetailedStat label="Lessons Completed" value={stats.lessonsCompleted} icon={BookIcon} color="bg-indigo-600" />
                                <DetailedStat label="Average Accuracy" value={`${stats.accuracy}%`} icon={Target} color="bg-emerald-600" />
                                <DetailedStat label="Total XP Earned" value={stats.xp.toLocaleString()} icon={Star} color="bg-amber-500" />
                            </div>
                        </section>
                    </div>

                    {/* Support Modules */}
                    <div className="lg:col-span-4 space-y-12">
                        <div className="bg-indigo-600 rounded-[4rem] p-12 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-12">Study Efficiency</h4>
                            
                            <div className="space-y-10 mb-16">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[11px] font-black uppercase tracking-widest">Target Accuracy</span>
                                        <span className="text-2xl font-black">{stats.accuracy}%</span>
                                    </div>
                                    <div className="h-4 bg-white/10 rounded-full p-1 border border-white/5 overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats.accuracy}%` }}
                                            className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" 
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Link href="/student/analytics">
                                <Button className="w-full h-20 bg-white text-indigo-600 font-black uppercase tracking-widest text-[11px] rounded-[2.25rem] hover:bg-slate-50 transition-all shadow-xl active:scale-95">
                                    View Detailed Stats
                                </Button>
                            </Link>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[4rem] p-12 shadow-xl shadow-slate-200/20 group">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12 text-center underline decoration-indigo-200 decoration-4 underline-offset-8">My Progress</h4>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 mb-8 group-hover:rotate-12 transition-transform duration-500 shadow-sm relative">
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-lg">
                                        L{Math.floor(stats.xp / 1000) + 1}
                                    </div>
                                    <AwardIcon size={40} strokeWidth={2.5} />
                                </div>
                                <h5 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">Level {Math.floor(stats.xp / 1000) + 1}</h5>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12">{1000 - (stats.xp % 1000)} XP to Next Level</p>
                                
                                <Link href="/student/achievements" className="w-full">
                                    <Button variant="ghost" className="w-full h-20 rounded-[2.25rem] border-2 border-slate-100 font-black uppercase tracking-widest text-[11px] text-slate-900 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all flex items-center justify-center gap-4">
                                        View Achievements <ChevronRight size={18} />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function QuickStat({ label, value, icon: Icon, color }: any) {
    return (
        <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${color} shadow-2xl`}>
                <Icon size={28} />
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{value}</p>
            </div>
        </div>
    );
}

function DetailedStat({ label, value, icon: Icon, color }: any) {
    return (
        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center mb-6 shadow-xl`}>
                <Icon size={24} />
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{label}</p>
            <p className="text-3xl font-black text-white leading-none tracking-tighter uppercase">{value}</p>
        </div>
    );
}
