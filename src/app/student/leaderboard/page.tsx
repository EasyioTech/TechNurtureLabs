'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Star, Target, Shield, Users } from 'lucide-react';
import { getStudentLeaderboard } from '@/modules/student/actions/leaderboard-actions';
import { StudentDashboardLoader } from '@/modules/student/components/dashboard-loader';
import { Button } from '@/components/ui/button';

export default function LeaderboardPage() {
    const [scope, setScope] = useState<'school' | 'class'>('school');
    const [data, setData] = useState<{ scope: string, data: any[], title: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getStudentLeaderboard(scope).then(res => {
            if (isMounted) {
                setData(res);
                setLoading(false);
            }
        }).catch(err => {
            console.error(err);
            if (isMounted) setLoading(false);
        });
        return () => { isMounted = false; };
    }, [scope]);

    if (loading) {
        return <StudentDashboardLoader message="Fetching global rankings..." />;
    }

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
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Leaderboard</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none mb-8">
                                School <span className="text-indigo-500">Rankings</span>
                            </h1>
                            <p className="text-slate-400 font-medium text-lg max-w-lg mb-12">
                                See how you stack up against your peers. Climb the ranks to prove your mastery.
                            </p>

                            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl max-w-sm backdrop-blur-md border border-white/10">
                                <Button
                                    variant="ghost"
                                    onClick={() => setScope('school')}
                                    className={`flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${scope === 'school' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Shield size={16} className="mr-2" /> School
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setScope('class')}
                                    className={`flex-1 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${scope === 'class' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Users size={16} className="mr-2" /> Class
                                </Button>
                            </div>
                        </div>

                        <div className="hidden lg:flex justify-end">
                            <div className="w-full max-w-sm aspect-square bg-white/5 rounded-[3rem] border border-white/10 p-10 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-600/20">
                                    <Trophy size={40} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Beat Your Best</h3>
                                <p className="text-sm font-bold text-slate-500 uppercase mb-0">Push your limits today</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
                <div className="bg-white rounded-[3rem] p-6 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/20">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-10 pl-4 border-l-4 border-indigo-600">
                        {data?.title || (scope === 'school' ? 'School Leaderboard' : 'Class Leaderboard')}
                    </h3>

                    {data?.data && data.data.length > 0 ? (
                        <div className="space-y-4">
                            {data.data.map((user: any) => {
                                const isTop3 = user.rank <= 3;
                                return (
                                    <div key={user.id} className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl transition-all border ${user.isCurrentUser ? 'bg-indigo-50/50 border-indigo-200 shadow-md shadow-indigo-100/50' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5'}`}>

                                        {/* Rank Number */}
                                        <div className="w-10 sm:w-16 flex justify-center shrink-0">
                                            {isTop3 ? (
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${user.rank === 1 ? 'bg-indigo-600 shadow-indigo-600/40' : user.rank === 2 ? 'bg-slate-700 shadow-slate-700/40' : 'bg-slate-400 shadow-slate-400/40'}`}>
                                                    <Trophy size={20} />
                                                </div>
                                            ) : (
                                                <span className={`text-2xl font-black ${user.isCurrentUser ? 'text-indigo-600' : 'text-slate-300'}`}>#{user.rank}</span>
                                            )}
                                        </div>

                                        {/* Avatar Details */}
                                        <div className="flex-1 flex items-center gap-4">
                                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-inner ${user.isCurrentUser ? 'bg-indigo-600' : isTop3 ? 'bg-slate-800' : 'bg-slate-200 text-slate-500'}`}>
                                                {user.initials}
                                            </div>
                                            <div>
                                                <p className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                                                    {user.full_name}
                                                    {user.isCurrentUser && <span className="ml-3 text-[9px] uppercase tracking-widest bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full align-middle">You</span>}
                                                </p>
                                                <p className="text-[10px] sm:text-xs font-black text-slate-400 mt-1 uppercase tracking-widest">Lvl {user.level}</p>
                                            </div>
                                        </div>

                                        {/* XP */}
                                        <div className="flex items-center gap-2 pr-2 sm:pr-4">
                                            <Star size={18} className={user.isCurrentUser ? 'text-indigo-500' : 'text-slate-300'} />
                                            <span className={`text-xl sm:text-2xl font-black ${user.isCurrentUser ? 'text-indigo-600' : 'text-slate-900'}`}>{user.xp.toLocaleString()}</span>
                                            <span className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">XP</span>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                            <Target size={48} className="mx-auto text-slate-300 mb-6" />
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Ranks Found</h3>
                            <p className="text-slate-500 mt-2">Earn XP to start competing in this leaderboard.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
