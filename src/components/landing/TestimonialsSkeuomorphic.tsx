'use client';

import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { Quote } from 'lucide-react';
import { motion } from 'framer-motion';

export const TestimonialsSkeuomorphic = () => {
    return (
        <section className="py-32 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 relative z-10 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-24">
                    <ScrollReveal>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
                            Trusted by Educators
                        </h2>
                    </ScrollReveal>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 max-w-6xl mx-auto justify-items-center">

                    <ScrollReveal delay={0.1}>
                        <Polaroid
                            image="https://images.unsplash.com/photo-1580894732444-8ecded790047?w=400&h=400&fit=crop"
                            name="Sarah Jenkins"
                            role="Principal, Oakwood High"
                            quote="The gamification features completely changed our completely changed our students' engagement levels overnight."
                            rotation="-rotate-3"
                        />
                    </ScrollReveal>

                    <ScrollReveal delay={0.3}>
                        <Polaroid
                            image="https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=400&fit=crop"
                            name="Dr. Michael Chen"
                            role="District Superintendent"
                            quote="A robust, secure platform that actually understands how modern education needs to function."
                            rotation="rotate-2"
                            offset="translate-y-8"
                        />
                    </ScrollReveal>

                    <ScrollReveal delay={0.5}>
                        <Polaroid
                            image="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop"
                            name="Elena Rodriguez"
                            role="Lead Teacher"
                            quote="The analytics give me superpowers. I know exactly who needs help before they even ask."
                            rotation="-rotate-2"
                        />
                    </ScrollReveal>

                </div>
            </div>
        </section>
    );
};

function Polaroid({ image, name, role, quote, rotation, offset = "" }: any) {
    return (
        <motion.div
            whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
            className={`relative w-80 bg-white p-4 pb-12 shadow-[0_15px_35px_rgba(0,0,0,0.15),0_5px_15px_rgba(0,0,0,0.1)] border border-slate-200 transform ${rotation} ${offset} transition-transform duration-300`}
        >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-100/40 backdrop-blur-sm shadow-sm rotate-1 z-10" /> {/* Simulating tape */}

            <div className="bg-slate-100 mb-4 overflow-hidden aspect-square border border-slate-200 shadow-inner relative">
                <img src={image} alt={name} className="w-full h-full object-cover filter contrast-110 saturate-110" />
            </div>

            <div className="px-2">
                <Quote className="text-slate-300 mb-2" size={24} fill="currentColor" />
                <p className="text-slate-700 font-[Kalam,cursive] text-lg leading-snug mb-4 h-24 line-clamp-4">
                    "{quote}"
                </p>
                <div className="border-t border-slate-100 pt-2 text-center">
                    <p className="font-bold text-slate-800 text-sm uppercase tracking-wider">{name}</p>
                    <p className="text-slate-500 text-xs mt-1">{role}</p>
                </div>
            </div>
        </motion.div>
    );
}
