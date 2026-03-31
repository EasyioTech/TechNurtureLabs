'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Star, Shield, Users, ArrowRight, Activity, Target, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getStudentLeaderboard } from '@/modules/student/actions/leaderboard-actions';

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

    useEffect(() => {
        // When switching back to the initial scope, restore cached initial data instantly
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
    }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="min-h-screen bg-slate-50/10 pb-10">
            {/* Competitive Header */}
            <div className="relative bg-slate-950 overflow-hidden py-7 md:py-12 lg:py-14 px-5 lg:px-12 border-b border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="max-w-[1440px] mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                        <div className="lg:col-span-7">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-4"
                            >
                                <Trophy size={12} fill="currentColor" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider">
                                    {scope === 'class' ? 'Class' : 'School'} Rankings
                                </span>
                            </motion.div>

                            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight mb-5">
                                Student <br />
                                <span className="text-indigo-500">Leaderboard</span>
                            </h1>
 
                            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl max-w-[200px] border border-white/10">
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
 
                        <div className="lg:col-span-5 flex justify-end">
                            <div className="w-full max-w-xs p-5 md:p-7 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-950/30 relative overflow-hidden">
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-indigo-200 mb-0.5">Your rank in {scope}</p>
                                        <p className="text-2xl font-black tracking-tight">Top {userStats.rankPercentage || 0}%</p>
                                        <p className="text-xs text-indigo-200 mt-0.5">#{userStats.rank || '-'} overall</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 mt-0 relative z-20">
                <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-100 shadow-md min-h-[400px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-950 pointer-events-none">
                        <Trophy size={200} />
                    </div>
 
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                        <h3 className="text-base font-bold text-slate-900">
                            {data?.title || 'Rankings'}
                        </h3>
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 text-xs font-semibold text-indigo-600"
                            >
                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                                Updating…
                            </motion.div>
                        )}
                    </div>
 
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={scope + data.data.length}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-3 md:space-y-4"
                        >
                            {data.data.length > 0 ? data.data.map((user: any) => (
                                <LeaderboardRow key={user.id} user={user} />
                            )) : (
                                <div className="py-24 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                                        <Trophy size={32} />
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">No Rankings Yet</h4>
                                    <p className="text-xs text-slate-400">Start learning to appear on the leaderboard.</p>
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
            className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
            <Icon size={13} /> {label}
        </button>
    );
}

 function LeaderboardRow({ user }: { user: any }) {
    const isTop3 = user.rank <= 3;
    const isCurrentUser = user.isCurrentUser;
 
    return (
        <div className={`px-3 py-3 sm:px-4 sm:py-4 rounded-xl border transition-all flex flex-row items-center gap-3 ${isCurrentUser ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-sm'}`}>
            {/* Rank */}
            <div className="w-8 shrink-0 flex justify-center">
                {isTop3 ? (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm ${user.rank === 1 ? 'bg-amber-400' : user.rank === 2 ? 'bg-slate-300' : 'bg-orange-400'}`}>
                        <Trophy size={13} />
                    </div>
                ) : (
                    <span className={`text-sm font-bold ${isCurrentUser ? 'text-white/50' : 'text-slate-300'}`}>#{user.rank}</span>
                )}
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${isCurrentUser ? 'bg-white text-indigo-600' : 'bg-slate-900 text-white'}`}>
                    {user.initials}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold leading-none truncate">{user.full_name}</h4>
                        {isCurrentUser && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isCurrentUser ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>You</span>}
                    </div>
                    <p className={`text-[10px] font-medium mt-0.5 ${isCurrentUser ? 'text-white/60' : 'text-slate-400'}`}>Lv {user.level}</p>
                </div>
            </div>

            {/* Stats — always horizontal, compact */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-3">
                    <StatItem label="Acc" value={`${user.accuracy}%`} icon={Target} isCurrentUser={isCurrentUser} color="text-emerald-500" />
                    <StatItem label="Eff" value={`${user.efficiency}%`} icon={Zap} isCurrentUser={isCurrentUser} color="text-sky-500" />
                </div>
                <div className="flex items-center gap-1">
                    <Star size={12} className={isCurrentUser ? 'text-white' : 'text-amber-400'} fill="currentColor" />
                    <span className="text-sm font-bold tabular-nums">{user.xp.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value, icon: Icon, isCurrentUser, color }: any) {
    return (
        <div className="flex flex-col items-start">
            <p className={`text-[10px] font-medium mb-0.5 ${isCurrentUser ? 'text-white/50' : 'text-slate-400'}`}>{label}</p>
            <div className="flex items-center gap-1">
                <Icon size={11} className={isCurrentUser ? 'text-white/80' : color} />
                <span className="text-xs font-bold tabular-nums">{value}</span>
            </div>
        </div>
    );
}
