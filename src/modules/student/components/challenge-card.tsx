'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ChallengeCardProps {
    title: string;
    progress: number;
    total: number;
    reward: number;
    icon: any;
    unit?: string;
    color: string;
}

export function ChallengeCard({ title, progress, total, reward, icon: Icon, unit = '', color }: ChallengeCardProps) {
    const percentage = Math.min((progress / total) * 100, 100);
    const isComplete = progress >= total;

    const accentClasses: Record<string, string> = {
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        sky: 'text-sky-600 bg-sky-50 border-sky-100',
        violet: 'text-violet-600 bg-violet-50 border-violet-100',
    };

    const barColors: Record<string, string> = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        sky: 'bg-sky-500',
        violet: 'bg-violet-500',
    };

    return (
        <div className={`group bg-white border border-slate-100 p-6 rounded-[2.5rem] transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 ${isComplete ? 'border-emerald-200' : 'hover:border-slate-300'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${accentClasses[color] || accentClasses.emerald}`}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 font-black text-[10px] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    +{reward} XP
                </div>
            </div>

            <h4 className="text-base font-black text-slate-900 mb-4 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase leading-[1.1]">
                {title}
            </h4>

            <div className="space-y-4">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Progress</p>
                        <p className="text-sm font-bold text-slate-700">
                            {progress}{unit} <span className="text-slate-300 text-[10px] mx-1">/</span> {total}{unit}
                        </p>
                    </div>
                    <p className={`text-sm font-black tracking-tighter ${isComplete ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isComplete ? '100%' : `${Math.round(percentage)}%`}
                    </p>
                </div>

                <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex p-0.5">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isComplete ? 'bg-emerald-500' : barColors[color] || barColors.emerald}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {isComplete && (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-widest pt-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        Goal Met
                    </div>
                )}
            </div>
        </div>
    );
}
