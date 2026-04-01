'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Star, Shield, Users, Activity, Target, Zap, BookOpen, Clock, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStudentLeaderboard } from '@/modules/student/actions/leaderboard-actions';
import { cn } from '@/lib/utils';

interface LeaderboardClientProps {
  initialData: {
    scope: string;
    data: any[];
    title: string;
    userStats?: {
      rank: number;
      rankPercentage: number;
    };
  } | any;
}

export function LeaderboardClient({ initialData }: LeaderboardClientProps) {
    const [scope, setScope] = useState<'school' | 'class'>(initialData.scope as any || 'school');
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const userStats = data.userStats || initialData.userStats || { rank: 0, rankPercentage: 0 };

    // Effect 1: Re-fetch whenever scope changes
    useEffect(() => {
        if (scope === (initialData.scope || 'school')) {
            setData(initialData);
            return;
        }

        async function update() {
            setLoading(true);
            try {
                const res = await getStudentLeaderboard(scope);
                setData(res);
            } catch (err) {
                console.error('[Leaderboard] fetch error:', err);
            }
            setLoading(false);
        }
        update();
    }, [scope, initialData]);

    // Effect 2: Fallback — if initialData is empty on mount, trigger a fresh fetch
    // This handles the case where the server rendered with zero students (session/profile issue)
    useEffect(() => {
        if (!initialData?.data?.length) {
            async function refresh() {
                setLoading(true);
                try {
                    const res = await getStudentLeaderboard(scope);
                    setData(res);
                } catch (err) {
                    console.error('[Leaderboard] initial refresh error:', err);
                }
                setLoading(false);
            }
            refresh();
        }
    }, []); // Only run on mount

    return (
        <div className="min-h-screen bg-slate-50/10 pb-20 overflow-x-hidden">
            {/* Elite Header */}
            <div className="relative bg-slate-900 overflow-hidden py-16 md:py-20 lg:py-24 px-6 lg:px-12 border-b border-white/5">
                <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-indigo-500/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />
                
                <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col items-center lg:items-start lg:flex-row justify-between gap-10">
                    <div className="w-full lg:flex-1 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6"
                        >
                            <Trophy size={12} fill="currentColor" />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                Global Protocols
                            </span>
                        </motion.div>

                        <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
                            Unit <br />
                            <span className="text-indigo-500">Rankings</span>
                        </h1>
 
                        <div className="inline-flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 w-full max-w-[240px]">
                            <ScopeButton 
                                active={scope === 'school'} 
                                onClick={() => setScope('school')} 
                                label="School" 
                                icon={Shield} 
                            />
                            <ScopeButton 
                                active={scope === 'class'} 
                                onClick={() => setScope('class')} 
                                label="Class" 
                                icon={Users} 
                            />
                        </div>
                    </div>
 
                    <div className="w-full lg:w-auto self-stretch lg:self-center">
                        <div className="w-full lg:max-w-xs p-8 rounded-3xl bg-indigo-600 text-white shadow-2xl relative overflow-hidden text-center group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <Activity size={80} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-4">Current Status</p>
                                <p className="text-4xl font-black tracking-tighter mb-2">Top {userStats.rankPercentage || 0}%</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 border-t border-indigo-500/30 pt-4 mt-4 inline-block">
                                    Global Vector: #{userStats.rank || '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 -mt-10 relative z-20">
                <div className="bg-white rounded-[2.5rem] p-6 lg:p-12 border border-slate-100 shadow-xl shadow-slate-200/10 min-h-[400px] relative overflow-hidden">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
                      <QuickStatCard icon={BookOpen} value={0} label="Lessons" />
                      <QuickStatCard icon={Clock} value={`0h`} label="Time Spent" />
                      <QuickStatCard icon={Target} value={`0%`} label="Score" />
                      <QuickStatCard icon={Medal} value={`#${userStats.rank || '-'}`} label="Rank" />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b border-slate-50 gap-4">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                            {data?.title || 'Protocol Results'}
                        </h3>
                        {loading && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                                Synchronizing…
                            </div>
                        )}
                    </div>
 
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={scope + (data.data?.length || 0)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {data.data?.length > 0 ? data.data.map((user: any) => (
                                <LeaderboardRow key={user.id} user={user} />
                            )) : (
                                <div className="py-24 flex flex-col items-center justify-center text-center p-12">
                                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                                        <Trophy size={40} />
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4">No Data in Vector</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start current objectives to synchronize data.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

function ScopeButton({ active, onClick, label, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
        >
            <Icon size={14} /> {label}
        </button>
    );
}

function LeaderboardRow({ user }: { user: any }) {
    const isTop3 = user.rank <= 3;
    const isCurrentUser = user.isCurrentUser;
 
    return (
        <div className={cn(
            "p-4 rounded-2xl border transition-all flex items-center gap-4 group active:scale-[0.98]",
            isCurrentUser 
                ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                : 'bg-white border-slate-100 hover:border-indigo-100'
        )}>
            <div className="w-10 shrink-0 flex justify-center">
                {isTop3 ? (
                    <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500",
                        user.rank === 1 ? 'bg-amber-400 shadow-amber-400/20' : user.rank === 2 ? 'bg-slate-300' : 'bg-orange-400'
                    )}>
                        <Trophy size={16} />
                    </div>
                ) : (
                    <span className={cn("text-sm font-black tracking-tight", isCurrentUser ? 'text-indigo-400' : 'text-slate-200')}>
                        #{user.rank}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm",
                    isCurrentUser ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-white'
                )}>
                    {user.initials}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm md:text-base font-black uppercase tracking-tight leading-none truncate">{user.full_name}</h4>
                        {isCurrentUser && (
                            <span className="hidden sm:inline-block text-[8px] font-black px-2 py-0.5 rounded-full bg-indigo-500 text-white uppercase tracking-widest">
                                YOU
                            </span>
                        )}
                    </div>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", isCurrentUser ? 'text-indigo-300/60' : 'text-slate-400')}>
                        Protocol Level {user.level}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-8 shrink-0 ml-auto">
                <div className="hidden md:flex items-center gap-8">
                    <MetricItem value={`${user.accuracy}%`} icon={Target} color="text-emerald-500" isCurrentUser={isCurrentUser} />
                    <MetricItem value={`${user.efficiency}%`} icon={Zap} color="text-sky-500" isCurrentUser={isCurrentUser} />
                </div>
                <div className="flex items-center gap-2">
                    <Star size={16} className={isCurrentUser ? 'text-white' : 'text-amber-400'} fill="currentColor" />
                    <span className="text-base font-black tabular-nums tracking-tighter">{user.xp.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

function MetricItem({ value, icon: Icon, color, isCurrentUser }: any) {
    return (
        <div className="flex items-center gap-2">
            <Icon size={14} className={cn("hidden lg:block", isCurrentUser ? 'text-white/60' : color)} />
            <span className={cn("text-xs font-black uppercase tracking-tight", isCurrentUser ? 'text-white' : 'text-slate-700')}>
                {value}
            </span>
        </div>
    );
}

function QuickStatCard({ icon: Icon, value, label }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3">
            <Icon className="text-indigo-500" size={20} />
            <div>
                <div className="text-2xl font-black text-slate-900">{value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
            </div>
        </div>
    );
}
