'use client';

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

    const themes: Record<string, { bg: string, text: string, light: string, shadow: string, border: string }> = {
        amber: { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50', shadow: 'shadow-amber-500/10', border: 'border-amber-100' },
        sky: { bg: 'bg-sky-500', text: 'text-sky-500', light: 'bg-sky-50', shadow: 'shadow-sky-500/10', border: 'border-sky-100' },
        violet: { bg: 'bg-violet-500', text: 'text-violet-500', light: 'bg-violet-50', shadow: 'shadow-violet-500/10', border: 'border-violet-100' },
        emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50', shadow: 'shadow-emerald-500/10', border: 'border-emerald-100' },
        indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-50', shadow: 'shadow-indigo-500/10', border: 'border-indigo-100' },
    };

    const theme = themes[color] || themes.indigo;

    if (isCompact) {
        return (
            <div 
                className={cn(
                    "group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border",
                    isComplete ? "bg-emerald-50/30 border-emerald-100" : "bg-white border-slate-100 hover:border-slate-200"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shrink-0",
                    isComplete ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-100 text-slate-900 shadow-sm"
                )}>
                    {isComplete ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <h4 className={cn(
                            "text-[10px] font-black uppercase tracking-tight truncate",
                            isComplete ? "text-slate-400" : "text-slate-900"
                        )}>
                            {title}
                        </h4>
                        <span className="text-[9px] font-black text-slate-900 shrink-0">{progress}/{total}{unit}</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className={cn("h-full rounded-full", isComplete ? "bg-emerald-500" : "bg-slate-900")}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={cn(
                "group relative border transition-all duration-300 rounded-[2rem] overflow-hidden cursor-pointer",
                isComplete ? "bg-emerald-50/20 border-emerald-100/50" : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/30 hover:-translate-y-1"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="p-6 md:p-8 flex items-center gap-6">
                {/* Visual Anchor */}
                <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="32" cy="32" r="28" className="fill-none stroke-slate-50" strokeWidth="4" />
                        <motion.circle 
                            cx="32" cy="32" r="28" 
                            className={cn("fill-none", isComplete ? "stroke-emerald-500" : "stroke-slate-950")} 
                            strokeWidth="4"
                            strokeDasharray="175.9"
                            initial={{ strokeDashoffset: 175.9 }}
                            animate={{ strokeDashoffset: 175.9 - (175.9 * (percentage / 100)) }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center transition-transform duration-300",
                        isComplete ? "text-emerald-500" : "text-slate-950"
                    )}>
                        {isComplete ? <CheckCircle2 size={24} /> : <Icon size={24} strokeWidth={2.5} />}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className={cn(
                                    "text-lg font-black tracking-tight uppercase leading-none",
                                    isComplete ? "text-slate-400 line-through decoration-slate-300" : "text-slate-950"
                                )}>
                                    {title}
                                </h4>
                                {isComplete && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                                        Success
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Progress: {progress}{unit} / {total}{unit}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                             <div className="flex items-center gap-1.5 bg-slate-50 text-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black tracking-widest uppercase">
                                <Zap size={10} className="fill-amber-500 text-amber-500" />
                                {reward} XP
                             </div>
                             <div className={cn("p-2 rounded-xl border border-slate-100 text-slate-300 transition-all duration-300", isExpanded && "bg-slate-950 text-white border-slate-950 rotate-90")}>
                                <ChevronRight size={14} />
                             </div>
                        </div>
                    </div>

                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className={cn("h-full rounded-full transition-colors", isComplete ? "bg-emerald-500" : "bg-slate-950")}
                            transition={{ duration: 1.2 }}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                    >
                        <div className="p-6 md:p-8 flex items-start gap-5">
                            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-indigo-600 shadow-sm shrink-0">
                                <Info size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Internal Briefing</p>
                                <p className="text-sm font-bold text-slate-600 leading-relaxed max-w-2xl">
                                    {description || "Access the relevant learning materials and achieve the target value to earn your points reward and enhance your skill profile."}
                                </p>
                                <div className="mt-6 flex flex-wrap gap-4">
                                    <Badge label="HIGH" sub="Priority" color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-100" />
                                    <Badge label="1.5X" sub="Multiplier" color="text-sky-600" bg="bg-sky-50" border="border-sky-100" />
                                    <Badge label="ACTIVE" sub="Status" color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Badge({ label, sub, color, bg, border }: any) {
    return (
        <div className={cn("px-4 py-2 rounded-2xl border flex items-center gap-3", bg, border)}>
            <div className="text-right">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">{sub}</p>
                <p className={cn("text-[11px] font-black uppercase leading-none", color)}>{label}</p>
            </div>
        </div>
    );
}
