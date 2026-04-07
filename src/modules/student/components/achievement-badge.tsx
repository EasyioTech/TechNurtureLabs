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
    // Psychologically driven professional gradients
    const tierColors = {
        bronze: unlocked
            ? 'bg-gradient-to-br from-[#EAB308] via-[#D97706] to-[#92400E] text-white shadow-[0_10px_20px_-5px_rgba(217,119,6,0.5)]'
            : 'bg-slate-100 text-slate-400 shadow-inner',
        silver: unlocked
            ? 'bg-gradient-to-br from-[#94A3B8] via-[#475569] to-[#1E293B] text-white shadow-[0_10px_20px_-5px_rgba(71,85,105,0.5)]'
            : 'bg-slate-100 text-slate-400 shadow-inner',
        gold: unlocked
            ? 'bg-gradient-to-br from-[#FDE047] via-[#F59E0B] to-[#78350F] text-white shadow-[0_10px_20px_-10px_rgba(245,158,11,0.6)]'
            : 'bg-slate-100 text-slate-400 shadow-inner',
        platinum: unlocked
            ? 'bg-gradient-to-br from-[#818CF8] via-[#4338CA] to-[#312E81] text-white shadow-[0_10px_20px_-5px_rgba(67,56,202,0.5)]'
            : 'bg-slate-100 text-slate-400 shadow-inner',
    };

    const currentTier = (category?.toLowerCase() as keyof typeof tierColors) || 'bronze';
    const colorClasses = tierColors[currentTier] || tierColors.bronze;
    const iconKey = icon || title.toLowerCase().replace(' ', '_');
    const IconComponent = unlocked ? (ICON_MAP[iconKey] || Star) : Lock;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={!locked ? { scale: 1.1, y: -8 } : {}}
            className="group flex flex-col items-center transition-all duration-500 cursor-pointer"
        >
            {/* The circular container */}
            <div className={`
                relative w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-700
                ${colorClasses}
                ${unlocked ? 'ring-4 ring-white/30 ring-inset' : 'border-4 border-slate-200'}
                overflow-hidden backdrop-blur-md
            `}>
                {/* Glossy Overlay */}
                {unlocked && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-60 pointer-events-none" />
                )}

                {/* Achievement Badge Status Indicator */}
                {unlocked && (
                    <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute -top-1 -right-1 w-6 h-6 md:w-9 md:h-9 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 md:border-4 border-white shadow-xl z-10"
                    >
                        <CheckCircle2 size={16} strokeWidth={3} />
                    </motion.div>
                )}

                {/* Rotating Inner Border Shine */}
                {unlocked && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-white/40 border-r-white/10 pointer-events-none"
                    />
                )}

                {/* Icon Container with subtle inner shadow to avoid "white square" feel */}
                <motion.div
                    animate={unlocked ? { 
                        scale: [1, 1.05, 1],
                        filter: ['drop-shadow(0 0 0px rgba(255,255,255,0))', 'drop-shadow(0 0 10px rgba(255,255,255,0.4))', 'drop-shadow(0 0 0px rgba(255,255,255,0))']
                    } : {}}
                    transition={unlocked ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}}
                    className="relative z-1"
                >
                    <IconComponent 
                        size={unlocked ? 48 : 32} 
                        className={unlocked ? 'text-white' : 'text-slate-300'}
                        strokeWidth={unlocked ? 1.5 : 2} 
                    />
                </motion.div>

                {/* Bottom Shine */}
                {unlocked && (
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                )}
            </div>

            <div className="mt-5 md:mt-7 text-center px-2 max-w-[120px] md:max-w-[160px]">
                <p className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest leading-none mb-2 ${
                    unlocked ? 'text-slate-900' : 'text-slate-400'
                }`}>
                    {title}
                </p>

                <div className="relative group/tooltip">
                    <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-[0.15em] line-clamp-2 transition-all ${
                        unlocked ? 'text-slate-500' : 'text-slate-300 italic'
                    }`}>
                        {unlocked ? description : `Reach target to unlock`}
                    </p>

                    {/* Elite Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-60 p-5 bg-slate-950 text-white rounded-[2rem] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-none">
                        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-950 rotate-45 border-r border-b border-white/10" />
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses}`}>
                                <IconComponent size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white mb-1 uppercase tracking-widest">{title}</p>
                                <p className="text-[9px] text-slate-400 font-bold leading-relaxed">{description}</p>
                            </div>
                            <div className={`mt-2 py-1 px-3 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                unlocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                            }`}>
                                {unlocked ? 'Achievement Unlocked' : 'Locked Milestone'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

