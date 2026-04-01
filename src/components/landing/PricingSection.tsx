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
        <section id="pricing" className="py-12 sm:py-20 lg:py-32 bg-slate-50 relative z-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                <div className="text-center mb-8 sm:mb-12 lg:mb-16 relative">
                    <ScrollReveal>
                        <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                            Simple, transparent pricing
                        </h2>
                        <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                            No hidden fees. No tiers. Just value for your institution.
                        </p>
                    </ScrollReveal>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-96 sm:h-96 lg:w-[400px] lg:h-[400px] bg-blue-100/30 rounded-full blur-2xl sm:blur-[80px] lg:blur-[100px] -z-10" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto items-center">
                    {displayPlans.map((plan, idx) => {
                        if (!plan) return <div key={idx} className="hidden md:block" />;
                        const isCenter = idx === 1 || (plans.length === 1 && plan.is_popular);

                        return (
                            <ScrollReveal key={plan.id} delay={0.1 * (idx + 1)} className={isCenter ? "relative z-20" : ""}>
                                {isCenter && <div className="absolute inset-0 bg-blue-500 rounded-3xl blur-xl opacity-20" />}
                                <div className={`bg-slate-50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 transition-all duration-500 cursor-pointer
                                    ${!isMobile ? 'hover:scale-105 active:scale-95' : ''}
                                    ${isCenter ? 'shadow-[10px_10px_20px_#cbd5e1,-10px_-10px_20px_#ffffff] border-2 border-blue-500 relative z-10 transform lg:-translate-y-4' : 'shadow-sm'}`}
                                    onClick={handlePlanClick}>

                                    {plan.is_popular && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[9px] sm:text-xs font-bold uppercase tracking-widest py-0.5 sm:py-1 px-3 sm:px-4 rounded-full">
                                            Most Popular
                                        </div>
                                    )}

                                    <h3 className="text-base sm:text-xl font-bold text-slate-800 mb-1 sm:mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                                        <span className="text-2xl sm:text-4xl font-black text-slate-900">{'\u20B9'}{plan.price.toLocaleString()}</span>
                                        <span className="text-xs sm:text-base text-slate-500">/ {plan.billing_cycle === 'annual' ? 'yr' : 'mo'}</span>
                                    </div>
                                    <p className="text-xs sm:text-base text-slate-600 mb-5 sm:mb-8 font-medium line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">{plan.description}</p>

                                    <ul className="space-y-2.5 sm:space-y-4 mb-6 sm:mb-8 max-h-40 sm:max-h-48 overflow-hidden">
                                        {(Array.isArray(plan.features) ? plan.features : []).slice(0, 5).map((feature: string, fIdx: number) => (
                                            <PricingFeature key={fIdx} text={feature} />
                                        ))}
                                        {plan.max_students && <PricingFeature text={`Up to ${plan.max_students.toLocaleString()} Students`} />}
                                    </ul>
                                    <PrimaryButton variant={isCenter ? "primary" : "flat"} className="w-full">
                                        {plan.trial_days > 0 ? `Start ${plan.trial_days}-Day Trial` : 'Get Started'}
                                    </PrimaryButton>
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
