'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Check, Users, Sparkles } from 'lucide-react';
import { PaymentPlanDialog } from '../plan-dialog';
import { PaymentPlan } from '../../types';
import { useAdminTheme, t } from '../../theme-context';

interface PaymentPlansTabProps {
    paymentPlans: PaymentPlan[];
    onSavePlan: () => void;
    onDeletePlan: (id: string) => void;
    showPlanDialog: boolean;
    setShowPlanDialog: (v: boolean) => void;
    editingPlan: Partial<PaymentPlan> | null;
    setEditingPlan: (p: Partial<PaymentPlan> | null) => void;
}

export function PaymentPlansTab({
    paymentPlans, onSavePlan, onDeletePlan,
    showPlanDialog, setShowPlanDialog, editingPlan, setEditingPlan,
}: PaymentPlansTabProps) {
    const { isDark } = useAdminTheme();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentPlans.map((plan, index) => {
                    const isFeatured = index === 1;
                    return (
                        <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                            <div className={`relative rounded-[28px] border overflow-hidden hover:-translate-y-1 transition-all duration-500 shadow-xl shadow-black/5
                                ${isFeatured
                                    ? isDark ? 'bg-[#1a1f2e] border-lime-400/30 ring-4 ring-lime-400/5' : 'bg-white border-slate-900/10 ring-8 ring-slate-900/[0.02]'
                                    : t.card(isDark)}`}>

                                {isFeatured && (
                                    <div className="absolute top-4 right-4">
                                        <Badge className={`text-[10px] font-black px-3 py-1 rounded-full ${isDark ? 'bg-lime-400 text-slate-900 shadow-[0_0_15px_rgba(163,230,53,0.4)]' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'}`}>
                                            <Sparkles size={10} className="mr-1.5" />PREMIUM
                                        </Badge>
                                    </div>
                                )}

                                <div className="p-7 space-y-6">
                                    <div>
                                        <p className={`text-[10px] font-black tracking-[0.2em] uppercase mb-1 ${t.textMuted(isDark)}`}>Subscription Plan</p>
                                        <h3 className={`text-xl font-black tracking-tight ${t.textPrimary(isDark)}`}>{plan.name}</h3>
                                        <Badge className={`mt-2 text-[9px] font-black px-2 py-0.5 rounded-md ${plan.is_active ? t.live(isDark) : (isDark ? 'bg-white/[0.04] text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
                                            {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-4xl font-[1000] tracking-tighter ${t.textPrimary(isDark)}`}>₹{plan.price.toLocaleString()}</span>
                                        <span className={`text-[12px] font-black uppercase tracking-widest ml-1 ${t.textMuted(isDark)}`}>/ {plan.billing_cycle}</span>
                                    </div>

                                    <p className={`text-[13px] font-medium leading-relaxed ${t.textSecondary(isDark)}`}>{plan.description}</p>

                                    {plan.trial_days > 0 && (
                                        <div className={`text-[11px] font-black rounded-full px-4 py-2 flex items-center gap-2 border ${isDark ? 'bg-lime-400/10 border-lime-400/20 text-lime-400' : 'bg-slate-900 text-white'}`}>
                                            <Badge className="bg-white/20 text-white border-white/20 text-[9px] font-black">{plan.trial_days} DAYS</Badge>
                                            <span className="uppercase tracking-tight">Free Trial Period</span>
                                        </div>
                                    )}

                                    <div className="space-y-3.5">
                                        <p className={`text-[10px] font-black tracking-widest uppercase mb-4 ${t.textMuted(isDark)}`}>Included Infrastructure</p>
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/[0.05]' : 'bg-slate-100'} border ${t.border(isDark)}`}>
                                                    <Check size={10} className={isDark ? 'text-lime-400' : 'text-slate-900'} />
                                                </div>
                                                <span className={`text-[13px] font-medium ${t.textSecondary(isDark)}`}>{feature}</span>
                                            </div>
                                        ))}
                                        {plan.max_students && (
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-sky-400/10' : 'bg-emerald-50'}`}>
                                                    <Users size={10} className={isDark ? 'text-sky-400' : 'text-emerald-600'} />
                                                </div>
                                                <span className={`text-[13px] font-bold ${t.textSecondary(isDark)}`}>Up to {plan.max_students.toLocaleString()} students</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`flex gap-3 pt-6 border-t ${t.border(isDark)}`}>
                                        <Button variant="outline" className={`flex-1 rounded-full text-[11px] h-9 font-black border-2 transition-all ${t.btnOutline(isDark)}`}
                                            onClick={() => { setEditingPlan(plan); setShowPlanDialog(true); }}>
                                            <Edit size={14} className="mr-2" />EDIT PLAN
                                        </Button>
                                        <Button variant="ghost" size="icon" className={`w-9 h-9 rounded-full transition-colors ${isDark ? 'text-slate-600 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-300 hover:text-rose-600 hover:bg-rose-100'}`}
                                            onClick={() => onDeletePlan(plan.id)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <PaymentPlanDialog open={showPlanDialog} onOpenChange={setShowPlanDialog} editingPlan={editingPlan} setEditingPlan={setEditingPlan} onSave={onSavePlan} />
        </div>
    );
}
