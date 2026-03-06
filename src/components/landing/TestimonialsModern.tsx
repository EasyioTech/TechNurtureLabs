'use client';

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./ScrollReveal";
import { GlassCardLight } from "./GlassCardLight";
import { useIsMobile } from "@/hooks/use-mobile";

const testimonials = [
    {
        text: "This ERP revolutionized our operations, streamlining finance and inventory. The cloud-based platform keeps us productive, even remotely.",
        image: "https://randomuser.me/api/portraits/women/1.jpg",
        name: "Briana Patton",
        role: "Operations Manager",
    },
    {
        text: "Implementing this ERP was smooth and quick. The customizable, user-friendly interface made team training effortless.",
        image: "https://randomuser.me/api/portraits/men/2.jpg",
        name: "Bilal Ahmed",
        role: "IT Manager",
    },
    {
        text: "The support team is exceptional, guiding us through setup and providing ongoing assistance, ensuring our satisfaction.",
        image: "https://randomuser.me/api/portraits/women/3.jpg",
        name: "Saman Malik",
        role: "Customer Support Lead",
    },
    {
        text: "This ERP's seamless integration enhanced our business operations and efficiency. Highly recommend for its intuitive interface.",
        image: "https://randomuser.me/api/portraits/men/4.jpg",
        name: "Omar Raza",
        role: "CEO",
    },
    {
        text: "Its robust features and quick support have transformed our workflow, making us significantly more efficient.",
        image: "https://randomuser.me/api/portraits/women/5.jpg",
        name: "Zainab Hussain",
        role: "Project Manager",
    },
    {
        text: "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance.",
        image: "https://randomuser.me/api/portraits/women/6.jpg",
        name: "Aliza Khan",
        role: "Business Analyst",
    },
    {
        text: "Our business functions improved with a user-friendly design and positive customer feedback.",
        image: "https://randomuser.me/api/portraits/men/7.jpg",
        name: "Farhan Siddiqui",
        role: "Marketing Director",
    },
    {
        text: "They delivered a solution that exceeded expectations, understanding our needs and enhancing our operations.",
        image: "https://randomuser.me/api/portraits/women/8.jpg",
        name: "Sana Sheikh",
        role: "Sales Manager",
    },
    {
        text: "Using this ERP, our online presence and conversions significantly improved, boosting business performance.",
        image: "https://randomuser.me/api/portraits/men/9.jpg",
        name: "Hassan Ali",
        role: "E-commerce Manager",
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
                className="flex flex-col gap-4 pb-4"
            >
                {[...new Array(2)].map((_, index) => (
                    <React.Fragment key={index}>
                        {props.testimonials.map(({ text, image, name, role }, i) => (
                            <GlassCardLight
                                key={i}
                                className="!p-6 w-full max-w-[320px] bg-white border-slate-100"
                            >
                                <StarRating />
                                <div className="text-slate-600 text-sm leading-relaxed font-medium">
                                    "{text}"
                                </div>
                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                                    <img
                                        width={32}
                                        height={32}
                                        src={image}
                                        alt={name}
                                        className="h-8 w-8 rounded-full border border-slate-100"
                                    />
                                    <div className="flex flex-col text-left">
                                        <div className="font-bold text-slate-900 tracking-tight text-xs">{name}</div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{role}</div>
                                    </div>
                                </div>
                            </GlassCardLight>
                        ))}
                    </React.Fragment>
                ))}
            </motion.div>
        </div>
    );
};

export const TestimonialsModern = () => {
    return (
        <section id="testimonials" className="relative py-24 bg-white overflow-hidden border-t border-slate-50">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <ScrollReveal>
                        <span className="px-4 py-1.5 rounded-full bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-[0.2em] border border-slate-100 mb-6 inline-block">
                            Testimonials
                        </span>
                    </ScrollReveal>
                    <ScrollReveal delay={0.1}>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            What our users say about us.
                        </h2>
                    </ScrollReveal>
                </div>

                <div className="relative flex justify-center gap-6 mt-12 max-h-[600px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
                    <TestimonialsColumn testimonials={firstColumn} duration={25} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={35} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={30} />
                </div>
            </div>
        </section>
    );
};
