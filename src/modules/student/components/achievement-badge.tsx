'use client';

import React from 'react';
import {
    Trophy, Shield, Medal, Star, Award,
    Zap, Target, User, Flame, Clock,
    CheckCircle2, Lock, Sparkles, Heart, BookMarked, Lightbulb,
    Rocket, Crown, TrendingUp, Brain
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AchievementBadgeProps {
    title: string;
    description: string;
    unlocked?: boolean;
    locked?: boolean;
    category?: string;
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
    clock: Clock,
    sparkles: Sparkles,
    heart: Heart,
    book: BookMarked,
    lightbulb: Lightbulb,
    rocket: Rocket,
    crown: Crown,
    trending: TrendingUp,
    brain: Brain
};

export function AchievementBadge({ title, description, unlocked, locked, category, icon }: AchievementBadgeProps) {
    const tierColors = {
        bronze: unlocked
            ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30'
            : 'bg-slate-100 text-slate-400 shadow-sm',
        silver: unlocked
            ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-400/30'
            : 'bg-slate-100 text-slate-400 shadow-sm',
        gold: unlocked
            ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-white shadow-lg shadow-amber-500/40'
            : 'bg-slate-100 text-slate-400 shadow-sm',
        platinum: unlocked
            ? 'bg-gradient-to-br from-indigo-400 to-indigo-700 text-white shadow-lg shadow-indigo-600/40'
            : 'bg-slate-100 text-slate-400 shadow-sm',
    };

    const currentTier = (category as keyof typeof tierColors) || 'bronze';
    const colorClasses = tierColors[currentTier];
    const iconKey = icon || title.toLowerCase().replace(' ', '_');
    const IconComponent = unlocked ? (ICON_MAP[iconKey] || Star) : Lock;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={!locked ? { scale: 1.15, y: -5 } : {}}
            className={`group flex flex-col items-center transition-all duration-300 cursor-pointer`}
        >
            <div className={`
                relative w-16 h-16 xs:w-20 xs:h-20 md:w-28 md:h-28 rounded-3xl flex items-center justify-center transition-all duration-500
                ${colorClasses}
                ${unlocked ? 'ring-2 ring-white/20' : ''}
                backdrop-blur-sm
            `}>
                {unlocked && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center border-[2px] md:border-3 border-white shadow-lg"
                    >
                        <CheckCircle2 size={14} strokeWidth={3} />
                    </motion.div>
                )}

                {unlocked && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-3xl border-2 border-transparent border-t-white/30 border-r-white/30 pointer-events-none"
                    />
                )}

                <motion.div
                    animate={unlocked ? { scale: [1, 1.1, 1], rotateZ: [0, 5, -5, 0] } : {}}
                    transition={unlocked ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                >
                    <IconComponent size={36} strokeWidth={unlocked ? 2 : 1.5} />
                </motion.div>
            </div>

            <div className={`mt-4 md:mt-6 text-center px-1 max-w-[110px] md:max-w-[140px]`}>
                <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-tight leading-tight mb-1.5 ${
                    unlocked ? 'text-slate-900' : 'text-slate-500'
                }`}>
                    {title}
                </p>

                <div className="relative group/tooltip">
                    <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest line-clamp-2 transition-all ${
                        unlocked ? 'text-slate-600' : 'text-slate-400 italic'
                    }`}>
                        {unlocked ? description : `Unlock: ${description}`}
                    </p>

                    {/* Enhanced Tooltip */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-slate-950 text-white text-[9px] font-bold rounded-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-2xl pointer-events-none uppercase tracking-widest leading-relaxed border border-white/10"
                    >
                        <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 rotate-45 border-r border-b border-white/10" />
                        <div className="flex items-start gap-2">
                            {unlocked ? <Sparkles size={12} className="flex-shrink-0 mt-0.5 text-amber-400" /> : <Lock size={12} className="flex-shrink-0 mt-0.5 text-slate-500" />}
                            <div>
                                <p className="font-black text-white mb-1">{unlocked ? 'EARNED' : 'LOCKED'}</p>
                                <p className="text-[8px] text-slate-300 font-semibold">{description}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
