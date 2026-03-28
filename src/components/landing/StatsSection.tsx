'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { Users, BookOpen, Award, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard } from './SectionCard';
import { ScrollReveal } from './ScrollReveal';

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
    icon: React.ReactNode;
    delay?: number;
}

const StatItem = ({ value, label, icon, delay = 0 }: StatItemProps) => {
    return (
        <ScrollReveal delay={delay} direction="up" className="h-full">
            <SectionCard className="group relative h-full flex flex-col items-center justify-center text-center !p-6 transition-all duration-300 overflow-hidden">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative z-10 bg-slate-50 text-indigo-600 border border-slate-100"
                >
                    {React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: 2 })}
                </div>

                <div className="relative z-10">
                    <h3 className="text-3xl md:text-4xl font-black tracking-tighter mb-1 text-slate-900">
                        <AnimatedCounter value={value} />
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                        {label}
                    </p>
                </div>
            </SectionCard>
        </ScrollReveal>
    );
};

export const StatsSection = () => {
    return (
        <section id="stats" className="relative py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <ScrollReveal>
                        <span className="px-4 py-1.5 rounded-full bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-[0.2em] border border-slate-100 mb-6 inline-block">
                            By the Numbers
                        </span>
                    </ScrollReveal>
                    <ScrollReveal delay={0.1}>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            Real outcomes, at scale.
                        </h2>
                        <p className="mt-3 text-slate-500 font-medium text-base max-w-sm mx-auto">
                            Measured across every school that has gone live on TechNurture.
                        </p>
                    </ScrollReveal>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <StatItem
                        value="500+"
                        label="Schools Onboarded"
                        icon={<Building2 />}
                        delay={0.1}
                    />
                    <StatItem
                        value="120K+"
                        label="Active Students"
                        icon={<Users />}
                        delay={0.2}
                    />
                    <StatItem
                        value="800+"
                        label="Course Modules"
                        icon={<BookOpen />}
                        delay={0.3}
                    />
                    <StatItem
                        value="96%"
                        label="Satisfaction Rate"
                        icon={<Award />}
                        delay={0.4}
                    />
                </div>
            </div>
        </section>
    );
};
