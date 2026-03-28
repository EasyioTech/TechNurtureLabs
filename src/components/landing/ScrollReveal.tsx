'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    staggerChildren?: number;
    duration?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
    children,
    className,
    delay = 0,
    direction = 'up',
    staggerChildren,
    duration = 0.8,
}) => {
    const isMobile = useIsMobile();

    const directions = {
        up: { y: 24, x: 0 },
        down: { y: -24, x: 0 },
        left: { x: 24, y: 0 },
        right: { x: -24, y: 0 },
        none: { x: 0, y: 0 },
    };

    const variants: Variants = {
        hidden: {
            opacity: isMobile ? 1 : 0,
            y: isMobile ? 0 : directions[direction].y,
            x: isMobile ? 0 : directions[direction].x,
            filter: isMobile ? 'blur(0px)' : 'blur(5px)',
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                duration: isMobile ? 0 : duration,
                delay: isMobile ? 0 : delay,
                ease: [0.21, 0.47, 0.32, 0.98],
                staggerChildren: staggerChildren,
            },
        },
    };

    return (
        <motion.div
            initial={isMobile ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            variants={variants}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
};
