'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface SkeuomorphicStatProps extends HTMLMotionProps<"div"> {
    value: string;
    label: string;
    className?: string;
    icon?: React.ReactNode;
}

export const SkeuomorphicStat = React.forwardRef<HTMLDivElement, SkeuomorphicStatProps>(
    ({ value, label, className, icon, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                whileHover={{ y: -5 }}
                className={cn(
                    "relative p-8 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center",
                    // Outer shadow for elevation
                    "shadow-[10px_10px_20px_#d1d5db,-10px_-10px_20px_#ffffff]",
                    "bg-slate-50 border border-white/50",
                    className
                )}
                {...props}
            >
                {/* Inner debossed well for the number */}
                <div className="relative w-full h-32 rounded-2xl bg-slate-100 shadow-[inset_6px_6px_12px_#cbd5e1,inset_-6px_-6px_12px_#ffffff] flex items-center justify-center border border-white/40 mb-6 overflow-hidden">
                    {/* Subtle reflection overlay inside the well */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

                    <span className="text-5xl md:text-6xl font-black text-slate-700 tracking-tighter drop-shadow-sm z-10">
                        {value}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="w-8 h-8 rounded-full bg-slate-50 shadow-[4px_4px_8px_#cbd5e1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-blue-500">
                            {icon}
                        </div>
                    )}
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                        {label}
                    </span>
                </div>
            </motion.div>
        );
    }
);
SkeuomorphicStat.displayName = "SkeuomorphicStat";
