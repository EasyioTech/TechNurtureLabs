'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Calendar, Zap } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';

export const CTASection = () => {
    return (
        <section className="py-12 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative z-10 overflow-hidden">
            <div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 relative group">

                    {/* Animated gradient background */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute top-0 left-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse-subtle -translate-x-1/2" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 relative z-10"
                    >

                        <div className="text-left flex-1 max-w-2xl py-4 sm:py-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 backdrop-blur-sm mb-3 sm:mb-6">
                                <Zap size={14} className="text-cyan-400" />
                                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Get Started Today</span>
                            </div>
                            <h2 className="text-2xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight text-white leading-tight sm:leading-[1.1]">
                                Ready to transform
                                <br className="hidden sm:block" />
                                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">how your school learns?</span>
                            </h2>
                            <p className="text-slate-300 text-sm sm:text-lg lg:text-xl mb-6 sm:mb-12 font-medium leading-relaxed max-w-xl">
                                Join hundreds of schools on TechNurture. Set up in under 24 hours — no technical team needed.
                            </p>

                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
                                <Link href="/register/school" className="w-full sm:w-auto">
                                    <PrimaryButton variant="primary" className="!px-6 sm:!px-10 !h-10 sm:!h-14 !text-sm sm:!text-base !rounded-lg sm:!rounded-xl w-full cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-blue-600/50">
                                        Start Free Trial
                                        <ArrowRight className="ml-1 sm:ml-2 hidden sm:inline" size={16} />
                                    </PrimaryButton>
                                </Link>
                                <Link href="mailto:hello@technurture.com" className="w-full sm:w-auto">
                                    <PrimaryButton variant="flat" className="!px-6 sm:!px-10 !h-10 sm:!h-14 !text-sm sm:!text-base !rounded-lg sm:!rounded-xl w-full cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm">
                                        <Calendar size={14} className="sm:size-[17px] mr-1 sm:mr-2" />
                                        Demo
                                    </PrimaryButton>
                                </Link>
                            </div>

                            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-slate-400 font-medium">
                                14-day free trial · No credit card · UDISE verified
                            </p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="hidden lg:flex flex-1 w-full max-w-[500px] relative items-center justify-center"
                        >
                            <div className="w-full h-[300px] rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 backdrop-blur-sm flex items-center justify-center">
                                <ArrowRight size={80} className="text-cyan-400/30" />
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
