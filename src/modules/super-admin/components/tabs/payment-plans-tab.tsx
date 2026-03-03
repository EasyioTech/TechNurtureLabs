'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Check, Users, Shield, Gem, Crown, CreditCard } from 'lucide-react';
import { PaymentPlanDialog } from '../plan-dialog';
import { PaymentPlan } from '../../types';

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
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Payment Plans</h2>
                    <p className="text-slate-500">Manage subscription tiers for schools</p>
                </div>
                <Button
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                    onClick={() => {
                        setEditingPlan({ billing_cycle: 'monthly', features: [], is_active: true });
                        setShowPlanDialog(true);
                    }}
                >
                    <Plus size={16} className="mr-2" />Create Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentPlans.map((plan, index) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className={`bg-white border-stone-200 shadow-sm relative overflow-hidden hover:shadow-lg transition-shadow ${index === 1 ? 'ring-2 ring-sky-500' : ''}`}>
                            {index === 1 && (
                                <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs px-3 py-1 rounded-bl-lg font-semibold">POPULAR</div>
                            )}
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-stone-100' : index === 1 ? 'bg-sky-100' : 'bg-amber-100'}`}>
                                        {index === 0 ? <Shield className="text-stone-500" size={24} /> :
                                            index === 1 ? <Gem className="text-sky-600" size={24} /> :
                                                <Crown className="text-amber-600" size={24} />}
                                    </div>
                                    <div>
                                        <CardTitle className="text-slate-800">{plan.name}</CardTitle>
                                        <Badge className={plan.is_active ? 'bg-emerald-100 text-emerald-600 border-0' : 'bg-red-100 text-red-600 border-0'}>
                                            {plan.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <span className="text-4xl font-black text-slate-800">₹{plan.price}</span>
                                    <span className="text-slate-500">/{plan.billing_cycle}</span>
                                </div>
                                <p className="text-sm text-slate-500">{plan.description}</p>
                                <div className="space-y-2">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                            <Check size={16} className="text-emerald-500" />
                                            {feature}
                                        </div>
                                    ))}
                                    {plan.max_students && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Users size={16} className="text-sky-500" />
                                            Up to {plan.max_students} students
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" className="flex-1 border-stone-200 text-slate-600 hover:bg-stone-50"
                                        onClick={() => { setEditingPlan(plan); setShowPlanDialog(true); }}>
                                        <Edit size={14} className="mr-1" />Edit
                                    </Button>
                                    <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50"
                                        onClick={() => onDeletePlan(plan.id)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <PaymentPlanDialog
                open={showPlanDialog}
                onOpenChange={setShowPlanDialog}
                editingPlan={editingPlan}
                setEditingPlan={setEditingPlan}
                onSave={onSavePlan}
            />
        </div>
    );
}
