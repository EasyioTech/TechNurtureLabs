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
                relative w-16 h-16 xs:w-20 xs:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center border transition-all duration-500 shadow-sm
                ${colorClasses}
            `}>
                {unlocked && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 md:w-7 md:h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center border-[3px] md:border-4 border-white shadow-lg animate-in zoom-in duration-1000">
                        <CheckCircle2 size={12} strokeWidth={3} />
                    </div>
                )}
                <IconComponent size={30} strokeWidth={unlocked ? 2.5 : 1.5} className={`${unlocked ? 'animate-pulse' : ''}`} />
            </div>
            <div className={`mt-3 md:mt-5 text-center px-1 max-w-[100px] md:max-w-[120px]`}>
                <p className={`text-[10px] font-black uppercase tracking-tight leading-tight mb-2 ${unlocked ? 'text-slate-900' : 'text-slate-400'}`}>
                    {title}
                </p>
                <div className="relative group/tooltip">
                    <p className={`text-[9px] font-bold uppercase tracking-widest line-clamp-1 transition-all ${unlocked ? 'text-slate-400' : 'text-slate-300 italic'}`}>
                        {unlocked ? description : `Unlock: ${description}`}
                    </p>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[9px] font-bold rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl pointer-events-none uppercase tracking-widest leading-relaxed">
                        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                        {unlocked ? `Achievement Earned: ${description}` : `Instruction: ${description}`}
                    </div>
                </div>
            </div>
        </div>
    );
}
