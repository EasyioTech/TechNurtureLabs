'use client';

import React from 'react';
import { Gamepad2, BarChart3, Users, Shield, BookOpen, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionCard } from './SectionCard';

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
            "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-6",
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
        <section id="features" className="relative z-10 py-12 sm:py-20 lg:py-32 bg-slate-50 overflow-hidden">

            {/* Subtle organic background shapes - scaled for mobile */}
            <div className="absolute top-1/2 left-1/4 w-48 h-48 sm:w-96 sm:h-96 lg:w-[600px] lg:h-[600px] bg-sky-100/60 rounded-full blur-3xl sm:blur-[80px] lg:blur-[100px] -translate-y-1/2 opacity-60 lg:opacity-100" />
            <div className="absolute bottom-0 right-1/4 w-40 h-40 sm:w-80 sm:h-80 lg:w-[500px] lg:h-[500px] bg-indigo-100/40 rounded-full blur-3xl sm:blur-[60px] lg:blur-[80px] opacity-60 lg:opacity-100" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

                <div className="text-center mb-8 sm:mb-12 lg:mb-20">
                    <div>
                        <span className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-100 py-1.5 px-3 sm:py-2 sm:px-5 rounded-full inline-block mb-3 sm:mb-4">
                            Platform Features
                        </span>
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 tracking-tight text-slate-900 drop-shadow-sm leading-tight sm:leading-snug">
                            A complete ecosystem for
                            <br className="hidden sm:block" />
                            <span className="text-slate-400">modern education.</span>
                        </h2>
                    </div>
                </div>

                {/* Mobile: single column. Tablet: 2 cols. Desktop: 4 col bento grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-auto lg:auto-rows-[280px] gap-4 sm:gap-5 lg:gap-6">

                    {/* Main Feature - Gamification (Span 2x2 on desktop, full on mobile) */}
                    <div className="sm:col-span-2 lg:row-span-2 h-full animate-slide-up" style={{ animationDelay: '0ms' }}>
                        <div className="h-full">
                            <SectionCard className="flex flex-col justify-between group overflow-hidden !bg-white/70 h-full relative border-slate-100 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-indigo-200/30 transition-shadow duration-300">
                                <div className="relative z-20">
                                    <NeumorphicIconContainer color="indigo" className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[24px]">
                                        <Gamepad2 size={24} className="sm:block" />
                                    </NeumorphicIconContainer>
                                    <h3 className="text-lg sm:text-2xl lg:text-3xl font-black mb-2 sm:mb-4 text-slate-900 tracking-tight">Gamified Learning</h3>
                                    <p className="text-xs sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-md font-medium">
                                        XP points, streaks, badges, and leaderboards that make learning rewarding for students.
                                    </p>
                                </div>
                                {/* Decorative Element */}
                                <div
                                    className="absolute right-0 bottom-0 pointer-events-none translate-x-[10%] translate-y-[10%] opacity-80 lg:translate-x-[5%] lg:translate-y-[5%] lg:opacity-90 overflow-hidden group-hover:animate-float"
                                >
                                    <img src="/illustrations/gamified-learning.svg" alt="Gamification" className="w-[120px] sm:w-[200px] lg:w-[350px] transition-opacity duration-300 group-hover:opacity-100" />
                                </div>
                            </SectionCard>
                        </div>
                    </div>

                    {/* Feature 2 - Interactive Courses */}
                    <div className="h-full animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div className="h-full">
                            <SectionCard className="flex flex-col h-full !bg-white/60 justify-center group overflow-hidden relative hover:shadow-lg hover:shadow-blue-200/20 transition-shadow duration-300">
                                <div className="relative z-10">
                                    <NeumorphicIconContainer color="blue" className="w-10 h-10 sm:w-12 sm:h-12">
                                        <BookOpen size={20} />
                                    </NeumorphicIconContainer>
                                    <h3 className="text-base sm:text-lg lg:text-xl font-black mb-2 sm:mb-3 text-slate-900 tracking-tight">Interactive Courses</h3>
                                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                                        Video lessons, quizzes, and hands-on activities.
                                    </p>
                                </div>
                                <div
                                    className="absolute -right-2 -bottom-2 opacity-70 sm:opacity-80 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                >
                                    <img src="/illustrations/interactive-courses.svg" alt="Books" className="w-32 sm:w-[180px] h-auto" />
                                </div>
                            </SectionCard>
                        </div>
                    </div>

                    {/* Feature 3 - Progress Analytics */}
                    <div className="h-full animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <div className="h-full">
                            <SectionCard className="flex flex-col h-full !bg-white/60 group overflow-hidden relative hover:shadow-lg hover:shadow-sky-200/20 transition-shadow duration-300">
                                <div className="relative z-10">
                                    <NeumorphicIconContainer color="sky" className="w-10 h-10 sm:w-12 sm:h-12">
                                        <BarChart3 size={20} />
                                    </NeumorphicIconContainer>
                                    <h3 className="text-base sm:text-lg lg:text-2xl font-black mb-2 sm:mb-4 text-slate-900 tracking-tight">Progress Analytics</h3>
                                    <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium leading-relaxed">
                                        Real-time insights into student performance.
                                    </p>
                                </div>

                                <div
                                    className="absolute -right-2 -bottom-2 opacity-70 sm:opacity-80 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                >
                                    <img src="/illustrations/charts.svg" alt="Analytics" className="w-32 sm:w-[190px] h-auto" />
                                </div>
                            </SectionCard>
                        </div>
                    </div>

                    {/* Feature 4 - Smart Academic Hub (Span 2 on sm, 1 on mobile) */}
                    <div className="sm:col-span-2 h-full animate-slide-up" style={{ animationDelay: '300ms' }}>
                        <div className="h-full">
                            <SectionCard className="flex flex-col h-full !bg-white/60 justify-center group overflow-hidden relative hover:shadow-lg hover:shadow-teal-200/20 transition-shadow duration-300">
                                <div className="relative z-10">
                                    <NeumorphicIconContainer color="teal" className="w-10 h-10 sm:w-12 sm:h-12">
                                        <Globe size={20} />
                                    </NeumorphicIconContainer>
                                    <h3 className="text-base sm:text-lg lg:text-xl font-black mb-2 sm:mb-3 text-slate-900 tracking-tight">Smart Academic Hub</h3>
                                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                                        Manage students, courses, and progress with AI-driven insights for institutional growth.
                                    </p>
                                </div>
                                <div
                                    className="absolute -right-4 -bottom-4 opacity-70 sm:opacity-80 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden sm:block"
                                >
                                    <img src="/illustrations/learning.svg" alt="Learning" className="w-40 lg:w-[240px] h-auto" />
                                </div>
                            </SectionCard>
                        </div>
                    </div>

                    {/* Horizontal Banner - Enterprise Security (Span 4 on desktop, 2 on tablet, 1 on mobile) */}
                    <div className="sm:col-span-2 lg:col-span-4 h-full animate-slide-up" style={{ animationDelay: '400ms' }}>
                        <div className="h-full">
                            <SectionCard className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 h-full !bg-white/60 group overflow-hidden relative hover:shadow-xl hover:shadow-slate-200/30 transition-shadow duration-300">
                                <div className="flex-1 relative z-10">
                                    <NeumorphicIconContainer color="slate" className="w-10 h-10 sm:w-12 sm:h-12">
                                        <Shield size={20} />
                                    </NeumorphicIconContainer>
                                    <h3 className="text-base sm:text-lg lg:text-2xl font-black mb-2 text-slate-900 tracking-tight">Enterprise Security</h3>
                                    <p className="text-xs sm:text-sm lg:text-base text-slate-600 max-w-xl font-medium leading-relaxed">
                                        Bank-level encryption, data privacy compliance, and role-based access control.
                                    </p>
                                </div>
                                <div
                                    className="absolute right-0 top-0 h-full hidden lg:flex items-center transition-opacity duration-300 group-hover:opacity-100"
                                >
                                    <img src="/illustrations/safe.svg" alt="Security" className="h-[90%] w-auto" />
                                </div>
                                <div className="hidden lg:flex flex-shrink-0 w-32 h-32 relative items-center justify-center self-center mr-12 opacity-20">
                                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                                    <div className="absolute inset-3 border-4 border-indigo-200 rounded-full" />
                                    <Shield size={40} className="text-indigo-600" strokeWidth={1.5} />
                                </div>
                            </SectionCard>
                        </div>
                    </div>


                </div>
            </div>
        </section>
    );
};
