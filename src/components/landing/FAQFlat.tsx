'use client';

import React, { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const FAQFlat = () => {
    return (
        <section className="py-24 bg-white relative z-10">
            <div className="max-w-4xl mx-auto px-6">

                <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
                    <div className="text-left flex-1">
                        <ScrollReveal>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                Frequently Asked <br className="hidden md:block" /> Questions
                            </h2>
                            <p className="mt-4 text-lg text-slate-600 font-medium max-w-md">
                                Everything you need to know about the TechNurture platform and our onboarding process.
                            </p>
                        </ScrollReveal>
                    </div>
                    <ScrollReveal delay={0.2} className="hidden lg:block w-full max-w-[400px]">
                        <img src="/illustrations/faq-primary.webp" alt="FAQ Support" className="w-full h-auto pointer-events-none mix-blend-multiply" />
                    </ScrollReveal>
                </div>

                <ScrollReveal delay={0.2}>
                    <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                        <FAQItem
                            question="How long does it take to onboard our school?"
                            answer="Our streamlined onboarding process usually takes less than 24 hours. Once your UDISE code is verified, you can immediately begin inviting teachers and students."
                        />
                        <FAQItem
                            question="Can we customize the platform to match our school colors?"
                            answer="Absolutely. The Pro and District plans include complete white-labeling capabilities, allowing you to upload your school logo and set your exact brand colors."
                        />
                        <FAQItem
                            question="Is student data secure and private?"
                            answer="Yes. We employ enterprise-grade encryption and comply with all national and international data privacy regulations for minors. Student data is never sold or shared."
                        />
                        <FAQItem
                            question="Do you offer training for our teachers?"
                            answer="We provide extensive documentation, video tutorials, and dedicated live onboarding sessions for your entire teaching staff to ensure a smooth transition."
                        />
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="py-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-left focus:outline-none group cursor-pointer"
            >
                <span className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {question}
                </span>
                <ChevronDown
                    className={cn("text-slate-400 transition-transform duration-300", isOpen ? "rotate-180" : "rotate-0")}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <p className="pt-4 text-slate-600 font-medium leading-relaxed">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
