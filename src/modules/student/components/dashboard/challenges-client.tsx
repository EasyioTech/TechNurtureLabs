'use client';

import React from 'react';
import Link from 'next/link';
import {
    Target, Flame, Star, Trophy, Timer,
    ChevronRight, Zap, Award as AwardIcon, CheckCircle2,
    BookOpen as BookIcon, Clock, Activity, ArrowRight, Wand2, ShieldAlert,
    BarChart3, LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ChallengeItem } from '@/modules/student/components/challenge-item';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        <div className="min-h-screen bg-slate-50/10 pb-20 overflow-x-hidden">
            {/* Header Redesign: Modern & Clean */}
            <div className="relative bg-white border-b border-slate-100 py-12 md:py-20 px-6 lg:px-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-60" />
                
                <div className="max-w-[1440px] mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7">
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-8"
                            >
                                <LayoutDashboard size={14} className="fill-indigo-100" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Growth Mission</span>
                            </motion.div>

                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-6">
                                Mission <br />
                                <span className="text-indigo-600">Objectives</span>
                            </h1>
                            <p className="text-slate-500 font-bold text-sm md:text-base max-w-xl leading-relaxed mb-10">
                                Complete your daily mission protocols to earn XP, maintain your streak, and climb the platform leaderboard. Precision and consistency are your primary directives.
                            </p>

                            <div className="flex flex-wrap items-center gap-6 lg:gap-10">
                                <QuickStat label="Active Streak" value={`${stats.streak} Days`} icon={Flame} color="text-orange-500" bg="bg-orange-50" />
                                <div className="hidden sm:block w-px h-12 bg-slate-100" />
                                <QuickStat label="Total Points" value={stats.xp.toLocaleString()} icon={Star} color="text-amber-500" bg="bg-amber-50" />
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-500">
                                    <Trophy size={120} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Global Ranking</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">ID: STUDENT_PROTOCOL_{stats.rank}</p>
                                    
                                    <div className="grid grid-cols-2 gap-6 mb-10">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Rank</p>
                                            <p className="text-2xl font-black text-white">#{stats.rank}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Percentile</p>
                                            <p className="text-2xl font-black text-emerald-400">TOP {stats.rankPercentage}%</p>
                                        </div>
                                    </div>

                                    <Link href="/student/leaderboard" className="w-full">
                                        <Button className="w-full h-14 bg-white text-slate-950 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-100 shadow-xl active:scale-95 flex items-center justify-center gap-3">
                                            Open Leaderboard <ArrowRight size={14} />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Content */}
            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 mt-12 md:mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Primary Objectives */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 pb-8 border-b border-slate-50">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Primary Objectives</h3>
                                    <div className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                        <Clock size={14} className="animate-pulse" /> 
                                        Daily Reset In: {(() => { const now = new Date(); const h = 23 - now.getHours(); const m = 59 - now.getMinutes(); return h > 0 ? `${h}H ${m}M` : `${m}M`; })()}
                                    </div>
                                </div>
                                <div className="hidden md:block px-4 py-1.5 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] rounded-lg border border-slate-100">
                                    VERIFICATION_ACTIVE
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                {dailyChallenges.length > 0 ? dailyChallenges.map((challenge: any) => (
                                    <ChallengeItem
                                        key={challenge.id}
                                        title={challenge.title}
                                        progress={challenge.current_progress}
                                        total={challenge.target_value}
                                        reward={challenge.xp_reward}
                                        icon={getChallengeIcon(challenge.icon)}
                                        color={getChallengeColor(challenge.challenge_type)}
                                        unit={challenge.challenge_type === 'learning_time' ? 'm' : ''}
                                        description={challenge.description}
                                    />
                                )) : (
                                    <div className="col-span-full py-24 bg-emerald-50/50 rounded-[2rem] border-2 border-emerald-100 border-dashed flex flex-col items-center justify-center text-center p-12">
                                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10 mb-6">
                                            <CheckCircle2 size={40} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">Protocols Mastered</h4>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-xs leading-relaxed">
                                            You have successfully completed all your daily assignments. New mission parameters will be synchronized tomorrow.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-10 text-center underline decoration-indigo-200 underline-offset-8">Critical Metrics</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <DetailedStat label="Lessons Completed" value={stats.lessonsCompleted} icon={AwardIcon} color="text-indigo-600" bg="bg-indigo-50" />
                                <DetailedStat label="Average Accuracy" value={`${stats.accuracy}%`} icon={Activity} color="text-emerald-600" bg="bg-emerald-50" />
                                <DetailedStat label="Growth Velocity" value={`${stats.efficiency}%`} icon={Zap} color="text-amber-600" bg="bg-amber-50" />
                            </div>
                        </section>
                    </div>

                    {/* Support Modules */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="bg-indigo-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
                                <BarChart3 size={100} />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-100/50 mb-10">Intelligence Analytics</h4>
                            
                            <div className="space-y-10 mb-12">
                                <ProgressMetric label="Performance Accuracy" value={stats.accuracy} />
                                <ProgressMetric label="Learning Efficiency" value={stats.efficiency} />
                            </div>

                            <Link href="/student/analytics" className="w-full">
                                <Button className="w-full h-16 bg-white text-indigo-600 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                                    Analytics Dashboard <ChevronRight size={14} />
                                </Button>
                            </Link>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/10 group">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm relative">
                                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-lg">
                                        L{Math.floor(stats.xp / 1000) + 1}
                                    </div>
                                    <AwardIcon size={32} strokeWidth={2.5} />
                                </div>
                                <h5 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">Candidate Status</h5>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-12 italic">
                                    {1000 - (stats.xp % 1000)} XP remaining until next promotion
                                </p>
                                
                                <Link href="/student/achievements" className="w-full">
                                    <Button variant="ghost" className="w-full h-16 rounded-2xl border border-slate-100 font-black uppercase tracking-widest text-[10px] text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                                        View Achievements <ArrowRight size={14} />
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

function QuickStat({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm", bg, color)}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{value}</p>
            </div>
        </div>
    );
}

function DetailedStat({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="p-8 rounded-[2rem] bg-white border border-slate-100 flex flex-col items-center text-center group hover:border-slate-300 hover:shadow-lg transition-all duration-500">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500", bg, color)}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-tight">{label}</p>
            <p className="text-2xl font-black text-slate-950 leading-none tracking-tight uppercase">{value}</p>
        </div>
    );
}

function ProgressMetric({ label, value }: { label: string, value: number }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100/70">{label}</span>
                <span className="text-xl font-black text-white">{value}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full border border-white/5 overflow-hidden p-0.5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}
