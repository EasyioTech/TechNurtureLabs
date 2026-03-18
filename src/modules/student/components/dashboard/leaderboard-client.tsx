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
        if (scope === initialData.scope && data === initialData) return;
        
        async function update() {
            setLoading(true);
            try {
                const res = await getStudentLeaderboard(scope);
                setData(res);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
        update();
    }, [scope]);

    return (
        <div className="min-h-screen bg-slate-50/10 pb-20 animate-in fade-in duration-700">
            {/* Competitive Header */}
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
                                <Trophy size={16} fill="currentColor" />
                                <span className="text-[9px] font-black uppercase tracking-[0.4em]">
                                    {scope === 'class' ? 'Classroom' : 'Institution'} Rankings
                                </span>
                            </motion.div>

                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-10">
                                Student <br />
                                <span className="text-indigo-500">Leaderboard</span>
                            </h1>

                            <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl max-w-[280px] backdrop-blur-xl border border-white/10 shadow-2xl">
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
                            <div className="w-full max-w-md p-10 md:p-12 rounded-[2rem] md:rounded-[3rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-950/40 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_60%)] pointer-events-none" />
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2.25rem] bg-white text-indigo-600 flex items-center justify-center mb-6 md:mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                        <Activity size={32} className="hidden md:block" />
                                        <Activity size={24} className="md:hidden" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 md:mb-4 text-white">Your Rank</h3>
                                    <p className="text-[9px] md:text-[10px] font-black text-indigo-100 uppercase tracking-[0.3em] mb-8 md:mb-10 max-w-[200px] mx-auto opacity-70">You are currently ranked #{userStats.rank} in your school.</p>
                                    <div className="w-full h-px bg-white/10 mb-8 md:mb-10" />
                                    <p className="text-5xl md:text-6xl font-black tracking-tighter">TOP {userStats.rankPercentage}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 -mt-8 md:-mt-12 relative z-20">
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 lg:p-12 border border-slate-100 shadow-2xl shadow-slate-200/40 min-h-[500px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-950 pointer-events-none">
                        <Trophy size={200} />
                    </div>

                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                            {data?.title || 'Leaderboard Rankings'}
                        </h3>
                        {loading && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 text-[9px] font-black text-indigo-600 uppercase tracking-widest"
                            >
                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                                Updating Rankings...
                            </motion.div>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={scope + data.data.length}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4 lg:space-y-6"
                        >
                            {data.data.length > 0 ? data.data.map((user: any) => (
                                <LeaderboardRow key={user.id} user={user} />
                            )) : (
                                <div className="py-32 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                                        <Trophy size={40} />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">No Rankings Yet</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Start your learning journey to appear on the leaderboard.</p>
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
            className={`flex-1 h-11 md:h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
            <Icon size={14} /> {label}
        </button>
    );
}

function LeaderboardRow({ user }: { user: any }) {
    const isTop3 = user.rank <= 3;
    const isCurrentUser = user.isCurrentUser;

    return (
        <div className={`p-4 md:p-6 rounded-[1.75rem] md:rounded-[2.25rem] border transition-all flex flex-col md:flex-row items-center gap-6 md:gap-8 ${isCurrentUser ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xl shadow-indigo-100' : 'bg-white border-slate-50 hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-50/50'}`}>
            <div className="w-full md:w-14 flex justify-between md:justify-center items-center">
                {isTop3 ? (
                    <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-white shadow-lg ${user.rank === 1 ? 'bg-amber-400 shadow-amber-200' : user.rank === 2 ? 'bg-slate-300 shadow-slate-200' : 'bg-orange-400 shadow-orange-200'}`}>
                        <Trophy size={20} />
                    </div>
                ) : (
                    <span className={`text-xl lg:text-2xl font-black ${isCurrentUser ? 'text-white/40' : 'text-slate-200'}`}>#{user.rank}</span>
                )}
                <div className="md:hidden flex items-center gap-2">
                     <Star size={12} className={isCurrentUser ? 'text-white' : 'text-amber-400'} fill="currentColor" />
                     <span className="text-lg font-black">{user.xp.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex-1 flex items-center gap-4 w-full">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-base md:text-lg font-black shadow-inner flex-shrink-0 ${isCurrentUser ? 'bg-white text-indigo-600' : 'bg-slate-900 text-white'}`}>
                    {user.initials}
                </div>
                <div className="min-w-0">
                    <h4 className="text-base md:text-lg font-black uppercase tracking-tighter leading-none mb-1.5 truncate">
                        {user.full_name}
                        {isCurrentUser && <span className="ml-2 text-[7px] font-black bg-white text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest align-middle">You</span>}
                    </h4>
                    <p className={`text-[9px] font-black uppercase tracking-widest truncate ${isCurrentUser ? 'text-white/60' : 'text-slate-400'}`}>Level {user.level} Dedicated Student</p>
                </div>
            </div>

            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-6 lg:gap-10 pr-0 md:pr-2 py-3.5 md:py-0 border-t md:border-t-0 border-white/10 md:border-transparent">
                <div className="flex items-center gap-6 lg:gap-10">
                    <StatItem label="Accuracy" value={`${user.accuracy}%`} icon={Target} isCurrentUser={isCurrentUser} color="text-emerald-500" />
                    <StatItem label="Efficiency" value={`${user.efficiency}%`} icon={Zap} isCurrentUser={isCurrentUser} color="text-sky-500" />
                </div>
                
                <div className="hidden md:flex items-center gap-2.5 ml-4">
                    <Star size={18} className={isCurrentUser ? 'text-white' : 'text-amber-400'} fill="currentColor" />
                    <span className="text-xl lg:text-2xl font-black tracking-tighter shrink-0">{user.xp.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value, icon: Icon, isCurrentUser, color }: any) {
    return (
        <div className="flex flex-col items-center md:items-start">
            <p className={`text-[7px] font-black uppercase tracking-widest mb-1 ${isCurrentUser ? 'text-white/50' : 'text-slate-400'}`}>{label}</p>
            <div className="flex items-center gap-1.5">
                <Icon size={12} className={isCurrentUser ? 'text-white' : color} />
                <span className="text-sm font-black tracking-tight shrink-0">{value}</span>
            </div>
        </div>
    );
}
