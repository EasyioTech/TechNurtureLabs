'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ScrollReveal } from './ScrollReveal';
import { PrimaryButton } from './PrimaryButton';
import { Check, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import { getPublicPricingPlans } from '@/components/landing/actions';
import { useRouter } from 'next/navigation';

export const PricingSection = () => {
    const isMobile = useIsMobile();
    const [plans, setPlans] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        getPublicPricingPlans().then(data => {
            setPlans(data);
            setLoading(false);
        });
    }, []);

    const handlePlanClick = () => {
        router.push('/school-portal/register');
    };

    if (loading) {
        return (
            <div className="py-20 sm:py-32 flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Logic to arrange plans: Popular in middle (index 1), others on sides.
    const popularPlan = plans.find(p => p.is_popular);
    const otherPlans = plans.filter(p => !p.is_popular);

    let displayPlans: any[] = [];
    if (popularPlan) {
        displayPlans = [
            otherPlans[0] || null,
            popularPlan,
            otherPlans[1] || null
        ];
    } else {
        displayPlans = [
            plans[0] || null,
            plans[1] || null,
            plans[2] || null
        ];
    }

    return (
        <section id="pricing" className="relative z-10 py-24 lg:py-40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-subtle" />
                <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 backdrop-blur-sm hover:border-blue-400/50 transition-all mb-6">
                        <Zap size={16} className="text-cyan-400" />
                        <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Pricing Plans</span>
                    </div>
                    <h2 className="text-4xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                        Invest in <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Growth</span>
                    </h2>
                    <p className="text-lg lg:text-2xl text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed">
                        Transparent, student-centric pricing designed to scale with your institution's digital ambitions.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {displayPlans.map((plan, idx) => {
                        if (!plan) return null;
                        const isPopular = plan.is_popular;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: idx * 0.1 }}
                                className={`relative group h-full transition-all duration-700 cursor-pointer
                                    ${isPopular ? 'lg:-translate-y-6' : 'lg:translate-y-2'}`}
                                onClick={handlePlanClick}
                            >
                                {/* Popular Glow Effect */}
                                {isPopular && (
                                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-[2.5rem] blur opacity-30 group-hover:opacity-50 transition duration-1000" />
                                )}

                                <div className={`relative h-full flex flex-col rounded-[2.5rem] p-10 border backdrop-blur-sm transition-all duration-500
                                    ${isPopular
                                        ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-cyan-400/40 shadow-2xl shadow-cyan-500/10 group-hover:border-cyan-400/60 group-hover:shadow-cyan-500/20'
                                        : 'bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 shadow-lg hover:shadow-lg hover:border-slate-700/70'
                                    }`}
                                >

                                    {isPopular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] py-2 px-6 rounded-full shadow-lg shadow-cyan-500/40">
                                            ⭐ RECOMMENDED
                                        </div>
                                    )}

                                    <div className="mb-10">
                                        <h3 className={`text-xs font-bold uppercase tracking-[0.3em] mb-4 ${isPopular ? 'text-cyan-400' : 'text-slate-400'}`}>
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-bold text-white tracking-tighter">
                                                ₹{plan.price.toLocaleString()}
                                            </span>
                                            <span className="text-slate-400 font-bold text-sm">
                                                / {plan.billing_cycle === 'annual' ? 'YEAR' : 'MONTH'}
                                            </span>
                                        </div>
                                        <p className="mt-4 text-slate-300 font-medium text-sm leading-relaxed min-h-[3rem]">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="flex-1 space-y-6 mb-10">
                                        <div className="h-px bg-slate-700/50 w-full" />
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Features</p>
                                            <ul className="space-y-4">
                                                {(Array.isArray(plan.features) ? plan.features : []).map((feature: string, fIdx: number) => (
                                                    <li key={fIdx} className="flex items-start gap-4">
                                                        <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPopular ? 'bg-cyan-500/30 border border-cyan-400/60 text-cyan-400' : 'bg-slate-700/50 border border-slate-600/50 text-slate-400'}`}>
                                                            <Check size={12} strokeWidth={3} />
                                                        </div>
                                                        <span className="text-slate-300 font-medium text-sm tracking-tight">{feature}</span>
                                                    </li>
                                                ))}
                                                {plan.max_students ? (
                                                    <li className="flex items-start gap-4 pt-2">
                                                        <div className="w-full py-3 px-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex justify-between items-center">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Capacity</span>
                                                            <span className="text-sm font-bold text-white tracking-tight">{plan.max_students.toLocaleString()} Students</span>
                                                        </div>
                                                    </li>
                                                ) : (
                                                    <li className="flex items-start gap-4 pt-2">
                                                        <div className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-400/30 flex justify-between items-center font-mono">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Unlimited Seatings</span>
                                                            <div className="flex gap-0.5">
                                                                {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />)}
                                                            </div>
                                                        </div>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>

                                    <PrimaryButton
                                        variant={isPopular ? "primary" : "flat"}
                                        className={`w-full h-16 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl transition-all duration-300
                                            ${isPopular ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:scale-[1.02] shadow-cyan-500/30 text-white' : 'bg-slate-700/50 border border-slate-600/50 text-white hover:bg-slate-700/70 hover:border-slate-600/70'}`}
                                    >
                                        {plan.trial_days > 0 ? `START ${plan.trial_days}-DAY TRIAL` : 'INITIALIZE PROJECT'}
                                    </PrimaryButton>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

function PricingFeature({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-2 sm:gap-3">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Check size={10} className="sm:block hidden text-blue-600" />
                <Check size={8} className="sm:hidden text-blue-600" />
            </div>
            <span className="text-slate-600 font-medium text-xs sm:text-sm">{text}</span>
        </li>
    );
}
