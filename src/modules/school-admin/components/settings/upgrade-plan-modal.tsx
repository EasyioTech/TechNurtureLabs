'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Check, ChevronRight, Loader2, Sparkles, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolTheme, ts } from '../../theme-context';
import { toast } from 'sonner';
import { getAvailablePlans } from '../../actions';

interface UpgradePlanModalProps {
    schoolId: string;
    currentPlanName: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function UpgradePlanModal({ schoolId, currentPlanName, isOpen, onClose }: UpgradePlanModalProps) {
    const { isDark } = useSchoolTheme();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPlans();
        }
    }, [isOpen]);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const data = await getAvailablePlans();
            setPlans(data);

            // Auto-select next best plan or current one
            const currentIdx = data.findIndex(p => p.name.toLowerCase() === (currentPlanName?.toLowerCase() || ''));
            if (currentIdx < data.length - 1) {
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
            // Integration with payment gateway would happen here
            // For now, we simulate success
            await new Promise(r => setTimeout(r, 2000));
            toast.success('Wait! Redirecting to secure checkout...');
            // In a real app: router.push(`/checkout/${selectedPlan}`)
            toast.info('Payment gateway integration placeholder');
        } catch (err) {
            toast.error('Could not initiate upgrade');
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-[#0c0f1a]/90 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`relative w-full max-w-4xl rounded-[40px] border shadow-2xl transition-all duration-500 my-auto ${ts.card(isDark)}`}
                >
                    <div className="absolute top-8 left-8 flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center shadow-lg ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-600 text-white'}`}>
                            <Zap size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className={`text-2xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Scale Your Institution</h3>
                            <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>Unlock powerful academic management tools</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className={`absolute top-8 right-8 p-3 rounded-2xl transition-all hover:scale-110 active:scale-95 ${isDark ? 'bg-white/5 border border-white/10 text-slate-400' : 'bg-slate-100/50 text-slate-500'}`}
                    >
                        <X size={20} />
                    </button>

                    <div className="pt-28 p-8 pb-10">
                        {loading ? (
                            <div className="py-24 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                <p className={`text-sm font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Fetching latest pricing...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {plans.map((plan) => {
                                    const isCurrent = plan.name.toLowerCase() === (currentPlanName?.toLowerCase() || '');
                                    const isSelected = selectedPlan === plan.id;
                                    const features = (plan.features || []) as string[];

                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                                            className={`relative flex flex-col p-8 rounded-[32px] border transition-all duration-500 cursor-pointer overflow-hidden ${isCurrent ? 'opacity-60 border-transparent bg-slate-500/5' :
                                                isSelected ? `border-indigo-500 ring-4 ring-indigo-500/10 ${isDark ? 'bg-indigo-500/5 shadow-2xl shadow-indigo-500/20' : 'bg-white shadow-xl shadow-indigo-500/10'}` :
                                                    `${isDark ? 'border-white/5 bg-white/5 hover:border-white/20' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`
                                                }`}
                                        >
                                            {plan.is_popular && !isCurrent && (
                                                <div className="absolute -right-12 top-6 rotate-45 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-[0.2em] py-1.5 px-14 shadow-lg">
                                                    Popular
                                                </div>
                                            )}

                                            <div className="mb-6">
                                                <h4 className={`text-lg font-black mb-1 ${ts.textPrimary(isDark)}`}>{plan.name}</h4>
                                                <p className={`text-[11px] font-bold uppercase tracking-wider ${ts.textMuted(isDark)}`}>
                                                    {plan.max_students ? `Up to ${plan.max_students} Students` : 'Unlimited Students'}
                                                </p>
                                            </div>

                                            <div className="mb-8">
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-3xl font-black ${ts.textPrimary(isDark)}`}>₹{Math.floor(Number(plan.price) || 0)}</span>
                                                    <span className={`text-sm font-bold ${ts.textMuted(isDark)}`}>/yr</span>
                                                </div>
                                                <p className={`text-[11px] font-medium leading-relaxed mt-2 ${ts.textSecondary(isDark)}`}>{plan.description}</p>
                                            </div>

                                            <div className="flex-1 space-y-4 mb-8">
                                                {(Array.isArray(features) ? features : []).map((feature: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-2.5">
                                                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                            <Check size={10} strokeWidth={4} />
                                                        </div>
                                                        <span className={`text-[12px] font-bold ${ts.textSecondary(isDark)}`}>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-auto">
                                                {isCurrent ? (
                                                    <Button disabled className="w-full rounded-2xl h-11 font-black text-[11px] uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-none">
                                                        Current Plan
                                                    </Button>
                                                ) : (
                                                    <div className={`w-6 h-6 rounded-full mx-auto border-2 flex items-center justify-center transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>
                                                        {isSelected && <Check size={14} strokeWidth={4} />}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className={`p-8 pt-0 flex flex-col sm:flex-row items-center justify-between gap-6`}>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-full border border-dashed border-indigo-500/30 flex items-center justify-center text-indigo-500 animate-[spin_10s_linear_infinite]">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <p className={`text-sm font-black ${ts.textPrimary(isDark)}`}>100% Tax Deductible</p>
                                <p className={`text-[11px] font-bold ${ts.textMuted(isDark)}`}>Institutional plans include GST invoice support.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className={`flex-1 sm:flex-none rounded-2xl h-14 px-10 font-black text-[13px] ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={!selectedPlan || processing || loading}
                                onClick={handleUpgrade}
                                className={`flex-[2] sm:flex-none rounded-2xl h-14 px-10 font-black text-[13px] group ${ts.btnPrimary(isDark)} shadow-xl shadow-indigo-500/25`}
                            >
                                {processing ? <Loader2 className="animate-spin mr-2" /> : <Zap size={18} className="mr-2" fill="currentColor" />}
                                Complete Upgrade
                                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
