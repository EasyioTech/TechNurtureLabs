'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    containerClassName?: string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, glowColor, containerClassName, ...props }, ref) => {
        return (
            <div className={cn("relative group h-full", containerClassName)}>
                {glowColor && (
                    <div
                        className="absolute -inset-0.5 rounded-3xl opacity-0 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 blur-2xl z-0"
                        style={{ backgroundColor: glowColor }}
                    />
                )}
                <motion.div
                    ref={ref}
                    className={cn(
                        "relative h-full w-full rounded-3xl overflow-hidden",
                        "bg-[#13131a]/80 group-hover:bg-[#1a1a24]/90 transition-colors duration-500",
                        "border border-white/[0.08] group-hover:border-white/[0.15]",
                        "backdrop-blur-xl",
                        "shadow-2xl shadow-black/40",
                        className
                    )}
                    {...props}
                >
                    {/* Subtle inner highlight */}
                    <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5 pointer-events-none" />

                    <div className="relative z-10 h-full p-6 md:p-8">
                        {children}
                    </div>
                </motion.div>
            </div>
        );
    }
);
GlassCard.displayName = "GlassCard";
