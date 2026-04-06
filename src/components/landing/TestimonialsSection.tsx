'use client';

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { SectionCard } from "./SectionCard";
import { useIsMobile } from "@/hooks/use-mobile";

const testimonials = [
    {
        text: "Our students' average scores improved by 22% in one term. The gamified lessons keep them engaged in a way traditional textbooks never could.",
        image: "https://randomuser.me/api/portraits/women/44.jpg",
        name: "Priya Sharma",
        role: "Principal, Delhi Public School",
    },
    {
        text: "Setting up the entire school took less than a day. The dashboard makes it effortless to track every student's progress at a glance.",
        image: "https://randomuser.me/api/portraits/men/32.jpg",
        name: "Arjun Mehta",
        role: "IT Coordinator, Kendriya Vidyalaya",
    },
    {
        text: "My son actually looks forward to studying now. The XP points and streaks have turned homework from a battle into something he genuinely enjoys.",
        image: "https://randomuser.me/api/portraits/women/68.jpg",
        name: "Kavitha Nair",
        role: "Parent, Grade 7",
    },
    {
        text: "I can assign lessons, track completion, and share feedback with parents — all from one screen. TechNurture has completely replaced our old, scattered tools.",
        image: "https://randomuser.me/api/portraits/men/54.jpg",
        name: "Rajesh Kumar",
        role: "Senior Teacher, DAV School",
    },
    {
        text: "We rolled TechNurture out across 12 branches in a single week. The centralized admin panel gives us real-time visibility across every campus.",
        image: "https://randomuser.me/api/portraits/women/26.jpg",
        name: "Sunita Joshi",
        role: "District Education Officer",
    },
    {
        text: "The leaderboard feature is a game-changer. Healthy competition has completely transformed classroom dynamics and participation.",
        image: "https://randomuser.me/api/portraits/men/76.jpg",
        name: "Vikram Patel",
        role: "Science Teacher, Grade 9",
    },
    {
        text: "We switched from a different platform and the difference is night and day. The content quality and quiz formats are far superior.",
        image: "https://randomuser.me/api/portraits/women/12.jpg",
        name: "Meenakshi Rao",
        role: "Academic Director, Ryan International",
    },
    {
        text: "The parent portal keeps me involved in my daughter's learning. I can see exactly where she excels and where she needs extra support.",
        image: "https://randomuser.me/api/portraits/men/22.jpg",
        name: "Sanjay Gupta",
        role: "Parent, Grade 5",
    },
    {
        text: "TechNurture's onboarding team was incredible. We had all 800 students and 60 teachers live on the platform within two days.",
        image: "https://randomuser.me/api/portraits/women/38.jpg",
        name: "Anita Desai",
        role: "Principal, Amity International School",
    },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const StarRating = () => (
    <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

export const TestimonialsColumn = (props: {
    className?: string;
    testimonials: typeof testimonials;
    duration?: number;
}) => {
    const isMobile = useIsMobile();
    return (
        <div className={cn("relative overflow-hidden", props.className)}>
            <motion.div
                animate={isMobile ? {} : {
                    translateY: "-50%",
                }}
                transition={{
                    duration: props.duration || 10,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                }}
                className="flex flex-col gap-3 sm:gap-4 pb-3 sm:pb-4"
            >
                {[...new Array(2)].map((_, index) => (
                    <React.Fragment key={index}>
                        {props.testimonials.map(({ text, image, name, role }, i) => (
                            <SectionCard
                                key={i}
                                className="!p-3 sm:!p-6 w-full max-w-xs sm:max-w-[320px] bg-white border-slate-100"
                            >
                                <StarRating />
                                <div className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                                    "{text}"
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
                                    <img
                                        width={32}
                                        height={32}
                                        src={image}
                                        alt={name}
                                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-slate-100"
                                    />
                                    <div className="flex flex-col text-left min-w-0">
                                        <div className="font-bold text-slate-900 tracking-tight text-[10px] sm:text-xs truncate">{name}</div>
                                        <div className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">{role}</div>
                                    </div>
                                </div>
                            </SectionCard>
                        ))}
                    </React.Fragment>
                ))}
            </motion.div>
        </div>
    );
};

export const TestimonialsSection = () => {
    return (
        <section id="testimonials" className="relative py-12 sm:py-20 lg:py-24 bg-white overflow-hidden border-t border-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                    <div>
                        <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-slate-50 text-slate-600 text-[9px] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] border border-slate-100 mb-3 sm:mb-6 inline-block">
                            Real Stories
                        </span>
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            Loved by schools across India.
                        </h2>
                        <p className="mt-2 sm:mt-3 text-slate-500 font-medium text-xs sm:text-base max-w-md mx-auto">
                            Teachers and parents share what changed after switching to TechNurture.
                        </p>
                    </div>
                </div>

                <div className="relative flex justify-center gap-3 sm:gap-6 mt-8 sm:mt-12 max-h-96 sm:max-h-[600px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
                    <TestimonialsColumn testimonials={firstColumn} duration={25} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={35} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={30} />
                </div>
            </div>
        </section>
    );
};
