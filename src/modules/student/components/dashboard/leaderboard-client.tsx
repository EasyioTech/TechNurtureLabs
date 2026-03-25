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
        <div className="min-h-screen bg-slate-50/10 pb-20">
            {/* Competitive Header */}
            <div className="relative bg-slate-950 overflow-hidden py-10 md:py-14 lg:py-16 px-6 lg:px-12 border-b border-white/5">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="max-w-[1440px] mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                        <div className="lg:col-span-7">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-6"
                            >
                                <Trophy size={14} fill="currentColor" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em]">
                                    {scope === 'class' ? 'Classroom' : 'Institution'} Rankings
                                </span>
                            </motion.div>
 
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
                                Student <br />
                                <span className="text-indigo-500">Leaderboard</span>
                            </h1>
 
                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl max-w-[240px] backdrop-blur-xl border border-white/10 shadow-xl">
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
                            <div className="w-full max-w-sm p-8 md:p-10 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-950/40 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_60%)] pointer-events-none" />
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-white text-indigo-600 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                        <Activity size={24} />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-2 text-white">Your Rank</h3>
                                    <p className="text-[9px] font-black text-indigo-100 uppercase tracking-[0.2em] mb-6 max-w-[180px] mx-auto opacity-70 leading-relaxed">Currently ranked #{userStats.rank || '-'} in overall {scope}.</p>
                                    <div className="w-20 h-0.5 bg-white/10 mb-6 mx-auto" />
                                    <p className="text-4xl md:text-5xl font-black tracking-tighter">TOP {userStats.rankPercentage || 0}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 -mt-6 md:-mt-10 relative z-20">
                <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 min-h-[500px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-950 pointer-events-none">
                        <Trophy size={200} />
                    </div>
 
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                        <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                            {data?.title || 'Leaderboard Rankings'}
                        </h3>
                        {loading && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 text-[8px] font-black text-indigo-600 uppercase tracking-widest"
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
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Start your learning journey to appear on the leaderboard.</p>
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
        <div className={`p-4 md:p-5 rounded-2xl md:rounded-[1.75rem] border transition-all flex flex-col md:flex-row items-center gap-4 md:gap-7 ${isCurrentUser ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-100' : 'bg-white border-slate-50 hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-50/50'}`}>
            <div className="w-full md:w-10 flex justify-between md:justify-center items-center">
                {isTop3 ? (
                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-white shadow-md ${user.rank === 1 ? 'bg-amber-400 shadow-amber-200' : user.rank === 2 ? 'bg-slate-300 shadow-slate-200' : 'bg-orange-400 shadow-orange-200'}`}>
                        <Trophy size={16} />
                    </div>
                ) : (
                    <span className={`text-lg lg:text-xl font-black ${isCurrentUser ? 'text-white/40' : 'text-slate-200'}`}>#{user.rank}</span>
                )}
                <div className="md:hidden flex items-center gap-2">
                     <Star size={12} className={isCurrentUser ? 'text-white' : 'text-amber-400'} fill="currentColor" />
                     <span className="text-base font-black">{user.xp.toLocaleString()}</span>
                </div>
            </div>
 
            <div className="flex-1 flex items-center gap-4 w-full">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm md:text-base font-black shadow-inner flex-shrink-0 ${isCurrentUser ? 'bg-white text-indigo-600' : 'bg-slate-900 text-white'}`}>
                    {user.initials}
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm md:text-base font-black uppercase tracking-tighter leading-none mb-1 truncate">
                        {user.full_name}
                        {isCurrentUser && <span className="ml-2 text-[6px] font-black bg-white text-indigo-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest align-middle">You</span>}
                    </h4>
                    <p className={`text-[8px] font-black uppercase tracking-widest truncate ${isCurrentUser ? 'text-white/60' : 'text-slate-400'}`}>Level {user.level}</p>
                </div>
            </div>
 
            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-6 lg:gap-8 pr-0 md:pr-2 py-3 md:py-0 border-t md:border-t-0 border-white/10 md:border-transparent">
                <div className="flex items-center gap-6 lg:gap-8">
                    <StatItem label="Accuracy" value={`${user.accuracy}%`} icon={Target} isCurrentUser={isCurrentUser} color="text-emerald-500" />
                    <StatItem label="Efficiency" value={`${user.efficiency}%`} icon={Zap} isCurrentUser={isCurrentUser} color="text-sky-500" />
                </div>
                
                <div className="hidden md:flex items-center gap-2 ml-4">
                    <Star size={16} className={isCurrentUser ? 'text-white' : 'text-amber-400'} fill="currentColor" />
                    <span className="text-lg lg:text-xl font-black tracking-tighter shrink-0">{user.xp.toLocaleString()}</span>
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
