'use client';

import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { SkeuomorphicStat } from './SkeuomorphicStat';
import { Users, BookOpen, Award, Building2 } from 'lucide-react';

export const StatsSkeuomorphic = () => {
    return (
        <section className="py-32 bg-slate-50 relative z-10 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                <div className="text-center mb-20">
                    <ScrollReveal>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
                            By the Numbers
                        </h2>
                        <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                            Join a growing community of educators and students transforming the classroom.
                        </p>
                    </ScrollReveal>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    <ScrollReveal delay={0.1} direction="up">
                        <SkeuomorphicStat
                            value="500+"
                            label="Schools"
                            icon={<Building2 size={16} />}
                        />
                    </ScrollReveal>

                    <ScrollReveal delay={0.2} direction="up">
                        <SkeuomorphicStat
                            value="1M+"
                            label="Students"
                            icon={<Users size={16} />}
                            className="lg:translate-y-8"
                        />
                    </ScrollReveal>

                    <ScrollReveal delay={0.3} direction="up">
                        <SkeuomorphicStat
                            value="10K+"
                            label="Courses"
                            icon={<BookOpen size={16} />}
                        />
                    </ScrollReveal>

                    <ScrollReveal delay={0.4} direction="up">
                        <SkeuomorphicStat
                            value="98%"
                            label="Satisfaction"
                            icon={<Award size={16} />}
                            className="lg:translate-y-8"
                        />
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
};
