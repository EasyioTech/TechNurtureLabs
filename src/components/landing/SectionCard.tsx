'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface SectionCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
}

// Glassmorphism Light: Translucent white panels, subtle blur, fine white borders
export const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
    ({ children, className, ...props }, ref) => {
        const isMobile = useIsMobile();
        return (
            <motion.div
                ref={ref}
                className={cn(
                    "relative rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] overflow-hidden cursor-pointer group/card",
                    "bg-white/80 backdrop-blur-xl",
                    "border border-white/60",
                    "shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]",
                    "transition-all duration-500 hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)]",
                    "hover:border-indigo-200/50",
                    className
                )}
                {...props}
            >
                {/* Dynamic border highlight on hover */}
                <div className="absolute inset-0 border-2 border-transparent group-hover/card:border-indigo-500/10 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] transition-colors duration-500 pointer-events-none z-20" />

                <div className="relative z-10 w-full h-full p-4 sm:p-6 lg:p-8 lg:p-10">
                    {children}
                </div>
            </motion.div>
        );
    }
);
SectionCard.displayName = "SectionCard";
