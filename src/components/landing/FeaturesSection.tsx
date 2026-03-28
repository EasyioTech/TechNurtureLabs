'use client';

import React from 'react';
import { Gamepad2, BarChart3, Users, Shield, BookOpen, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SectionCard } from './SectionCard';
import { ScrollReveal } from './ScrollReveal';

const NeumorphicIconContainer = ({ children, className, color }: { children: React.ReactNode; className?: string; color: string }) => {
    const colorVariants: Record<string, string> = {
        indigo: "text-indigo-600",
        blue: "text-blue-600",
        sky: "text-sky-600",
        teal: "text-teal-600",
        slate: "text-slate-600",
    };

    return (
        <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
            "bg-slate-50 shadow-[6px_6px_12px_#cbd5e1,-6px_-6px_12px_#ffffff]",
            colorVariants[color] || "text-slate-600",
            className
        )}>
            {children}
        </div>
    );
};

export const FeaturesSection = () => {
    return (
        <section id="features" className="relative z-10 py-32 bg-slate-50 overflow-hidden">

            {/* Subtle organic background shapes for the glassmorphism to pop against */}
            <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-sky-100/60 rounded-full blur-[100px] -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[80px]" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                <div className="text-center mb-20">
                    <ScrollReveal>
                        <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest bg-indigo-100 py-2 px-5 rounded-full inline-block mb-4">
                            Platform Features
                        </span>
                    </ScrollReveal>
                    <ScrollReveal delay={0.1}>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight text-slate-900 drop-shadow-sm">
                            A complete ecosystem for
                            <br />
                            <span className="text-slate-400">modern education.</span>
                        </h2>
                    </ScrollReveal>
                </div>

                {/* CSS Custom Bento Grid with SectionCard. 
                    Uses auto rows on mobile for flexibility, and strict 280px rows on desktop for structure. */}
                <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-auto md:auto-rows-[280px] gap-6">

                    {/* Main Feature - Gamification (Span 2x2) */}
                    <div className="md:col-span-2 md:row-span-2 h-full">
                        <ScrollReveal delay={0.2} className="h-full">
                            <SectionCard className="flex flex-col justify-between group overflow-hidden !bg-white/70 h-full relative border-slate-100 shadow-xl shadow-slate-200/20">
                                <div className="relative z-20">
                                    <NeumorphicIconContainer color="indigo" className="w-16 h-16 rounded-[24px]">
                                        <Gamepad2 size={32} />
                                    </NeumorphicIconContainer>
                                    <h3 className="text-2xl md:text-3xl font-black mb-4 text-slate-900 tracking-tight">Gamified Learning Experience</h3>
                                    <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-md font-medium">
                                        XP points, streaks, badges, and dynamic leaderboards that make learning addictive and rewarding for students.
                                    </p>
                                </div>
                                {/* Decorative Element */}
                                <motion.div
                                    animate={{ y: [0, -15, 0] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute right-0 bottom-0 pointer-events-none md:translate-x-[5%] md:translate-y-[5%] opacity-90 hidden sm:block overflow-hidden"
                                >
                                    <img src="/illustrations/gamified-learning.svg" alt="Gamification" className="w-[200px] md:w-[350px] transform group-hover:scale-105 transition-transform duration-1000" />
                                </motion.div>
                            </SectionCard>
                        </ScrollReveal>
                    </div>

                    {/* Feature 2 (Span 1x1) */}
                    <div className="md:col-span-1 md:row-span-1 h-full">
                        <ScrollReveal delay={0.3} className="h-full">
                            <SectionCard className="flex flex-col h-full !bg-white/60 justify-center group overflow-hidden relative">
                                <div className="relative z-10">
                                    <NeumorphicIconContainer color="blue">
                                        <BookOpen size={24} />
                                    </NeumorphicIconContainer>
                                    <h3 className="text-lg md:text-xl font-black mb-3 text-slate-900 tracking-tight">Interactive Courses</h3>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        Video lessons, rich quizzes, and hands-on activities.
                                    </p>
                                </div>
                                <motion.div
                                    animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -right-2 -bottom-2 opacity-80 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                                >
                                    <img src="/illustrations/interactive-courses.svg" alt="Books" className="w-[180px] h-auto" />
                                </motion.div>
                            </SectionCard>
                        </ScrollReveal>
                    </div>

                    {/* Feature 3 (Span 1x2) */}
                    <div className="md:col-span-1 md:row-span-1 h-full">
                        <ScrollReveal delay={0.4} className="h-full">
                            <SectionCard className="flex flex-col h-full !bg-white/60 group overflow-hidden relative">
                                <div className="relative z-10">
                                    <NeumorphicIconContainer color="sky">
                                        <BarChart3 size={24} />
                                    </NeumorphicIconContainer>
                                    <h3 className="text-xl md:text-2xl font-black mb-4 text-slate-900 tracking-tight">Progress Analytics</h3>
                                    <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed">
                                        Real-time insights into student performance.
                                    </p>
                                </div>

                                <motion.div
                                    animate={{ y: [0, -12, 0], x: [0, 5, 0] }}
                                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                    className="absolute -right-2 -bottom-2 opacity-80 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                                >
                                    <img src="/illustrations/charts.svg" alt="Analytics" className="w-[190px] h-auto" />
                                </motion.div>
                            </SectionCard>
                        </ScrollReveal>
                    </div>

                    {/* Feature 4 (Span 1x1) */}
                    <div className="md:col-span-2 md:row-span-1 h-full">
                        <ScrollReveal delay={0.5} className="h-full">
                            <SectionCard className="flex flex-col h-full !bg-white/60 justify-center group overflow-hidden relative">
                                <div className="relative z-10">
                                    <NeumorphicIconContainer color="teal">
                                        <Globe size={24} />
                                    </NeumorphicIconContainer>
                                    <h3 className="text-lg md:text-xl font-black mb-3 text-slate-900 tracking-tight">Smart Academic Hub</h3>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md">
                                        Centrally manage students, courses, and progress with AI-driven insights that help your institution grow effortlessly.
                                    </p>
                                </div>
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                                    className="absolute -right-4 -bottom-4 opacity-80 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                                >
                                    <img src="/illustrations/learning.svg" alt="Learning" className="w-[240px] h-auto" />
                                </motion.div>
                            </SectionCard>
                        </ScrollReveal>
                    </div>

                    {/* Horizontal Banner (Span 3x1) */}
                    <div className="md:col-span-4 md:row-span-1 h-full">
                        <ScrollReveal delay={0.6} className="h-full">
                            <SectionCard className="flex flex-col md:flex-row items-center justify-between gap-8 h-full !bg-white/60 group overflow-hidden relative">
                                <div className="flex-1 relative z-10">
                                    <NeumorphicIconContainer color="slate">
                                        <Shield size={24} />
                                    </NeumorphicIconContainer>
                                    <h3 className="text-xl md:text-2xl font-black mb-2 text-slate-900 tracking-tight">Enterprise-Grade Security</h3>
                                    <p className="text-sm md:text-base text-slate-600 max-w-xl font-medium leading-relaxed">
                                        Bank-level encryption, absolute data privacy compliance, and strict role-based access control.
                                    </p>
                                </div>
                                <motion.div
                                    initial={{ opacity: 0.8 }}
                                    whileHover={{ opacity: 1, scale: 1.05 }}
                                    className="absolute right-0 top-0 h-full hidden md:flex items-center transition-transform duration-500"
                                >
                                    <img src="/illustrations/safe.svg" alt="Security" className="h-[90%] w-auto" />
                                </motion.div>
                                <div className="hidden md:flex flex-shrink-0 w-32 h-32 relative items-center justify-center self-center mr-12 opacity-20">
                                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-[spin_10s_linear_infinite]" />
                                    <div className="absolute inset-3 border-4 border-indigo-200 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
                                    <Shield size={40} className="text-indigo-600" strokeWidth={1.5} />
                                </div>
                            </SectionCard>
                        </ScrollReveal>
                    </div>


                </div>
            </div>
        </section>
    );
};
