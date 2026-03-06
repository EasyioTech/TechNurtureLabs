'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface NeumorphicButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    className?: string;
    variant?: 'flat' | 'pressed' | 'primary';
    size?: 'sm' | 'md' | 'lg';
}

export const NeumorphicButton = React.forwardRef<HTMLButtonElement, NeumorphicButtonProps>(
    ({ children, className, variant = 'flat', size = 'md', ...props }, ref) => {

        const isMobile = useIsMobile();
        const baseClasses = "relative font-bold transition-all duration-300 flex items-center justify-center gap-2 outline-none cursor-pointer";

        const sizeClasses = {
            sm: "px-4 py-2 text-xs rounded-lg",
            md: "px-8 py-4 text-base rounded-xl",
            lg: "px-10 py-5 text-lg rounded-2xl"
        };

        const hoverClasses = !isMobile ? "hover:-translate-y-[1px]" : "";

        const variants = {
            flat: cn("bg-slate-50 text-slate-700 shadow-[6px_6px_12px_#cbd5e1,-6px_-6px_12px_#ffffff] hover:shadow-[4px_4px_8px_#cbd5e1,-4px_-4px_8px_#ffffff] active:shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff]", hoverClasses),
            pressed: "bg-slate-50 text-slate-700 shadow-[inset_6px_6px_12px_#cbd5e1,inset_-6px_-6px_12px_#ffffff]",
            primary: cn("bg-indigo-500 text-white shadow-[6px_6px_12px_#cbd5e1,-6px_-6px_12px_#ffffff] hover:shadow-[4px_4px_8px_#cbd5e1,-4px_-4px_8px_#ffffff] active:shadow-[inset_4px_4px_8px_#4f46e5,inset_-4px_-4px_8px_#818cf8] active:translate-y-[1px]", hoverClasses)
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.98 }}
                className={cn(baseClasses, sizeClasses[size], variants[variant], className)}
                {...props}
            >
                {children}
            </motion.button>
        );
    }
);
NeumorphicButton.displayName = "NeumorphicButton";
