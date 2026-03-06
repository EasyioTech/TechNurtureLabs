'use client';

import React from 'react';
import { ScrollReveal } from './ScrollReveal';
import { NeumorphicButton } from './NeumorphicButton';
import { Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import { getPublicPricingPlans } from '@/modules/landing/actions';
import { useRouter } from 'next/navigation';

export const PricingHybrid = () => {
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
            <div className="py-32 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        <section id="pricing" className="py-32 bg-slate-50 relative z-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-16 relative">
                    <ScrollReveal>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                            Simple, transparent pricing
                        </h2>
                        <p className="mt-4 text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                            No hidden fees. No complicated tiers. Just value for your institution.
                        </p>
                    </ScrollReveal>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[100px] -z-10" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                    {displayPlans.map((plan, idx) => {
                        if (!plan) return <div key={idx} className="hidden md:block" />;
                        const isCenter = idx === 1 || (plans.length === 1 && plan.is_popular);

                        return (
                            <ScrollReveal key={plan.id} delay={0.1 * (idx + 1)} className={isCenter ? "relative z-20" : ""}>
                                {isCenter && <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-xl opacity-20" />}
                                <div className={`bg-slate-50 rounded-3xl p-8 border border-slate-200 transition-all duration-500 cursor-pointer 
                                    ${!isMobile ? 'hover:scale-105 active:scale-95' : ''}
                                    ${isCenter ? 'shadow-[10px_10px_20px_#cbd5e1,-10px_-10px_20px_#ffffff] border-2 border-blue-500 relative z-10 transform md:-translate-y-4' : 'shadow-sm'}`}
                                    onClick={handlePlanClick}>

                                    {plan.is_popular && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest py-1 px-4 rounded-full">
                                            Most Popular
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-4xl font-black text-slate-900">{'\u20B9'}{plan.price.toLocaleString()}</span>
                                        <span className="text-slate-500">/ {plan.billing_cycle === 'annual' ? 'yr' : 'mo'}</span>
                                    </div>
                                    <p className="text-slate-600 mb-8 font-medium line-clamp-2 min-h-[3rem]">{plan.description}</p>

                                    <ul className="space-y-4 mb-8 h-48 overflow-hidden">
                                        {(Array.isArray(plan.features) ? plan.features : []).slice(0, 5).map((feature: string, fIdx: number) => (
                                            <PricingFeature key={fIdx} text={feature} />
                                        ))}
                                        {plan.max_students && <PricingFeature text={`Up to ${plan.max_students.toLocaleString()} Students`} />}
                                    </ul>
                                    <NeumorphicButton variant={isCenter ? "primary" : "flat"} className="w-full">
                                        {plan.trial_days > 0 ? `Start ${plan.trial_days}-Day Trial` : 'Get Started'}
                                    </NeumorphicButton>
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
        <li className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Check size={12} className="text-blue-600" />
            </div>
            <span className="text-slate-600 font-medium text-sm">{text}</span>
        </li>
    );
}
