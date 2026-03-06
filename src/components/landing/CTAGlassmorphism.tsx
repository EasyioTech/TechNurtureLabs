'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { NeumorphicButton } from './NeumorphicButton';

export const CTAGlassmorphism = () => {
    return (
        <section className="py-24 bg-white relative z-10">
            <ScrollReveal>
                <div className="max-w-7xl mx-auto px-6 relative group">

                    {/* Large ambient background glow to make it feel integrated with the page bg */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-50/50 rounded-full blur-[120px] -z-10 group-hover:bg-indigo-50/50 transition-colors duration-1000" />

                    <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">

                        <div className="text-left flex-1 max-w-2xl py-8">
                            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">
                                Ready to leap into the
                                <br className="hidden md:block" />
                                <span className="text-blue-600"> future of learning?</span>
                            </h2>
                            <p className="text-slate-600 text-xl mb-12 font-medium leading-relaxed max-w-xl">
                                Join hundreds of forward-thinking schools making education engaging, personalized, and ridiculously fun.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-5">
                                <Link href="/register/student" className="w-full sm:w-auto">
                                    <NeumorphicButton variant="primary" className="!px-10 !h-14 !text-base !rounded-xl w-full cursor-pointer">
                                        Start Your Journey
                                        <ArrowRight className="ml-2" size={18} />
                                    </NeumorphicButton>
                                </Link>
                                <Link href="/school-portal/register" className="w-full sm:w-auto">
                                    <NeumorphicButton variant="flat" className="!px-10 !h-14 !text-base !rounded-xl w-full cursor-pointer">
                                        Contact Sales
                                    </NeumorphicButton>
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 w-full max-w-[550px] relative">
                            {/* Illustration blended with background */}
                            <img
                                src="/illustrations/cta-primary.webp"
                                alt="Innovation"
                                className="w-full h-auto pointer-events-none relative z-10 mix-blend-multiply"
                            />
                        </div>
                    </div>
                </div>
            </ScrollReveal>
        </section>
    );
};
