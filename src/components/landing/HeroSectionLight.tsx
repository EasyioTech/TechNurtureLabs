'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Presentation, Sparkles, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const HeroSectionLight = ({ settings }: { settings?: any }) => {
    return (
        <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">

            {/* Precision Grid Background */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-100/50 rounded-full blur-[120px] pointer-events-none -z-10" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Copy & CTAs */}
                    <div className="flex flex-col items-start text-left max-w-2xl mx-auto lg:mx-0">

                        <ScrollReveal delay={0.1} direction="up" duration={0.8}>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 shadow-sm mb-6">
                                {settings?.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-4 h-4 object-contain" />
                                ) : (
                                    <Sparkles size={14} className="text-blue-600" />
                                )}
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{settings?.platform_name || 'TechNurture'} Labs</span>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={0.2} direction="up" duration={0.8}>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-slate-900">
                                Education Infrastructure that <span className="text-blue-600">Scales.</span>
                            </h1>
                        </ScrollReveal>

                        <ScrollReveal delay={0.3} direction="up" duration={0.8}>
                            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed font-medium max-w-xl">
                                A unified, gamified operating system for K-12 institutions. Drive student outcomes, streamline administration, and deliver world-class learning experiences at scale.
                            </p>
                        </ScrollReveal>

                        <ScrollReveal delay={0.4} direction="up" duration={0.8}>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                                <Link href="/register/school" className="w-full sm:w-auto">
                                    <motion.button
                                        whileHover={{ y: -1 }}
                                        whileTap={{ y: 1 }}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all text-base cursor-pointer"
                                    >
                                        Register Your School
                                        <ArrowRight size={18} />
                                    </motion.button>
                                </Link>
                                <Link href="#demo" className="w-full sm:w-auto">
                                    <motion.button
                                        whileHover={{ y: -1, backgroundColor: 'rgba(241, 245, 249, 1)' }}
                                        whileTap={{ y: 1 }}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-8 py-4 rounded-xl shadow-sm border border-slate-200 transition-all text-base cursor-pointer"
                                    >
                                        <Presentation size={18} className="text-blue-600" />
                                        Login or Book a Demo
                                    </motion.button>
                                </Link>
                            </div>
                            <div className="flex items-center gap-6 mt-8 text-sm text-slate-500 font-medium">
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> No credit card required</div>
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> 14-day free trial</div>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Right Column: Hero Illustration (Integrated with background) */}
                    <div className="relative w-full max-w-[650px] mx-auto lg:ml-auto">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1 }}
                            className="relative z-10 w-full h-full group"
                        >
                            <img
                                src="/assets/gaming-hero.svg"
                                alt="Education Infrastructure"
                                className="w-full h-auto object-contain pointer-events-none mix-blend-multiply opacity-90 transition-transform duration-700 group-hover:scale-[1.02]"
                            />
                        </motion.div>

                        {/* Soft ambient glow behind illustration (No hard borders) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/30 rounded-full blur-[100px] -z-10 group-hover:bg-blue-200/30 transition-colors duration-1000" />
                    </div>

                </div>
            </div>
        </section>
    );
};
