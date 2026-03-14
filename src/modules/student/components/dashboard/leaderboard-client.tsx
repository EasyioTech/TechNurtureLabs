'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Star, Shield, Users, ArrowRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getStudentLeaderboard } from '@/modules/student/actions/leaderboard-actions';

interface LeaderboardClientProps {
  initialData: {
    scope: string;
    data: any[];
    title: string;
  };
}

export function LeaderboardClient({ initialData }: LeaderboardClientProps) {
    const [scope, setScope] = useState<'school' | 'class'>(initialData.scope as any || 'school');
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen bg-slate-50/10 pb-32 animate-in fade-in duration-700">
            {/* Competitive Header */}
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
                                <Trophy size={18} fill="currentColor" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Global Rankings</span>
                            </motion.div>

                            <h1 className="text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-12">
                                Student <br />
                                <span className="text-indigo-500">Leaderboard</span>
                            </h1>

                            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-3xl max-w-sm backdrop-blur-xl border border-white/10 shadow-2xl">
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
                            <div className="w-full max-w-md p-12 rounded-[4rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-950/40 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2)_0%,_transparent_60%)] pointer-events-none" />
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-white text-indigo-600 flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                        <Activity size={48} />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Your Rank</h3>
                                    <p className="text-[11px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-12 max-w-[200px]">Your performance is updated daily based on your learning activities.</p>
                                    <div className="w-full h-px bg-white/10 mb-12" />
                                    <p className="text-6xl font-black tracking-tighter">TOP 3%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 -mt-16 relative z-20">
                <div className="bg-white rounded-[4rem] p-10 lg:p-16 border border-slate-100 shadow-2xl shadow-slate-200/40 min-h-[600px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-slate-950 pointer-events-none">
                        <Trophy size={300} />
                    </div>

                    <div className="flex items-center justify-between mb-16 pb-8 border-b border-slate-50">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                            {data?.title || 'Leaderboard Rankings'}
                        </h3>
                        {loading && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest"
                            >
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
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
                            className="space-y-6"
                        >
                            {data.data.length > 0 ? data.data.map((user: any) => (
                                <LeaderboardRow key={user.id} user={user} />
                            )) : (
                                <div className="py-40 flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 rounded-[3rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-8 border border-slate-100">
                                        <Trophy size={48} />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">No Rankings Yet</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Start your learning journey to appear on the leaderboard.</p>
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
            className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
            <Icon size={18} /> {label}
        </button>
    );
}

function LeaderboardRow({ user }: { user: any }) {
    const isTop3 = user.rank <= 3;
    const isCurrentUser = user.isCurrentUser;

    return (
        <div className={`p-6 rounded-[2.5rem] border transition-all flex items-center gap-8 ${isCurrentUser ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xl shadow-indigo-200' : 'bg-white border-slate-50 hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-100'}`}>
            <div className="w-16 flex justify-center">
                {isTop3 ? (
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl ${user.rank === 1 ? 'bg-indigo-600' : user.rank === 2 ? 'bg-slate-700' : 'bg-slate-400'}`}>
                        <Trophy size={24} />
                    </div>
                ) : (
                    <span className={`text-2xl font-black ${isCurrentUser ? 'text-white/40' : 'text-slate-200'}`}>#{user.rank}</span>
                )}
            </div>

            <div className="flex-1 flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center text-xl font-black shadow-inner ${isCurrentUser ? 'bg-white text-indigo-600' : 'bg-slate-900 text-white'}`}>
                    {user.initials}
                </div>
                <div>
                    <h4 className="text-xl font-black uppercase tracking-tighter leading-none mb-2">
                        {user.full_name}
                        {isCurrentUser && <span className="ml-4 text-[9px] font-black bg-white text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest align-middle">You</span>}
                    </h4>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isCurrentUser ? 'text-white/60' : 'text-slate-400'}`}>Level {user.level} Dedicated Student</p>
                </div>
            </div>

            <div className="flex items-center gap-10 pr-4">
                <div className="flex items-center gap-3">
                    <Star size={20} className={isCurrentUser ? 'text-white' : 'text-amber-400'} fill="currentColor" />
                    <span className="text-3xl font-black tracking-tighter">{user.xp.toLocaleString()}</span>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCurrentUser ? 'bg-white/10' : 'bg-slate-50'} transition-transform group-hover:scale-110`}>
                    <ArrowRight size={18} />
                </div>
            </div>
        </div>
    );
}
