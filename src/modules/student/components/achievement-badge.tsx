'use client';

import React from 'react';
import {
    Trophy, Shield, Medal, Star, Award,
    Zap, Target, User, Flame, Clock,
    CheckCircle2, Lock, Sparkles, Heart, BookMarked, Lightbulb,
    Rocket, Crown, TrendingUp, Brain, GraduationCap, Beaker, Microscope
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
    brain: Brain,
    study: GraduationCap,
    lab: Beaker,
    scope: Microscope
};

export function AchievementBadge({ title, description, unlocked, locked, category, icon }: AchievementBadgeProps) {
    // Professional "Human-Crafted" Tier Gradients
    const tierConfig = {
        bronze: {
            gradient: unlocked 
                ? 'linear-gradient(135deg, #FFB347 0%, #D97706 45%, #92400E 100%)' 
                : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
            shadow: '0 12px 24px -6px rgba(217, 119, 6, 0.4)',
            glow: 'rgba(251, 191, 36, 0.2)'
        },
        silver: {
            gradient: unlocked 
                ? 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 35%, #475569 70%, #1E293B 100%)' 
                : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
            shadow: '0 12px 24px -6px rgba(100, 116, 139, 0.4)',
            glow: 'rgba(148, 163, 184, 0.2)'
        },
        gold: {
            gradient: unlocked 
                ? 'linear-gradient(135deg, #FDE047 0%, #F59E0B 30%, #D97706 60%, #78350F 100%)' 
                : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
            shadow: '0 12px 24px -6px rgba(245, 158, 11, 0.5)',
            glow: 'rgba(252, 211, 77, 0.3)'
        },
        platinum: {
            gradient: unlocked 
                ? 'radial-gradient(circle at top left, #C7D2FE 0%, #818CF8 25%, #4F46E5 60%, #312E81 100%)' 
                : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
            shadow: '0 12px 24px -6px rgba(79, 70, 229, 0.5)',
            glow: 'rgba(129, 140, 248, 0.3)'
        },
    };

    const currentTier = (category?.toLowerCase() as keyof typeof tierConfig) || 'bronze';
    const activeConfig = tierConfig[currentTier] || tierConfig.bronze;
    const iconKey = icon || title.toLowerCase().replace(' ', '_');
    const IconComponent = unlocked ? (ICON_MAP[iconKey] || Star) : Lock;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={!locked ? { scale: 1.08, y: -8 } : {}}
            className="group relative flex flex-col items-center transition-all duration-500 cursor-pointer"
        >
            {/* Status Indicator - MOVED OUTSIDE to prevent clipping */}
            {unlocked && (
                <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute top-1 right-1 md:top-2 md:right-2 w-7 h-7 md:w-10 md:h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center border-[3px] md:border-4 border-white shadow-xl z-30"
                >
                    <CheckCircle2 size={18} strokeWidth={3} className="md:size-20" />
                </motion.div>
            )}

            {/* Elite Floating Particle Effect for Platinum */}
            {unlocked && currentTier === 'platinum' && (
                <div className="absolute inset-x-0 -top-4 flex justify-center pointer-events-none">
                    <Sparkles size={24} className="text-indigo-400/40 animate-pulse" />
                </div>
            )}

            {/* The Badge Body */}
            <div 
                style={{ 
                    background: activeConfig.gradient,
                    boxShadow: unlocked ? activeConfig.shadow : 'none'
                }}
                className={`
                    relative w-20 h-20 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-700
                    ${unlocked ? 'ring-4 ring-white/20' : 'border-4 border-slate-200'}
                    group-hover:ring-white/40
                `}
            >
                {/* Inner Mask for overflow elements */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                    {/* Glossy Reflection */}
                    {unlocked && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-40" />
                    )}

                    {/* Dynamic Rotating Shine */}
                    {unlocked && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            className="absolute -inset-2 rounded-full border-[6px] border-transparent border-t-white/20 border-r-white/5"
                        />
                    )}

                    {/* Bottom Depth Shade */}
                    {unlocked && (
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/10 blur-xl" />
                    )}
                </div>

                {/* Central Icon */}
                <motion.div
                    animate={unlocked ? { 
                        filter: [
                            `drop-shadow(0 0 0px ${activeConfig.glow})`,
                            `drop-shadow(0 0 15px ${activeConfig.glow})`,
                            `drop-shadow(0 0 0px ${activeConfig.glow})`
                        ]
                    } : {}}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="relative z-10"
                >
                    <IconComponent 
                        size={unlocked ? 44 : 32} 
                        className={unlocked ? 'text-white' : 'text-slate-300'}
                        strokeWidth={unlocked ? 1.25 : 2} 
                    />
                </motion.div>
            </div>

            {/* Badge Title & Description */}
            <div className="mt-5 md:mt-7 text-center px-2 max-w-[120px] md:max-w-[160px]">
                <p className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] mb-2 leading-none ${
                    unlocked ? 'text-slate-900' : 'text-slate-400'
                }`}>
                    {title}
                </p>

                <div className="relative group/tooltip">
                    <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest line-clamp-2 transition-all ${
                        unlocked ? 'text-slate-500' : 'text-slate-300 italic'
                    }`}>
                        {unlocked ? description : `Unlock Achievement`}
                    </p>

                    {/* New Human-Centric Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 w-64 p-6 bg-slate-900 text-white rounded-[2.5rem] opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-400 z-[60] shadow-2xl border border-white/5 pointer-events-none">
                        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-r border-b border-white/5" />
                        <div className="flex flex-col items-center gap-4">
                            <div 
                                style={{ background: activeConfig.gradient }}
                                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
                            >
                                <IconComponent size={28} className="text-white" />
                            </div>
                            <div className="space-y-1">
                                <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-white underline decoration-indigo-500 decoration-2 underline-offset-4">{title}</h5>
                                <p className="text-[9px] text-slate-400 font-bold leading-relaxed">{description}</p>
                            </div>
                            <div className={`mt-1 py-1.5 px-4 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                unlocked 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-white/5 text-slate-500 border border-white/5'
                            }`}>
                                {unlocked ? <><CheckCircle2 size={10} /> Milestone Met</> : <><Lock size={10} /> Requires Mastery</>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


