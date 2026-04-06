'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle2, Sparkles, Zap, Users, TrendingUp } from 'lucide-react';

export const HeroSection = ({ settings }: { settings?: any }) => {
    return (
        <section className="relative z-10 pt-20 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 lg:min-h-screen flex items-center">

            {/* Animated gradient background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-subtle" />
                <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }} />
            </div>

            {/* Grid overlay */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Mobile & Tablet: Content */}
                    <div className="lg:hidden flex flex-col items-center text-center max-w-2xl mx-auto">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mb-8"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 backdrop-blur-sm hover:border-blue-400/50 transition-all">
                                <Zap size={14} className="text-cyan-400" />
                                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">AI-Powered Learning</span>
                            </div>
                        </motion.div>

                        {/* Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="mb-6"
                        >
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight md:leading-[1.1] text-white">
                                The learning platform{' '}
                                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">India trusts</span>
                            </h1>
                        </motion.div>

                        {/* Description */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mb-8 max-w-xl"
                        >
                            <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed font-medium">
                                Gamified learning for K-12. IoT, embedded systems, full-stack development—all in one platform. Real-time analytics, certified instructors, and 100K+ happy students.
                            </p>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="w-full max-w-md space-y-4"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link href="/register/school" className="flex-1">
                                    <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/50 transition-all text-sm sm:text-base cursor-pointer group">
                                        Register School
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                                <Link href="#demo" className="flex-1">
                                    <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all text-sm sm:text-base cursor-pointer">
                                        <Play size={14} className="fill-current" />
                                        Watch Demo
                                    </button>
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
                                <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-300">
                                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                    <span>No credit card required</span>
                                </div>
                                <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-300">
                                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                    <span>14-day free trial</span>
                                </div>
                                <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-300">
                                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                    <span>UDISE verified & certified</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Desktop: Left Column - Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9 }}
                        className="hidden lg:flex flex-col items-start text-left justify-center pr-8 space-y-8"
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 backdrop-blur-sm hover:border-blue-400/50 transition-all w-fit">
                            <Zap size={16} className="text-cyan-400" />
                            <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">AI-Powered Platform</span>
                        </div>

                        {/* Heading */}
                        <div>
                            <h1 className="text-7xl xl:text-8xl font-bold tracking-tight leading-[0.95] text-white mb-4">
                                The learning platform{' '}
                                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent block">India trusts</span>
                            </h1>
                        </div>

                        {/* Description */}
                        <p className="text-lg text-slate-300 leading-relaxed font-medium max-w-xl">
                            Gamified learning for K-12 schools. Master IoT, embedded systems, and full-stack development. Real-time analytics, certified instructors, trusted by 100K+ students across India.
                        </p>

                        {/* Stats Row */}
                        <div className="flex gap-8 pt-4">
                            <div className="flex flex-col gap-1">
                                <div className="text-3xl font-bold text-cyan-400">100K+</div>
                                <div className="text-sm text-slate-400">Active Students</div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="text-3xl font-bold text-purple-400">500+</div>
                                <div className="text-sm text-slate-400">Courses</div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="text-3xl font-bold text-blue-400">98%</div>
                                <div className="text-sm text-slate-400">Success Rate</div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap items-center gap-4 pt-4">
                            <Link href="/register/school">
                                <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-600/50 transition-all text-base cursor-pointer group">
                                    Register School
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                            <Link href="#demo">
                                <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all text-base cursor-pointer">
                                    <Play size={16} className="fill-current" />
                                    Watch Demo
                                </button>
                            </Link>
                        </div>

                        {/* Trust badges */}
                        <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-slate-400 font-medium border-t border-white/10 pt-8">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <span>No credit card</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <span>Free trial</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <span>UDISE verified</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Desktop: Right Column - Illustration */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9 }}
                        className="hidden lg:block relative w-full max-w-[600px] mx-auto"
                    >
                        <div className="relative z-10 group">
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <img
                                    src="/assets/gaming-hero.svg"
                                    alt="TechNurture Education Platform"
                                    loading="eager"
                                    fetchPriority="high"
                                    decoding="async"
                                    className="w-full h-auto object-contain pointer-events-none transition-transform duration-700 group-hover:scale-[1.05]"
                                />
                            </motion.div>
                        </div>

                        {/* Glow effects */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-cyan-500/20 to-transparent rounded-full blur-3xl -z-10 animate-pulse-subtle" />
                        <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl -z-10" />
                    </motion.div>

                </div>
            </div>
        </section>

    );
};
