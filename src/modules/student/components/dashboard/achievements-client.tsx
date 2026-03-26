'use client';

import React from 'react';
import {
    Trophy, Award, Shield, Zap,
    ChevronRight, Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AchievementBadge } from '@/modules/student/components/achievement-badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AchievementsClientProps {
  initialData: {
    achievements: any[];
    stats: any;
  }
}

export function AchievementsClient({ initialData }: AchievementsClientProps) {
    const { achievements = [], stats } = initialData;
    const unlockedCount = achievements.filter((a: any) => a.unlocked).length;
    const progressPct = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

    const beginnerBadges = achievements.filter((a: any) => a.category === 'Beginner' || a.tier === 'bronze');
    const advancedBadges = achievements.filter((a: any) => a.category === 'Advanced' || a.tier === 'gold' || a.tier === 'platinum');
    const persistenceBadges = achievements.filter((a: any) => a.category === 'Persistence' || a.tier === 'silver');

    const nextGoalAch = achievements.find((a: any) => !a.unlocked);
    const nextGoal = nextGoalAch ? {
        name: nextGoalAch.name,
        requirement: nextGoalAch.description,
        progress: Math.min(100, Math.round(((stats.xp % 1000) / 1000) * 100))
    } : null;

    return (
        <div className="min-h-screen bg-slate-50/10 pb-20">
            {/* Elite Header */}
            <div className="relative bg-slate-950 overflow-hidden py-16 md:py-20 lg:py-24 px-6 lg:px-12 border-b border-white/5">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
                
                <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col items-center text-center">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white mb-6 md:mb-8 shadow-2xl shadow-indigo-600/40"
                    >
                        <Trophy size={28} className="md:hidden" />
                        <Trophy size={40} className="hidden md:block" />
                    </motion.div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                        My <span className="text-indigo-500">Achievements</span>
                    </h1>
                    
                    <p className="max-w-xl text-slate-400 font-bold text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] leading-relaxed mb-10 md:mb-12">
                        A complete record of your academic milestones and learning achievements.
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full max-w-4xl">
                        <StatusCard label="Milestones" value={`${unlockedCount} / ${achievements.length}`} icon={Award} />
                        <StatusCard label="Completion" value={`${progressPct}%`} icon={Star} />
                        <StatusCard label="Rank" value={`#${stats.rank || '-'}`} icon={Trophy} />
                        <StatusCard label="Tier" value={`Lvl ${stats.level}`} icon={Shield} />
                    </div>
                </div>
            </div>

            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 -mt-8 md:-mt-12 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Mastery Analysis */}
                    <div className="lg:col-span-4 space-y-8 lg:space-y-12">
                        <section className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 lg:p-12 border border-slate-100 shadow-2xl shadow-slate-200/40 flex flex-col items-center">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] md:tracking-[0.4em] mb-8 lg:mb-10">Overall Progress</h3>
                            
                            <div className="relative w-36 h-36 md:w-56 md:h-56 mb-10 lg:mb-12">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="none" className="text-slate-50 md:stroke-[15px]" />
                                    <motion.circle
                                        cx="50%" cy="50%" r="45%"
                                        stroke="currentColor" strokeWidth="12" fill="none"
                                        strokeDasharray="282.7"
                                        initial={{ strokeDashoffset: 282.7 }}
                                        animate={{ strokeDashoffset: 282.7 - (progressPct * 2.827) }}
                                        className="text-indigo-600 md:stroke-[15px]"
                                        strokeLinecap="round"
                                        transition={{ duration: 2, ease: "easeOut" }}
                                        style={{ filter: 'drop-shadow(0 0 12px rgba(79, 70, 229, 0.4))' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{progressPct}%</span>
                                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{unlockedCount} Units</span>
                                </div>
                            </div>

                            <div className="w-full space-y-5 pt-10 border-t border-slate-50">
                                <MasteryStat label="Total Points" value={stats.xp.toLocaleString()} icon={Zap} color="text-indigo-600" />
                                <MasteryStat label="Current Status" value="Dedicated Student" icon={Shield} color="text-amber-500" />
                            </div>
                        </section>

                        <div className="bg-slate-950 rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl shadow-indigo-950/20 border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent pointer-events-none" />
                            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-10">Next Milestone Goal</h4>
                            
                            {nextGoal ? (
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 md:gap-5 mb-8 md:mb-10">
                                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <Award size={28} className="md:hidden" strokeWidth={1.5} />
                                            <Award size={32} className="hidden md:block" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="text-lg md:text-xl font-black uppercase tracking-tight mb-1 text-white group-hover:text-amber-400 transition-colors">{nextGoal.name}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed line-clamp-2">{nextGoal.requirement}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-2.5 bg-white/5 rounded-full p-0.5 border border-white/5 overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${nextGoal.progress}%` }}
                                                className="h-full bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                                                transition={{ duration: 1.5, delay: 0.5 }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                            <span>Synchronization</span>
                                            <span className="text-white">{nextGoal.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Trophy size={40} className="mx-auto text-amber-400 mb-4" />
                                    <p className="text-xs font-black uppercase">All Badges Earned!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operational Gallery */}
                    <div className="lg:col-span-8 space-y-8 lg:space-y-12">
                        <section className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 lg:p-12 border border-slate-100 shadow-2xl shadow-slate-200/40">
                             <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-10 pb-6 border-b border-slate-50 flex items-center justify-between">
                                Achievement Gallery
                                <span className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase">Badge Tier</span>
                             </h2>

                             <div className="space-y-20">
                                <AchievementSection title="Starter Achievements" badges={beginnerBadges} />
                                <AchievementSection title="Advanced Milestones" badges={advancedBadges} />
                                <AchievementSection title="Persistence Goals" badges={persistenceBadges} />
                             </div>

                             {achievements.length === 0 && (
                                <div className="py-24 text-center">
                                    <Shield size={56} className="mx-auto text-slate-100 mb-6" />
                                    <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-3">No Achievements Yet</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-xs mx-auto">Start your learning journey by completing your first lesson.</p>
                                </div>
                             )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatusCard({ label, value, icon: Icon }: any) {
    return (
        <div className="p-4 md:p-6 lg:p-8 rounded-xl md:rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center group hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 md:mb-5 group-hover:scale-110 transition-transform">
                <Icon size={16} className="md:hidden" />
                <Icon size={22} className="hidden md:block" />
            </div>
            <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1.5 text-center">{label}</p>
            <p className="text-base md:text-2xl font-black text-white uppercase tracking-tighter">{value}</p>
        </div>
    );
}

function MasteryStat({ label, value, icon: Icon, color }: any) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center ${color} shadow-sm`}>
                    <Icon size={16} fill="currentColor" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
            </div>
            <span className="text-[12px] font-black text-slate-950 uppercase tracking-tight">{value}</span>
        </div>
    );
}

function AchievementSection({ title, badges }: { title: string; badges: any[] }) {
    if (badges.length === 0) return null;
    return (
        <div>
            <div className="flex items-center gap-6 mb-10">
                <div className="h-px flex-1 bg-slate-50" />
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">{title}</h3>
                <div className="h-px flex-1 bg-slate-50" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
                {badges.map((a: any) => (
                    <AchievementBadge
                        key={a.id}
                        title={a.name}
                        description={a.description}
                        unlocked={a.unlocked}
                        locked={!a.unlocked}
                        category={a.tier}
                        icon={a.icon_url || a.icon}
                    />
                ))}
            </div>
        </div>
    );
}
