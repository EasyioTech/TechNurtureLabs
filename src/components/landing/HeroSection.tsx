'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle2, Sparkles } from 'lucide-react';

export const HeroSection = ({ settings }: { settings?: any }) => {
    return (
        <section className="relative z-10 pt-28 pb-12 md:pt-40 md:pb-24 lg:pt-32 lg:pb-20 overflow-hidden bg-slate-50 lg:min-h-screen flex items-center">

            {/* Precision Grid Background */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Ambient glow - scaled for devices */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 md:w-[600px] md:h-[600px] lg:w-[900px] lg:h-[450px] bg-blue-100/60 rounded-full blur-3xl md:blur-[100px] lg:blur-[130px] pointer-events-none -z-10 animate-pulse-subtle" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Mobile & Tablet: Content Flows Vertically */}
                    <div className="lg:hidden flex flex-col items-center text-center max-w-2xl mx-auto">

                        {/* Capsule - Top (Separating from Logo) */}
                        <div className="mb-6 md:mb-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 shadow-sm">
                                {settings?.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-4 h-4 object-contain" />
                                ) : (
                                    <Sparkles size={14} className="text-blue-600" />
                                )}
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{settings?.platform_name || 'TechNurture'}</span>
                            </div>
                        </div>

                        {/* Illustration - Key focus for tablet */}
                        <div className="relative w-full h-64 sm:h-80 md:h-[450px] mb-8 md:mb-12">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
                                className="relative z-10 w-full h-full group flex items-center justify-center px-4"
                            >
                                <img
                                    src="/assets/gaming-hero.svg"
                                    alt="TechNurture Education Platform"
                                    loading="eager"
                                    fetchPriority="high"
                                    decoding="async"
                                    className="w-full h-full object-contain pointer-events-none mix-blend-multiply opacity-90 transition-transform duration-700 group-hover:scale-[1.02]"
                                />
                            </motion.div>
                            <div className="absolute inset-0 bg-blue-100/30 rounded-full blur-[80px] md:blur-[120px] -z-10" />
                        </div>

                        {/* Heading - Bigger on Tablet (md) */}
                        <div className="mb-4 md:mb-6 px-2">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight md:leading-[1.15] text-slate-900">
                                The online learning platform{' '}
                                <span className="text-blue-600 block md:inline">students actually love.</span>
                            </h1>
                        </div>

                        {/* Description */}
                        <div className="mb-6 md:mb-10 max-w-xl mx-auto">
                            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-medium">
                                Gamified LMS for K-12 schools across India — courses in IoT, embedded systems, full-stack development, and skill-based programming, with real-time analytics and school-wide student management.
                            </p>
                        </div>

                        {/* Buttons & Trust Signals */}
                        <div className="w-full max-w-md">
                            <div className="flex flex-row gap-3 items-center">
                                <Link href="#demo" className="flex-1">
                                    <button className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-4 py-3 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm cursor-pointer whitespace-nowrap">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 shrink-0">
                                            <Play size={8} className="text-white ml-0.5 fill-current" />
                                        </span>
                                        Watch Demo
                                    </button>
                                </Link>
                                <Link href="/register/school" className="flex-1">
                                    <button className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-3 rounded-xl shadow-lg shadow-slate-900/20 transition-all text-sm cursor-pointer whitespace-nowrap">
                                        Register School
                                    </button>
                                </Link>
                            </div>

                            <div className="flex flex-row flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-8 text-[11px] md:text-xs text-slate-500 font-medium border-t border-slate-100 pt-6">
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> No credit card</div>
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> Free trial</div>
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> UDISE verified</div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop: Two Column Layout (Large Viewports Only) */}
                    <div className="hidden lg:flex flex-col items-start text-left justify-center pr-8">

                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 shadow-sm">
                                {settings?.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-4 h-4 object-contain" />
                                ) : (
                                    <Sparkles size={14} className="text-blue-600" />
                                )}
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{settings?.platform_name || 'TechNurture'} Labs</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h1 className="text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] text-slate-900">
                                The online learning platform{' '}
                                <span className="text-blue-600">students actually love.</span>
                            </h1>
                        </div>

                        <div className="mb-8">
                            <p className="text-lg text-slate-600 leading-relaxed font-medium max-w-xl">
                                Gamified LMS for K-12 schools across India — courses in IoT, embedded systems, full-stack development, and skill-based programming, with real-time analytics and school-wide student management.
                            </p>
                        </div>

                        <div className="w-full">
                            <div className="flex flex-row items-center gap-3">
                                <Link href="/register/school" className="w-auto">
                                    <button className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-slate-900/20 transition-colors text-base cursor-pointer">
                                        Register School
                                        <ArrowRight size={16} />
                                    </button>
                                </Link>
                                <Link href="#demo" className="w-auto">
                                    <button className="flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-7 py-3.5 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-base cursor-pointer">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 shrink-0">
                                            <Play size={10} className="text-white ml-0.5 fill-current" />
                                        </span>
                                        Watch Demo
                                    </button>
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-500 font-medium">
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> No credit card required</div>
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> 14-day free trial</div>
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> UDISE verified</div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop: Right Column - Illustration */}
                    <div className="hidden lg:block relative w-full max-w-[650px] mx-auto ml-auto">
                        <motion.div
                            initial={{ opacity: 0, x: 16, y: 8 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
                            className="relative z-10 w-full h-full group"
                        >
                            <img
                                src="/assets/gaming-hero.svg"
                                alt="TechNurture Education Platform"
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                                className="w-full h-auto object-contain pointer-events-none mix-blend-multiply opacity-90 transition-transform duration-700 group-hover:scale-[1.02]"
                            />
                        </motion.div>

                        {/* Ambient glow behind illustration */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/30 rounded-full blur-[100px] -z-10" />
                    </div>

                </div>
            </div>
        </section>

    );
};
