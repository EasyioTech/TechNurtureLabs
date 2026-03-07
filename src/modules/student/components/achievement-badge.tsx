'use client';

import React from 'react';
import { Trophy, Shield, Medal, Star, Award } from 'lucide-react';

interface AchievementBadgeProps {
    title: string;
    description: string;
    unlocked?: boolean;
    locked?: boolean;
    category?: string;
}

export function AchievementBadge({ title, description, unlocked, locked, category }: AchievementBadgeProps) {
    const Icon = category === 'academic' ? Shield : category === 'speed' ? Medal : Trophy;

    return (
        <div className={`group flex flex-col items-center transition-all ${locked ? 'opacity-40 grayscale' : 'hover:scale-105 active:scale-95'}`}>
            <div className={`
        relative w-20 h-20 rounded-[1.75rem] flex items-center justify-center border-2 transition-all
        ${unlocked
                    ? 'bg-white text-indigo-600 border-indigo-100 shadow-xl shadow-indigo-500/5'
                    : 'bg-slate-50 text-slate-300 border-slate-100'}
      `}>
                {unlocked && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-white">
                        <Star size={10} fill="currentColor" />
                    </div>
                )}
                <Icon size={32} strokeWidth={2.5} />
            </div>
            <div className="mt-4 text-center max-w-[100px]">
                <p className={`text-[10px] font-black uppercase tracking-tight leading-loose ${unlocked ? 'text-slate-900' : 'text-slate-400'}`}>
                    {title}
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate line-clamp-1">{description}</p>
            </div>
        </div>
    );
}
