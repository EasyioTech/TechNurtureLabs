'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog, AlertDialogContent,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Check, Users, Sparkles, AlertOctagon } from 'lucide-react';
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
    const { isDark, accent } = useAdminTheme();
    const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentPlans.map((plan, index) => {
                    const isFeatured = plan.is_popular;
                    return (
                        <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                            <div className={`relative rounded-[28px] border overflow-hidden hover:-translate-y-1 transition-all duration-500 shadow-xl shadow-black/5
                                ${isFeatured
                                    ? isDark ? `bg-[#1a1f2e] border-${accent.name}-400/30 ring-4 ring-${accent.name}-400/5` : `bg-white border-${accent.name}-400/10 ring-8 ring-${accent.name}-400/[0.02]`
                                    : t.card(isDark)}`}>

                                {isFeatured && (
                                    <div className="absolute top-4 right-4">
                                        <Badge className={`text-[10px] font-black px-3 py-1 rounded-full ${accent.bg} text-slate-900`}
                                            style={isDark ? { boxShadow: `0 0 15px ${accent.swatchDark}66` } : { boxShadow: `0 0 15px ${accent.swatchLight}33` }}>
                                            <Sparkles size={10} className="mr-1.5" />PREMIUM
                                        </Badge>
                                    </div>
                                )}

                                <div className="p-7 space-y-6">
                                    <div>
                                        <p className={`text-[10px] font-black tracking-[0.2em] uppercase mb-1 ${t.textMuted(isDark)}`}>Plan Details</p>
                                        <h3 className={`text-xl font-black tracking-tight ${t.textPrimary(isDark)}`}>{plan.name}</h3>
                                        <Badge className={`mt-2 text-[9px] font-black px-2 py-0.5 rounded-md ${plan.is_active ? t.live(isDark) : (isDark ? 'bg-white/[0.04] text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
                                            {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-4xl font-[1000] tracking-tighter ${t.textPrimary(isDark)}`}>{'\u20B9'}{plan.price.toLocaleString()}</span>
                                        <span className={`text-[12px] font-black uppercase tracking-widest ml-1 ${t.textMuted(isDark)}`}>/ {plan.billing_cycle}</span>
                                    </div>

                                    <p className={`text-[13px] font-medium leading-relaxed ${t.textSecondary(isDark)}`}>{plan.description}</p>

                                    {plan.trial_days > 0 && (
                                        <div className={`text-[11px] font-black rounded-full px-4 py-2 flex items-center gap-2 border ${isDark ? `${accent.softDark}` : `${accent.bg} text-slate-900`}`}>
                                            <Badge className="bg-white/20 text-white border-white/20 text-[9px] font-black">{plan.trial_days} DAYS</Badge>
                                            <span className="uppercase tracking-tight">Free Trial Period</span>
                                        </div>
                                    )}

                                    <div className="space-y-3.5">
                                        <p className={`text-[10px] font-black tracking-widest uppercase mb-4 ${t.textMuted(isDark)}`}>Features & Benefits</p>
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/[0.05]' : 'bg-slate-100'} border ${t.border(isDark)}`}>
                                                    <Check size={10} className={isDark ? accent.text : accent.softLight.split(' ')[1]} />
                                                </div>
                                                <span className={`text-[13px] font-medium ${t.textSecondary(isDark)}`}>{feature}</span>
                                            </div>
                                        ))}
                                        {plan.max_students && (
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? accent.softDark.split(' ')[0] : accent.softLight.split(' ')[0]}`}>
                                                    <Users size={10} className={isDark ? accent.text : `text-${accent.name}-600`} />
                                                </div>
                                                <span className={`text-[13px] font-bold ${t.textSecondary(isDark)}`}>Up to {plan.max_students.toLocaleString()} students</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`flex gap-3 pt-6 border-t ${t.border(isDark)}`}>
                                        <Button variant="outline" className={`flex-1 rounded-full text-[11px] h-9 font-black border-2 transition-all ${t.btnOutline(isDark)}`}
                                            onClick={() => { setEditingPlan(plan); setShowPlanDialog(true); }}>
                                            <Edit size={14} className="mr-2" />Edit Plan
                                        </Button>
                                        <Button variant="ghost" size="icon" className={`w-9 h-9 rounded-full transition-colors ${isDark ? 'text-slate-600 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-300 hover:text-rose-600 hover:bg-rose-100'}`}
                                            onClick={() => setPlanToDelete({ id: plan.id, name: plan.name })}>
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

            {/* Delete Confirmation */}
            <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
                <AlertDialogContent className={`w-[90vw] max-w-[420px] rounded-[24px] border-0 shadow-2xl p-0 overflow-hidden ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>
                    <div className="p-8 pb-6 flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${isDark ? 'bg-rose-500/10 text-rose-500 shadow-rose-500/10' : 'bg-rose-50 text-rose-500'}`}>
                            <AlertOctagon size={32} />
                        </div>
                        <h2 className={`text-xl font-[1000] tracking-tight mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Delete Plan?</h2>
                        <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Are you sure you want to delete the plan <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>"{planToDelete?.name}"</span>?
                            <br /><br />
                            Schools with active subscriptions on this plan will be blocked from deletion.
                        </p>
                    </div>
                    <div className={`px-8 py-5 flex items-center gap-3 border-t ${isDark ? 'border-white/10 bg-[#0f1219]' : 'border-slate-100 bg-slate-50'}`}>
                        <Button variant="ghost" onClick={() => setPlanToDelete(null)}
                            className={`flex-1 rounded-full h-11 font-bold text-sm ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-700 bg-slate-100'}`}>
                            Cancel
                        </Button>
                        <Button onClick={() => { if (planToDelete) { onDeletePlan(planToDelete.id); setPlanToDelete(null); } }}
                            className="flex-1 rounded-full h-11 font-black text-sm bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-xl shadow-rose-500/20">
                            Delete Plan
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
