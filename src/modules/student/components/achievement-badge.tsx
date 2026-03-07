'use client';

import React from 'react';
import {
    Trophy, Shield, Medal, Star, Award,
    Zap, Target, User, Flame, Clock,
    CheckCircle2, Lock
} from 'lucide-react';

interface AchievementBadgeProps {
    title: string;
    description: string;
    unlocked?: boolean;
    locked?: boolean;
    category?: string; // This is the tier from the backend: bronze, silver, gold, platinum
    icon?: string;
}

const ICON_MAP: Record<string, any> = {
    award: Award,
    target: Target,
    zap: Zap,
    user: User,
    star: Star,
    shield: Shield,
    trophy: Trophy,
    flame: Flame,
    medal: Medal,
    clock: Clock
};

export function AchievementBadge({ title, description, unlocked, locked, category, icon }: AchievementBadgeProps) {
    // Map tier to colors
    const tierColors = {
        bronze: unlocked ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-slate-300 bg-slate-50 border-slate-100',
        silver: unlocked ? 'text-slate-500 bg-slate-50 border-slate-200' : 'text-slate-300 bg-slate-50 border-slate-100',
        gold: unlocked ? 'text-amber-500 bg-amber-50 border-amber-200 shadow-amber-200/20' : 'text-slate-300 bg-slate-50 border-slate-100',
        platinum: unlocked ? 'text-indigo-600 bg-indigo-50 border-indigo-200 shadow-indigo-200/20' : 'text-slate-300 bg-slate-50 border-slate-100',
    };

    const currentTier = (category as keyof typeof tierColors) || 'bronze';
    const colorClasses = tierColors[currentTier];

    // Find icon
    const iconKey = icon || title.toLowerCase().replace(' ', '_');
    const IconComponent = unlocked ? (ICON_MAP[iconKey] || Trophy) : Lock;

    return (
        <div className={`group flex flex-col items-center transition-all duration-500 ${locked ? 'opacity-40 grayscale' : 'hover:scale-110 active:scale-95'}`}>
            <div className={`
                relative w-24 h-24 rounded-[2rem] flex items-center justify-center border-2 transition-all duration-500 shadow-sm
                ${colorClasses}
            `}>
                {unlocked && (
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-in zoom-in duration-1000">
                        <CheckCircle2 size={12} strokeWidth={3} />
                    </div>
                )}
                <IconComponent size={36} strokeWidth={unlocked ? 2.5 : 1.5} className={`${unlocked ? 'animate-pulse' : ''}`} />
            </div>
            <div className="mt-5 text-center px-2">
                <p className={`text-[11px] font-black uppercase tracking-tight leading-none mb-2 ${unlocked ? 'text-slate-900' : 'text-slate-400'}`}>
                    {title}
                </p>
                <div className="h-4 overflow-hidden">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1 group-hover:line-clamp-none transition-all">
                        {unlocked ? description : 'Hidden Achievement'}
                    </p>
                </div>
            </div>
        </div>
    );
}
