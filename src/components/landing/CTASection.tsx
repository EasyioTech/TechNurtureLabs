'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';

export const CTASection = () => {
    return (
        <section className="py-12 sm:py-20 lg:py-24 bg-white relative z-10">
            <div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 relative group">

                    {/* Ambient glow - scaled for mobile */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 lg:w-[120%] lg:h-[120%] bg-blue-50/60 rounded-full blur-2xl sm:blur-[80px] lg:blur-[120px] -z-10 group-hover:bg-indigo-50/60 transition-colors duration-1000" />

                    <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 relative z-10">

                        <div className="text-left flex-1 max-w-2xl py-4 sm:py-8">
                            <span className="text-[9px] sm:text-xs font-bold text-blue-600 uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-blue-50 py-1.5 sm:py-2 px-3 sm:px-4 rounded-full inline-block mb-3 sm:mb-6 border border-blue-100">
                                Get Started Today
                            </span>
                            <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 tracking-tight text-slate-900 leading-tight sm:leading-[1.1]">
                                Ready to transform
                                <br className="hidden sm:block" />
                                <span className="text-blue-600"> how your school learns?</span>
                            </h2>
                            <p className="text-slate-600 text-sm sm:text-lg lg:text-xl mb-6 sm:mb-12 font-medium leading-relaxed max-w-xl">
                                Join hundreds of schools on TechNurture. Set up in under 24 hours — no technical team needed.
                            </p>

                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
                                <Link href="/register/school" className="w-full sm:w-auto">
                                    <PrimaryButton variant="primary" className="!px-6 sm:!px-10 !h-10 sm:!h-14 !text-sm sm:!text-base !rounded-lg sm:!rounded-xl w-full cursor-pointer">
                                        Start Free Trial
                                        <ArrowRight className="ml-1 sm:ml-2 hidden sm:inline" size={16} />
                                    </PrimaryButton>
                                </Link>
                                <Link href="mailto:hello@technurture.com" className="w-full sm:w-auto">
                                    <PrimaryButton variant="flat" className="!px-6 sm:!px-10 !h-10 sm:!h-14 !text-sm sm:!text-base !rounded-lg sm:!rounded-xl w-full cursor-pointer">
                                        <Calendar size={14} className="sm:size-[17px] mr-1 sm:mr-2 text-slate-500" />
                                        Demo
                                    </PrimaryButton>
                                </Link>
                            </div>

                            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-slate-400 font-medium">
                                14-day free trial · No credit card · UDISE verified
                            </p>
                        </div>

                        <div className="hidden lg:flex flex-1 w-full max-w-[500px] relative">
                            <img
                                src="/illustrations/cta-primary.webp"
                                alt="Start your journey"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-auto pointer-events-none relative z-10 mix-blend-multiply"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
