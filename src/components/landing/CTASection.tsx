'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';

export const CTASection = () => {
    return (
        <section className="py-24 bg-white relative z-10">
            <div>
                <div className="max-w-7xl mx-auto px-6 relative group">

                    {/* Ambient glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/60 rounded-full blur-[120px] -z-10 group-hover:bg-indigo-50/60 transition-colors duration-1000" />

                    <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">

                        <div className="text-left flex-1 max-w-2xl py-8">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] bg-blue-50 py-2 px-4 rounded-full inline-block mb-6 border border-blue-100">
                                Get Started Today
                            </span>
                            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">
                                Ready to transform
                                <br className="hidden md:block" />
                                <span className="text-blue-600"> how your school learns?</span>
                            </h2>
                            <p className="text-slate-600 text-xl mb-12 font-medium leading-relaxed max-w-xl">
                                Join hundreds of schools already running on TechNurture. Get set up in under 24 hours — no technical team needed.
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                <Link href="/register/school" className="w-full sm:w-auto">
                                    <PrimaryButton variant="primary" className="!px-10 !h-14 !text-base !rounded-xl w-full cursor-pointer">
                                        Start Free Trial
                                        <ArrowRight className="ml-2" size={18} />
                                    </PrimaryButton>
                                </Link>
                                <Link href="mailto:hello@technurture.com" className="w-full sm:w-auto">
                                    <PrimaryButton variant="flat" className="!px-10 !h-14 !text-base !rounded-xl w-full cursor-pointer">
                                        <Calendar size={17} className="mr-2 text-slate-500" />
                                        Book a Demo
                                    </PrimaryButton>
                                </Link>
                            </div>

                            <p className="mt-6 text-sm text-slate-400 font-medium">
                                14-day free trial · No credit card required · UDISE verified setup
                            </p>
                        </div>

                        <div className="flex-1 w-full max-w-[500px] relative">
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
