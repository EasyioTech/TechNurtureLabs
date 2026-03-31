'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { Users, BookOpen, Award, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard } from './SectionCard';

interface AnimatedCounterProps {
    value: string;
    duration?: number;
}

const AnimatedCounter = ({ value, duration = 2 }: AnimatedCounterProps) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    // Extract numeric part and suffix (e.g., "1M+" -> 1, "M+")
    const match = value.match(/(\d+(?:\.\d+)?)([^\d]*)/);
    const numericValue = match ? parseFloat(match[1]) : 0;
    const suffix = match ? match[2] : '';

    const springValue = useSpring(0, {
        duration: duration * 1000,
        bounce: 0,
    });

    const displayValue = useTransform(springValue, (latest) => {
        if (numericValue % 1 === 0) {
            return Math.floor(latest).toString();
        }
        return latest.toFixed(1);
    });

    useEffect(() => {
        if (inView) {
            springValue.set(numericValue);
        }
    }, [inView, numericValue, springValue]);

    return (
        <span ref={ref} className="tabular-nums">
            <motion.span>{displayValue}</motion.span>
            {suffix}
        </span>
    );
};

interface StatItemProps {
    value: string;
    label: string;
    icon: React.ReactElement;
}

const StatItem = ({ value, label, icon }: StatItemProps) => {
    return (
        <div className="h-full">
            <SectionCard className="group relative h-full flex flex-col items-center justify-center text-center !p-3 sm:!p-6 transition-all duration-300 overflow-hidden">
                <div
                    className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 relative z-10 bg-slate-50 text-indigo-600 border border-slate-100"
                >
                    {React.cloneElement(icon as any, { size: 18, className: "sm:block hidden" })}
                    {React.cloneElement(icon as any, { size: 16, className: "sm:hidden" })}
                </div>

                <div className="relative z-10">
                    <h3 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tighter mb-0.5 sm:mb-1 text-slate-900">
                        <AnimatedCounter value={value} />
                    </h3>
                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-tight">
                        {label}
                    </p>
                </div>
            </SectionCard>
        </div>
    );
};

export const StatsSection = () => {
    return (
        <section id="stats" className="relative py-12 sm:py-20 lg:py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                    <div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            Real outcomes, at scale.
                        </h2>
                        <p className="mt-2 sm:mt-3 text-slate-500 font-medium text-xs sm:text-base max-w-sm mx-auto">
                            Measured across every school that has gone live on TechNurture.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <StatItem
                        value="500+"
                        label="Schools Onboarded"
                        icon={<Building2 />}
                    />
                    <StatItem
                        value="120K+"
                        label="Active Students"
                        icon={<Users />}
                    />
                    <StatItem
                        value="800+"
                        label="Course Modules"
                        icon={<BookOpen />}
                    />
                    <StatItem
                        value="96%"
                        label="Satisfaction Rate"
                        icon={<Award />}
                    />
                </div>
            </div>
        </section>
    );
};
