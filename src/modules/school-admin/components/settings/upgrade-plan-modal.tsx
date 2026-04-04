'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Check, ChevronRight, Loader2, Sparkles, Building2, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolTheme, ts } from '../../theme-context';
import { toast } from 'sonner';
import { getAvailablePlans } from '../../actions';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface UpgradePlanModalProps {
    schoolId: string;
    currentPlanName: string | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export function UpgradePlanModal({ schoolId, currentPlanName, isOpen, onClose, onUpdate }: UpgradePlanModalProps) {
    const { isDark } = useSchoolTheme();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPlans();
            loadRazorpayScript();
        }
    }, [isOpen]);

    const loadRazorpayScript = () => {
        if (window.Razorpay) return;
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    };

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const data = await getAvailablePlans();
            setPlans(data);

            // Auto-select next best plan or current one
            const currentIdx = data.findIndex(p => p.name.toLowerCase() === (currentPlanName?.toLowerCase() || ''));
            if (currentIdx !== -1 && currentIdx < data.length - 1) {
                setSelectedPlan(data[currentIdx + 1].id);
            } else if (data.length > 0) {
                setSelectedPlan(data[data.length - 1].id);
            }
        } catch (err) {
            toast.error('Failed to load available plans');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        if (!selectedPlan) return;
        setProcessing(true);

        try {
            // 1. Create Order
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: selectedPlan }),
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

            // 2. Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Tech Nurture Labs',
                description: `Upgrade to ${orderData.plan.name} Plan`,
                order_id: orderData.order_id,
                handler: async (response: any) => {
                    try {
                        setProcessing(true);
                        const verifyRes = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...response,
                                school_id: schoolId,
                            }),
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            toast.success('Institution plan upgraded successfully!');
                            if (onUpdate) onUpdate();
                            onClose();
                        } else {
                            throw new Error(verifyData.error || 'Verification failed');
                        }
                    } catch (err: any) {
                        toast.error(err.message || 'Payment verification failed');
                    } finally {
                        setProcessing(false);
                    }
                },
                prefill: {
                    name: '', // Optional: Fill from admin profile
                    email: '',
                },
                theme: {
                    color: isDark ? '#6366f1' : '#4f46e5',
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error(response.error.description || 'Payment failed');
                setProcessing(false);
            });
            rzp.open();
        } catch (err: any) {
            toast.error(err.message || 'Could not initiate upgrade');
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    const selectedPlanData = plans.find(p => p.id === selectedPlan);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-[#0c0f1a]/95 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="upgrade-title"
                    className={`relative w-full max-w-5xl rounded-[40px] border shadow-2xl transition-all duration-500 my-auto overflow-hidden ${ts.card(isDark)}`}
                >
                    {/* Processing Overlay */}
                    <AnimatePresence>
                        {processing && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[110] bg-white dark:bg-[#0c0f1a] flex flex-col items-center justify-center p-8 text-center"
                            >
                                <div className="space-y-8 max-w-md w-full">
                                    <div className="flex justify-center">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-[spin_1s_linear_infinite]" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <ShieldCheck size={40} className="text-indigo-500" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <img src="https://razorpay.com/favicon.png" className="w-5 h-5" alt="Razorpay" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Razorpay Network</span>
                                        </div>
                                        <h3 className={`text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>
                                            Synchronizing Transaction...
                                        </h3>
                                        <p className={`text-sm font-bold ${ts.textSecondary(isDark)}`}>
                                            Connecting to secure payment gateway. Please wait while we process your request.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="absolute top-8 left-8 flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center shadow-2xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-600 text-white'}`}>
                            <Zap size={28} fill="currentColor" />
                        </div>
                        <div id="upgrade-title">
                            <h3 className={`text-2xl font-black tracking-tighter ${ts.textPrimary(isDark)}`}>Upgrade Institution</h3>
                            <p className={`text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-0.5`}>Enterprise Solutions</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className={`absolute top-8 right-8 p-3 rounded-2xl transition-all hover:scale-110 active:scale-95 z-20 ${isDark ? 'bg-white/5 border border-white/10 text-slate-400' : 'bg-slate-100/50 text-slate-500'}`}
                    >
                        <X size={20} />
                    </button>

                    <div className="pt-32 p-10 pb-12">
                        {loading ? (
                            <div className="py-24 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                <p className={`text-sm font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Synchronizing Global Pricing...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                {plans.map((plan) => {
                                    const isCurrent = plan.name.toLowerCase() === (currentPlanName?.toLowerCase() || '');
                                    const isSelected = selectedPlan === plan.id;
                                    const features = (plan.features || []) as string[];

                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                                            className={`relative flex flex-col p-8 rounded-[36px] border transition-all duration-700 cursor-pointer overflow-hidden ${isCurrent ? 'opacity-60 border-transparent bg-slate-500/5' :
                                                isSelected ? `border-indigo-500 ring-4 ring-indigo-500/10 ${isDark ? 'bg-indigo-500/10 shadow-2xl shadow-indigo-500/20' : 'bg-white shadow-2xl shadow-indigo-500/10'}` :
                                                    `${isDark ? 'border-white/5 bg-[#1a1d26] hover:border-white/20' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`
                                                }`}
                                        >
                                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                                <Building2 size={120} />
                                            </div>

                                            {plan.is_popular && !isCurrent && (
                                                <div className="absolute -right-12 top-6 rotate-45 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-[0.2em] py-2 px-14 shadow-xl z-10">
                                                    Best Value
                                                </div>
                                            )}

                                            <div className="mb-8 relative z-10">
                                                <h4 className={`text-xl font-black mb-1 ${ts.textPrimary(isDark)}`}>{plan.name}</h4>
                                                <p className={`text-[10px] font-black uppercase tracking-[0.1em] ${ts.textMuted(isDark)}`}>
                                                    {plan.max_students ? `${plan.max_students} Dynamic Slots` : 'Scale Unlimited'}
                                                </p>
                                            </div>

                                            <div className="mb-10 relative z-10">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className={`text-4xl font-black tracking-tighter ${ts.textPrimary(isDark)}`}>₹{Math.floor(Number(plan.price) || 0)}</span>
                                                    <span className={`text-xs font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>per year</span>
                                                </div>
                                                <p className={`text-[12px] font-medium leading-relaxed mt-4 ${ts.textSecondary(isDark)}`}>{plan.description}</p>
                                            </div>

                                            <div className="flex-1 space-y-4 mb-10 relative z-10">
                                                {(Array.isArray(features) ? features : []).map((feature: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                            <Check size={12} strokeWidth={4} />
                                                        </div>
                                                        <span className={`text-[12px] font-black tracking-tight ${ts.textSecondary(isDark)}`}>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-auto relative z-10">
                                                {isCurrent ? (
                                                    <Button disabled className={`w-full rounded-2xl h-12 font-black text-[10px] uppercase tracking-widest ${ts.live(isDark)} shadow-none`}>
                                                        Active Membership
                                                    </Button>
                                                ) : isSelected ? (
                                                    <div className="flex items-center justify-center gap-2 py-3 bg-indigo-500 rounded-2xl text-white shadow-lg">
                                                        <Check size={16} strokeWidth={4} />
                                                        <span className="text-[11px] font-black uppercase tracking-widest">Selected Plan</span>
                                                    </div>
                                                ) : (
                                                    <div className={`py-3 rounded-2xl border-2 border-dashed flex items-center justify-center font-black text-[10px] uppercase tracking-widest transition-colors ${isDark ? 'border-white/10 text-slate-500 group-hover:border-indigo-500/40' : 'border-slate-200 text-slate-400'}`}>
                                                        Pick Plan
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className={`p-10 pt-0 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-transparent`}>
                        <div className="flex items-center gap-5 group">
                            <div className="w-14 h-14 rounded-2xl border border-dashed border-indigo-500/30 flex items-center justify-center text-indigo-500 animate-[spin_12s_linear_infinite] shrink-0">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <p className={`text-[15px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>Institutional GST Compliant</p>
                                <p className={`text-[11px] font-bold ${ts.textMuted(isDark)}`}>All pricing inclusive of 18% GST. Full tax support available.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                disabled={processing}
                                className={`flex-1 sm:flex-none rounded-2xl h-14 px-10 font-black text-[13px] ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
                            >
                                Not Now
                            </Button>
                            <Button
                                disabled={!selectedPlan || processing || loading}
                                onClick={handleUpgrade}
                                className={`flex-[2] sm:flex-none rounded-2xl h-14 px-12 font-black text-[14px] group ${ts.btnPrimary(isDark)} shadow-2xl shadow-indigo-500/30`}
                            >
                                {processing ? <Loader2 className="animate-spin mr-3" /> : <CreditCard size={20} className="mr-3" />}
                                Complete Payment
                                <ChevronRight className="ml-3 group-hover:translate-x-1 transition-transform" size={18} />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
