'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentPlan } from '../types';
import { Plus, X } from 'lucide-react';
import { useAdminTheme, t } from '../theme-context';

interface PlanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingPlan: Partial<PaymentPlan> | null;
    setEditingPlan: (plan: Partial<PaymentPlan> | null) => void;
    onSave: () => void;
}

export function PaymentPlanDialog({
    open,
    onOpenChange,
    editingPlan,
    setEditingPlan,
    onSave
}: PlanDialogProps) {
    const { isDark } = useAdminTheme();

    const addFeature = () => {
        const currentFeatures = editingPlan?.features || [];
        setEditingPlan({ ...editingPlan, features: [...currentFeatures, ''] });
    };

    const updateFeature = (index: number, value: string) => {
        const currentFeatures = [...(editingPlan?.features || [])];
        currentFeatures[index] = value;
        setEditingPlan({ ...editingPlan, features: currentFeatures });
    };

    const removeFeature = (index: number) => {
        const currentFeatures = editingPlan?.features?.filter((_, i) => i !== index) || [];
        setEditingPlan({ ...editingPlan, features: currentFeatures });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[600px] rounded-[24px] border overflow-y-auto max-h-[90vh] shadow-2xl p-6 ${t.card(isDark)}`}>
                <DialogHeader className="mb-4">
                    <DialogTitle className={`text-xl font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                        {editingPlan?.id ? 'EDIT PLAN DETAILS' : 'CREATE PAYMENT TIER'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Plan Name</Label>
                            <Input
                                placeholder="Starter, Pro, etc."
                                value={editingPlan?.name || ''}
                                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Price (INR)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={editingPlan?.price || 0}
                                onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                                className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Description</Label>
                        <Textarea
                            placeholder="Short summary of the plan..."
                            value={editingPlan?.description || ''}
                            onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                            className={`rounded-2xl min-h-[80px] p-4 font-medium border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 resize-none ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Billing Cycle</Label>
                            <Select
                                value={editingPlan?.billing_cycle || 'monthly'}
                                onValueChange={(val) => setEditingPlan({ ...editingPlan, billing_cycle: val as any })}
                            >
                                <SelectTrigger className={`rounded-full h-11 px-5 border-2 font-bold ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={isDark ? 'bg-[#1a1f2e] border-white/10 text-white' : 'bg-white'}>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                                    <SelectItem value="annual">Annual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Max Students</Label>
                            <Input
                                type="number"
                                placeholder="Unlimited"
                                value={editingPlan?.max_students || ''}
                                onChange={(e) => setEditingPlan({ ...editingPlan, max_students: Number(e.target.value) || null })}
                                className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Trial Days</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={editingPlan?.trial_days || 0}
                                onChange={(e) => setEditingPlan({ ...editingPlan, trial_days: Number(e.target.value) })}
                                className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        </div>
                    </div>

                    <div className={`space-y-4 pt-4 border-t ${t.border(isDark)}`}>
                        <div className="flex items-center justify-between">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textPrimary(isDark)}`}>Features</Label>
                            <Button size="sm" variant="outline" className={`h-8 px-4 rounded-full text-xs font-bold border-2 ${t.btnOutline(isDark)}`} onClick={addFeature}>
                                <Plus size={14} className="mr-1.5" />Add Feature
                            </Button>
                        </div>
                        <div className="space-y-2.5">
                            {editingPlan?.features?.map((feature, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={feature}
                                        onChange={(e) => updateFeature(idx, e.target.value)}
                                        placeholder={`Feature ${idx + 1}`}
                                        className={`rounded-full px-5 h-10 text-sm font-medium border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                    <Button variant="ghost" size="icon" className={`h-10 w-10 shrink-0 rounded-full transition-colors ${isDark ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-100'}`} onClick={() => removeFeature(idx)}>
                                        <X size={16} />
                                    </Button>
                                </div>
                            ))}
                            {(!editingPlan?.features || editingPlan.features.length === 0) && (
                                <p className={`text-xs italic ${t.textMuted(isDark)}`}>No features added yet.</p>
                            )}
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-colors ${(editingPlan?.is_active ?? true) ? (isDark ? 'border-lime-400/30 bg-lime-400/5' : 'border-slate-300 bg-emerald-50') : t.border(isDark)}`}>
                        <div className="space-y-1">
                            <Label className={`text-sm font-black ${((editingPlan?.is_active ?? true) && isDark) ? 'text-lime-400' : t.textPrimary(isDark)}`}>DEPLOYMENT STATUS</Label>
                            <p className={`text-[11px] font-bold ${t.textMuted(isDark)}`}>Active plans are visible for schools to purchase</p>
                        </div>
                        <Switch
                            checked={editingPlan?.is_active ?? true}
                            onCheckedChange={(val) => setEditingPlan({ ...editingPlan, is_active: val })}
                            className="data-[state=checked]:bg-lime-400"
                        />
                    </div>
                </div>
                <DialogFooter className={`pt-6 border-t mt-6 ${t.border(isDark)}`}>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}
                        className={`rounded-full h-11 px-7 font-bold text-sm bg-transparent ${isDark ? 'hover:bg-white/10 text-white hover:text-white' : 'hover:bg-slate-200 text-slate-700'}`}>
                        ABORT
                    </Button>
                    <Button onClick={onSave} disabled={!editingPlan?.name?.trim()}
                        className={`rounded-full h-11 px-9 font-black text-sm shadow-xl transition-all border-0 ${!editingPlan?.name?.trim() ? 'opacity-50 cursor-not-allowed' : ''} ${t.btnPrimary(isDark)} ${isDark ? 'shadow-lime-400/20' : 'shadow-slate-900/20'}`}>
                        {editingPlan?.id ? 'COMMIT UPDATE' : 'INITIALISE PLAN'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
