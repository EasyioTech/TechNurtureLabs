'use client';

import React, { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const FAQSection = () => {
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
                                Everything schools ask before going live. If you have more, our team is one message away.
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
                            answer="Our streamlined onboarding process usually takes less than 24 hours. Once your UDISE code is verified, you can immediately begin inviting teachers and students — no technical setup required."
                        />
                        <FAQItem
                            question="How does the gamification system work?"
                            answer="Students earn XP points for completing lessons, quizzes, and daily streaks. Points unlock badges and push them up class leaderboards. Every element is designed to build healthy habits and intrinsic motivation — not just competition."
                        />
                        <FAQItem
                            question="Does TechNurture work on mobile devices?"
                            answer="Yes, fully. The platform is responsive on all screen sizes and we have dedicated mobile-optimised views for students. Teachers can manage classrooms, review submissions, and post announcements directly from their phones."
                        />
                        <FAQItem
                            question="Can we customize the platform to match our school's branding?"
                            answer="Absolutely. The Pro and District plans include complete white-labeling — upload your school logo, set your brand colors, and the platform looks and feels like your own. Students see your school's identity, not ours."
                        />
                        <FAQItem
                            question="Is student data secure and private?"
                            answer="Yes. We use enterprise-grade encryption at rest and in transit, and comply with all national data privacy regulations for minors. Student data is never sold, shared, or used for advertising. Period."
                        />
                        <FAQItem
                            question="Do you offer support and training for teachers?"
                            answer="We provide comprehensive documentation, video walkthroughs, and dedicated live onboarding sessions for your entire teaching staff. Our support team is reachable via chat during school hours — and critical issues are responded to within the hour."
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
