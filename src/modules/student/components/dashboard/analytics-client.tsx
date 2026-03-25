'use client';

import React from 'react';
import { Target, TrendingUp, BarChart3, Clock, Trophy, Award, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface AnalyticsClientProps {
  initialData: {
    profile: any;
    chartData: any[];
    summary: any;
  }
}

export function AnalyticsClient({ initialData }: AnalyticsClientProps) {
    const { profile, chartData, summary } = initialData;

    return (
        <div className="min-h-screen bg-slate-50/10 pb-32">
            {/* Analytical Header */}
            <div className="relative bg-slate-950 overflow-hidden py-24 lg:py-32 px-6 lg:px-12 border-b border-white/5">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
                
                <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                    <div className="flex-1">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-10 shadow-2xl"
                        >
                            <Activity size={18} fill="currentColor" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Learning Progress</span>
                        </motion.div>

                        <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-12">
                            Performance <br />
                            <span className="text-indigo-500">Analytics</span>
                        </h1>

                        <div className="flex flex-wrap items-center gap-10">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Points Earned</span>
                                <div className="flex items-center gap-4">
                                    <TrendingUp size={28} className="text-emerald-400" />
                                    <span className="text-4xl font-black text-white tracking-tighter">+{summary.weeklyXp} XP</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-auto flex justify-end">
                        <div className="w-full max-w-md bg-indigo-600 rounded-[4rem] p-12 lg:p-16 flex flex-col items-center justify-center text-center shadow-2xl shadow-indigo-950/40 border border-indigo-500/30 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1)_0%,_transparent_70%)] pointer-events-none" />
                           <div className="relative z-10">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-white text-indigo-600 flex items-center justify-center mb-10 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                                    <BarChart3 size={48} />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Student Profile</h3>
                                <div className="space-y-4 w-full bg-black/20 rounded-[2.5rem] p-8 backdrop-blur-md border border-white/5">
                                    <ProfileStat label="Current Level" value={`Level ${profile.level}`} />
                                    <ProfileStat label="Total Points" value={profile.xp.toLocaleString()} />
                                    <ProfileStat label="Best Streak" value={`${profile.longest_streak} Days`} />
                                </div>
                           </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Data */}
            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 -mt-16 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 mb-16">
                    <StatBox label="Lessons Completed" value={summary.weeklyLessons} icon={Clock} color="bg-indigo-600" />
                    <StatBox label="Quiz Accuracy" value={`${summary.avgWeeklyAccuracy}%`} icon={Target} color="bg-slate-900" />
                    <StatBox label="Weekly XP" value={`+${summary.weeklyXp}`} icon={Award} color="bg-slate-700" />
                </div>

                <div className="bg-white rounded-[4rem] p-10 lg:p-16 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-slate-950 pointer-events-none">
                        <TrendingUp size={200} />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-16 pb-8 border-b border-slate-50">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3">Progress Tracing</h3>
                            <div className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                                <Activity size={16} /> Weekly XP Progress
                            </div>
                        </div>
                        <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">WEEKLY PROGRESS</div>
                    </div>

                    <div className="h-[500px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 900 }}
                                    dy={15}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 900 }}
                                    dx={-15}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    contentStyle={{
                                        borderRadius: '2.5rem',
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                                        padding: '24px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    itemStyle={{ color: '#0f172a', fontWeight: '900', fontSize: '18px', padding: '0' }}
                                    labelStyle={{ color: '#64748b', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="xp"
                                    stroke="#4f46e5"
                                    strokeWidth={6}
                                    dot={{ r: 8, fill: '#4f46e5', strokeWidth: 4, stroke: '#ffffff' }}
                                    activeDot={{ r: 10, fill: '#4f46e5', strokeWidth: 0 }}
                                    name="XP Earned"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatBox({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/20 flex items-center justify-between group hover:border-indigo-100 transition-all hover:-translate-y-2 duration-500">
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{label}</span>
                <p className="text-4xl font-black text-slate-900 mt-3 tracking-tighter">{value}</p>
            </div>
            <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-white ${color} shadow-xl shadow-slate-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                <Icon size={36} />
            </div>
        </div>
    );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-[10px] font-black text-indigo-200/60 uppercase tracking-[0.2em]">{label}</span>
            <span className="text-sm font-black text-white uppercase tracking-widest">{value}</span>
        </div>
    );
}
