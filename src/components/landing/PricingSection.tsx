'use client';

import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { PrimaryButton } from './PrimaryButton';
import { Check } from 'lucide-react';
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
        <section id="pricing" className="py-24 lg:py-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-slate-100 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[150px] pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <ScrollReveal>
                        <h2 className="text-4xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                            Invest in <span className="text-blue-600">Growth</span>
                        </h2>
                        <p className="text-lg lg:text-2xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
                            Transparent, student-centric pricing designed to scale with your institution's digital ambitions.
                        </p>
                    </ScrollReveal>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {displayPlans.map((plan, idx) => {
                        if (!plan) return null;
                        const isPopular = plan.is_popular;
                        
                        return (
                            <ScrollReveal key={plan.id} delay={idx * 0.1}>
                                <div 
                                    className={`relative group h-full transition-all duration-700
                                        ${isPopular ? 'lg:-translate-y-6' : 'lg:translate-y-2'}`}
                                    onClick={handlePlanClick}
                                >
                                    {/* Popular Glow Effect */}
                                    {isPopular && (
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000" />
                                    )}
                                    
                                    <div className={`relative h-full flex flex-col bg-white rounded-[2.5rem] p-10 border shadow-2xl shadow-slate-200/50 transition-all duration-500
                                        ${isPopular ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-slate-100'}`}>
                                        
                                        {isPopular && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 px-6 rounded-full shadow-lg shadow-blue-500/40">
                                                RECOMMENDED
                                            </div>
                                        )}

                                        <div className="mb-10">
                                            <h3 className={`text-xs font-black uppercase tracking-[0.3em] mb-4 ${isPopular ? 'text-blue-600' : 'text-slate-400'}`}>
                                                {plan.name}
                                            </h3>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                                                    ₹{plan.price.toLocaleString()}
                                                </span>
                                                <span className="text-slate-400 font-bold text-sm">
                                                    / {plan.billing_cycle === 'annual' ? 'YEAR' : 'MONTH'}
                                                </span>
                                            </div>
                                            <p className="mt-4 text-slate-500 font-medium text-sm leading-relaxed min-h-[3rem]">
                                                {plan.description}
                                            </p>
                                        </div>

                                        <div className="flex-1 space-y-6 mb-10">
                                            <div className="h-px bg-slate-100 w-full" />
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Features</p>
                                                <ul className="space-y-4">
                                                    {(Array.isArray(plan.features) ? plan.features : []).map((feature: string, fIdx: number) => (
                                                        <li key={fIdx} className="flex items-start gap-4">
                                                            <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPopular ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                                <Check size={12} strokeWidth={3} />
                                                            </div>
                                                            <span className="text-slate-700 font-bold text-sm tracking-tight">{feature}</span>
                                                        </li>
                                                    ))}
                                                    {plan.max_students ? (
                                                        <li className="flex items-start gap-4 pt-2">
                                                            <div className="w-full py-3 px-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capacity</span>
                                                                <span className="text-sm font-black text-slate-900 tracking-tight">{plan.max_students.toLocaleString()} Students</span>
                                                            </div>
                                                        </li>
                                                    ) : (
                                                        <li className="flex items-start gap-4 pt-2">
                                                            <div className="w-full py-3 px-4 bg-blue-50 rounded-2xl border border-blue-100 flex justify-between items-center font-mono">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Unlimited Seatings</span>
                                                                <div className="flex gap-0.5">
                                                                    {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{animationDelay: `${i*200}ms`}} />)}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>

                                        <PrimaryButton 
                                            variant={isPopular ? "primary" : "flat"} 
                                            className={`w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all duration-300
                                                ${isPopular ? 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] shadow-blue-500/30' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                        >
                                            {plan.trial_days > 0 ? `START ${plan.trial_days}-DAY TRIAL` : 'INITIALIZE PROJECT'}
                                        </PrimaryButton>
                                    </div>
                                </div>
                            </ScrollReveal>
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
