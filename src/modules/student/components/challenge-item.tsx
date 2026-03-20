import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle2, ChevronRight, Info, Award, Target, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChallengeItemProps {
    title: string;
    progress: number;
    total: number;
    reward: number;
    icon: any;
    unit?: string;
    color: string;
    description?: string;
    isCompact?: boolean;
}

export function ChallengeItem({ 
    title, 
    progress, 
    total, 
    reward, 
    icon: Icon, 
    unit = '', 
    color,
    description,
    isCompact = false
}: ChallengeItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const percentage = Math.min((progress / total) * 100, 100);
    const isComplete = progress >= total;

    const themes: Record<string, { bg: string, text: string, accent: string, border: string, light: string, shadow: string }> = {
        amber: { bg: 'bg-amber-500', text: 'text-amber-500', accent: 'bg-amber-50', border: 'border-amber-100', light: 'bg-amber-50', shadow: 'shadow-amber-500/20' },
        sky: { bg: 'bg-sky-500', text: 'text-sky-500', accent: 'bg-sky-50', border: 'border-sky-100', light: 'bg-sky-50', shadow: 'shadow-sky-500/20' },
        violet: { bg: 'bg-violet-500', text: 'text-violet-500', accent: 'bg-violet-50', border: 'border-violet-100', light: 'bg-violet-50', shadow: 'shadow-violet-500/20' },
        emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', accent: 'bg-emerald-50', border: 'border-emerald-100', light: 'bg-emerald-50', shadow: 'shadow-emerald-500/20' },
        indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500', accent: 'bg-indigo-50', border: 'border-indigo-100', light: 'bg-indigo-50', shadow: 'shadow-indigo-500/20' },
    };

    const theme = themes[color] || themes.indigo;

    if (isCompact) {
        return (
            <div 
                className="group relative flex items-center gap-4 p-4 rounded-[1.5rem] bg-indigo-50/10 border border-slate-100 hover:border-indigo-200 transition-all duration-300 cursor-help"
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 shrink-0",
                    isComplete ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-white text-indigo-600 shadow-sm"
                )}>
                    {isComplete ? <CheckCircle2 size={18} /> : <Icon size={18} strokeWidth={2.5} />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <h4 className={cn(
                            "text-[10px] font-black uppercase tracking-tight truncate",
                            isComplete ? "text-slate-400" : "text-slate-900"
                        )}>
                            {title}
                        </h4>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-black text-slate-900">{progress}{unit}</span>
                            <span className="text-[8px] font-bold text-slate-300">/ {total}{unit}</span>
                        </div>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className={cn("h-full rounded-full", isComplete ? "bg-emerald-500" : theme.bg)}
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-full left-0 right-0 mb-4 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles size={40} />
                            </div>
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Info size={10} /> Mission Instruction
                            </p>
                            <p className="text-xs font-bold leading-relaxed text-slate-200">
                                {description || "Complete the required learning activity to earn your points and climb the leaderboard."}
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap size={10} className="text-amber-400 fill-amber-400" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Reward: {reward} XP</span>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div 
            className="group relative"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <motion.div 
                className={cn(
                    "relative z-10 flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[2.5rem] bg-white border border-slate-100 transition-all duration-500 overflow-hidden cursor-help",
                    isComplete ? "bg-slate-50 border-emerald-100/50" : "hover:border-indigo-100 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-1"
                )}
            >
                {/* Visual Anchor - Circular Indicator */}
                <div className="relative shrink-0">
                    <svg className="w-20 h-20 -rotate-90">
                        <circle cx="40" cy="40" r="36" className="fill-none stroke-slate-50" strokeWidth="6" />
                        <motion.circle 
                            cx="40" cy="40" r="36" 
                            className={cn("fill-none", isComplete ? "stroke-emerald-500" : "stroke-slate-950")} 
                            strokeWidth="6"
                            strokeDasharray="226.2"
                            initial={{ strokeDashoffset: 226.2 }}
                            animate={{ strokeDashoffset: 226.2 - (226.2 * (percentage / 100)) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center transition-all duration-500",
                        isComplete ? "text-emerald-500 scale-110" : "text-slate-950 group-hover:scale-110"
                    )}>
                        {isComplete ? <CheckCircle2 size={24} /> : <Icon size={24} strokeWidth={2.5} />}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className={cn(
                                    "text-xl font-black tracking-tighter uppercase leading-none",
                                    isComplete ? "text-slate-400" : "text-slate-950"
                                )}>
                                    {title}
                                </h4>
                                {isComplete && (
                                    <div className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                                        Mission Success
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                    <span className="text-sm font-black text-slate-950">{progress}</span>
                                    <span className="text-[10px] font-black text-slate-300">/ {total}{unit}</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <div className="flex items-center gap-1.5">
                                    <Zap size={10} className="text-amber-400 fill-amber-400" />
                                    <span className="text-[10px] font-black text-slate-950 tracking-widest">{reward} XP</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border border-slate-100 group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950 transition-all duration-300">
                             Mission Briefing <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Floating Mission Detail (Only on Hover) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        className="absolute left-[105%] top-0 h-full w-80 z-50 hidden lg:block"
                    >
                        <div className="h-full bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden border border-white/10 shadow-[20px_20px_60px_rgba(0,0,0,0.2)]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl" />
                            
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Active Mission</p>
                                    <p className="text-base font-black uppercase tracking-tighter truncate w-40">{title}</p>
                                </div>
                            </div>

                            <p className="text-xs font-bold leading-relaxed text-slate-400 mb-8 italic">
                                "{description || "Access the relevant learning materials and achieve the target value to earn your points reward and enhance your skill profile."}"
                            </p>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Efficiency Multiplier</span>
                                    <span className="text-[10px] font-black text-white">1.5x</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Task Priority</span>
                                    <span className="text-[10px] font-black text-emerald-400">HIGH</span>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-8 right-8 flex items-center gap-2">
                                <Sparkles size={14} className="text-white animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-20">Secure Link Active</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Mobile/Small Screen Fallback for Detail */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden mt-4 overflow-hidden"
                    >
                        <div className="bg-slate-900 rounded-[1.5rem] p-5 text-white">
                             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Info size={12} /> Briefing
                            </p>
                            <p className="text-[11px] font-bold leading-relaxed text-slate-300">
                                {description || "Access the relevant learning materials and achieve the target value to earn your points reward."}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
