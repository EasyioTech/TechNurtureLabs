'use client';

import React from 'react';
import { Target, TrendingUp, BarChart3, Clock, Trophy, Award, Activity, BookOpen, Medal } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface AnalyticsClientProps {
  initialData: {
    profile: any;
    chartData: any[];
    summary: any;
  }
}

export function AnalyticsClient({ initialData }: AnalyticsClientProps) {
    const { profile, chartData, summary } = initialData;

    if (!profile || !summary) {
        return (
            <div className="min-h-screen bg-slate-50/10 flex items-center justify-center p-6">
                <div className="text-center max-w-xs">
                    <BarChart3 size={48} className="text-slate-200 mx-auto mb-6" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-relaxed">Intelligence data stream unavailable</p>
                    <p className="text-[10px] font-bold text-slate-300 mt-4 uppercase tracking-widest">Protocol: Re-synchronize Required</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/10 pb-20 overflow-x-hidden">
            {/* Elite Header */}
            <div className="relative bg-slate-900 overflow-hidden py-16 md:py-20 lg:py-24 px-6 lg:px-12 border-b border-white/5">
                <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-amber-500/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />
                
                <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12 lg:gap-16">
                    <div className="w-full lg:flex-1">
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-8"
                        >
                            <Activity size={14} className="fill-indigo-500/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Intelligence Feed</span>
                        </motion.div>

                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
                            Performance <br />
                            <span className="text-indigo-500">Analytics</span>
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 md:gap-10">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mission Progress</span>
                                <div className="flex items-center gap-3">
                                    <TrendingUp size={24} className="text-emerald-400 shrink-0" />
                                    <span className="text-2xl sm:text-4xl font-black text-white tracking-tighter">+{summary.weeklyXp ?? 0} XP</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-auto self-stretch lg:self-center">
                        <div className="w-full lg:max-w-md bg-indigo-600 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-2xl border border-indigo-500/30 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1)_0%,_transparent_70%)] pointer-events-none" />
                           <div className="relative z-10 w-full">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-white text-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-105 transition-transform duration-500">
                                    <BarChart3 size={32} />
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-6">Cadet Status</h3>
                                <div className="space-y-3 w-full bg-black/20 rounded-[2rem] p-6 backdrop-blur-md border border-white/5">
                                    <ProfileStat label="Level" value={profile.level ?? 1} />
                                    <ProfileStat label="Global XP" value={(profile.xp ?? 0).toLocaleString()} />
                                    <ProfileStat label="Max Streak" value={`${profile.longest_streak ?? 0} Days`} />
                                </div>
                           </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 -mt-10 md:-mt-16 relative z-20">
                {/* 6. Performance Stats Pills - Reordered to bottom for mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
                  <QuickStatCard icon={BookOpen} value={summary.weeklyLessons || 0} label="Lessons" />
                  <QuickStatCard icon={Clock} value={`${((summary.learningTimeMinutes || 0) / 60).toFixed(1)}h`} label="Time Spent" />
                  <QuickStatCard icon={Target} value={`${summary.avgWeeklyAccuracy || 0}%`} label="Score" />
                  <QuickStatCard icon={Medal} value={`#${summary.rank || '-'}`} label="Rank" />
                </div>

                <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-slate-950 pointer-events-none hidden md:block">
                        <TrendingUp size={200} />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4 pb-6 border-b border-slate-50">
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Progress Vector</h3>
                            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                <Activity size={14} /> Intelligence Analytics
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] rounded-lg border border-slate-100">
                            SYNC_ACTIVE
                        </div>
                    </div>

                    <div className="h-[300px] md:h-[500px] w-full mt-4 -ml-4 sm:ml-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
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
                                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }}
                                    dx={-5}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    contentStyle={{
                                        borderRadius: '1.5rem',
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                                        padding: '16px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    itemStyle={{ color: '#0f172a', fontWeight: '900', fontSize: '14px', padding: '0' }}
                                    labelStyle={{ color: '#64748b', fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="xp"
                                    stroke="#4f46e5"
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: '#4f46e5', strokeWidth: 3, stroke: '#ffffff' }}
                                    activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }}
                                    name="XP"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
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

function ProfileStat({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
            <span className="text-[9px] font-black text-indigo-200/60 uppercase tracking-widest">{label}</span>
            <span className="text-xs font-black text-white uppercase tracking-tight">{value}</span>
        </div>
    );
}
