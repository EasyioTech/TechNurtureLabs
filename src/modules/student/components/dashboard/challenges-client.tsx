'use client';

import React from 'react';
import Link from 'next/link';
import {
    Target, Flame, Star, Trophy, Timer,
    ChevronRight, Zap, Award as AwardIcon, CheckCircle2,
    BookOpen as BookIcon, Clock, Activity, ArrowRight, Wand2, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ChallengeItem } from '@/modules/student/components/challenge-item';
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
            'streak': 'emerald',
            'lesson_complete': 'emerald'
        };
        return colors[type] || 'emerald';
    };

    return (
        <div className="min-h-screen bg-slate-50/10 pb-20">
            {/* Strategic Header */}
            <div className="relative bg-slate-950 overflow-hidden py-16 md:py-20 lg:py-24 px-6 lg:px-12 border-b border-white/5">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="max-w-[1440px] mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                        <div className="lg:col-span-7">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-8 shadow-2xl"
                            >
                                <ShieldAlert size={16} fill="currentColor" />
                                <span className="text-[9px] font-black uppercase tracking-[0.4em]">Mission Protocols</span>
                            </motion.div>

                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-8 lg:mb-10">
                                Mission <br />
                                <span className="text-indigo-500">Protocols</span>
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 md:gap-10 mt-10 lg:mt-12">
                                <QuickStat label="Learning Streak" value={`${stats.streak} Days`} icon={Flame} color="text-orange-500" />
                                <div className="hidden sm:block w-px h-12 bg-white/10" />
                                <QuickStat label="Total Points Earned" value={stats.xp.toLocaleString()} icon={Star} color="text-amber-400" />
                            </div>
                        </div>

                        <div className="lg:col-span-5 flex justify-end">
                            <div className="w-full max-w-md p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[2.25rem] bg-indigo-600 flex items-center justify-center text-white mb-4 md:mb-6 shadow-2xl shadow-indigo-600/40 group-hover:scale-110 transition-transform duration-500">
                                        <Trophy size={24} className="md:hidden" />
                                        <Trophy size={40} className="hidden md:block" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-2">Your Standing</h3>
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Rank #{stats.rank} / Top {stats.rankPercentage}%</p>
                                    <Link href="/student/leaderboard" className="w-full">
                                        <Button className="w-full h-12 md:h-16 bg-white text-slate-900 font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl md:rounded-[1.75rem] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 hover:shadow-2xl active:scale-95">
                                            View Leaderboard <ArrowRight size={14} />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Content */}
            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 -mt-8 md:-mt-12 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Primary Objectives */}
                    <div className="lg:col-span-8 space-y-8 lg:space-y-12">
                        <section className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 lg:p-12 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-950 pointer-events-none">
                                <Activity size={160} />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-50">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Primary Objectives</h3>
                                    <div className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                                        <Wand2 size={14} className="animate-pulse" /> Resets in {(() => { const now = new Date(); const h = 23 - now.getHours(); const m = 59 - now.getMinutes(); return h > 0 ? `${h}H ${m}M` : `${m}M`; })()}
                                    </div>
                                </div>
                                <div className="text-[10px] md:text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">ID: CHALLENGE_SRV_2024</div>
                            </div>

                            <div className="flex flex-col gap-6 lg:gap-8">
                                {dailyChallenges.length > 0 ? dailyChallenges.map((challenge: any) => (
                                    <div key={challenge.id} className="group">
                                        <ChallengeItem
                                            title={challenge.title}
                                            progress={challenge.current_progress}
                                            total={challenge.target_value}
                                            reward={challenge.xp_reward}
                                            icon={getChallengeIcon(challenge.icon)}
                                            color={getChallengeColor(challenge.challenge_type)}
                                            unit={challenge.challenge_type === 'learning_time' ? 'm' : ''}
                                            description={challenge.description}
                                        />
                                    </div>
                                )) : (
                                    <div className="col-span-full py-24 bg-slate-50/50 rounded-[2.5rem] border-2 border-slate-100 border-dashed flex flex-col items-center justify-center text-center p-12">
                                        <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center text-emerald-500 shadow-xl mb-6">
                                            <CheckCircle2 size={40} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">All Finished!</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-xs leading-relaxed">You have completed all your daily challenges. Check out the course library for more learning.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 lg:p-12 text-white border border-white/5 shadow-2xl shadow-indigo-950/20">
                            <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-8 lg:mb-10 text-slate-400">Your Stats Summary</h3>
                            <div className="grid grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                                <DetailedStat label="Lessons Mastered" value={stats.lessonsCompleted} icon={AwardIcon} color="text-indigo-400" bg="bg-indigo-500/10" />
                                <DetailedStat label="Accuracy Rate" value={`${stats.accuracy}%`} icon={Activity} color="text-emerald-400" bg="bg-emerald-500/10" />
                                <DetailedStat label="Total XP" value={stats.xp.toLocaleString()} icon={Zap} color="text-amber-400" bg="bg-amber-500/10" />
                            </div>
                        </section>
                    </div>

                    {/* Support Modules */}
                    <div className="lg:col-span-4 space-y-8 lg:space-y-12">
                        <div className="bg-indigo-600 rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/50 mb-10">Performance Analytics</h4>
                            
                            <div className="space-y-10 mb-12">
                                <div>
                                    <div className="flex items-center justify-between mb-3.5">
                                        <div className="flex items-center gap-2">
                                            <Target size={12} className="text-white/70" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Accuracy</span>
                                        </div>
                                        <span className="text-xl font-black">{stats.accuracy}%</span>
                                    </div>
                                    <div className="h-3 bg-white/10 rounded-full p-0.5 border border-white/5 overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats.accuracy}%` }}
                                            className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-3.5">
                                        <div className="flex items-center gap-2">
                                            <Zap size={12} className="text-white/70" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Efficiency</span>
                                        </div>
                                        <span className="text-xl font-black">{stats.efficiency}%</span>
                                    </div>
                                    <div className="h-3 bg-white/10 rounded-full p-0.5 border border-white/5 overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats.efficiency}%` }}
                                            className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Link href="/student/analytics">
                                <Button className="w-full h-12 md:h-16 bg-white text-indigo-600 font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl md:rounded-[1.75rem] hover:bg-slate-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2.5">
                                    Analytics Dashboard <ChevronRight size={14} />
                                </Button>
                            </Link>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 shadow-xl shadow-slate-200/20 group">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 text-center underline decoration-indigo-200 decoration-2 underline-offset-8">My Progress</h4>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 mb-6 group-hover:rotate-12 transition-transform duration-500 shadow-sm relative">
                                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black shadow-lg">
                                        L{Math.floor(stats.xp / 1000) + 1}
                                    </div>
                                    <AwardIcon size={32} strokeWidth={2.5} />
                                </div>
                                <h5 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2.5">Level {Math.floor(stats.xp / 1000) + 1}</h5>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">{1000 - (stats.xp % 1000)} XP to Next Level</p>
                                
                                <Link href="/student/achievements" className="w-full">
                                    <Button variant="ghost" className="w-full h-12 md:h-16 rounded-xl md:rounded-[1.75rem] border border-slate-100 font-black uppercase tracking-widest text-[9px] md:text-[10px] text-slate-900 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all flex items-center justify-center gap-3">
                                        View Achievements <ChevronRight size={14} />
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
        <div className="flex items-center gap-3 lg:gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${color} shadow-2xl`}>
                <Icon size={18} className="md:hidden" />
                <Icon size={22} className="hidden md:block" />
            </div>
            <div>
                <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-lg md:text-xl lg:text-2xl font-black text-white uppercase tracking-tighter leading-none">{value}</p>
            </div>
        </div>
    );
}

function DetailedStat({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-white/5 border border-white/5 flex flex-col items-center text-center group hover:bg-white/10 transition-all">
            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${bg} ${color} flex items-center justify-center mb-4 md:mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <Icon size={18} className="md:hidden" strokeWidth={2.5} />
                <Icon size={28} className="hidden md:block" strokeWidth={2.5} />
            </div>
            <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
            <p className="text-base md:text-2xl lg:text-3xl font-black text-white leading-none tracking-tighter uppercase">{value}</p>
        </div>
    );
}
