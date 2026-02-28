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
            <DialogContent className="sm:max-w-[600px] bg-white rounded-2xl border-stone-200 overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {editingPlan?.id ? 'Edit Payment Plan' : 'Create Payment Plan'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Plan Name</Label>
                            <Input
                                placeholder="Starter, Pro, etc."
                                value={editingPlan?.name || ''}
                                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Price (INR)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={editingPlan?.price || 0}
                                onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            placeholder="Short summary of the plan..."
                            value={editingPlan?.description || ''}
                            onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                            className="rounded-xl min-h-[60px]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Billing Cycle</Label>
                            <Select
                                value={editingPlan?.billing_cycle || 'monthly'}
                                onValueChange={(val) => setEditingPlan({ ...editingPlan, billing_cycle: val })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                    <SelectItem value="one-time">One-time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Max Students (optional)</Label>
                            <Input
                                type="number"
                                placeholder="Unlimited"
                                value={editingPlan?.max_students || ''}
                                onChange={(e) => setEditingPlan({ ...editingPlan, max_students: Number(e.target.value) || null })}
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-800 font-bold">Features</Label>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-sky-600 border-sky-200" onClick={addFeature}>
                                <Plus size={14} className="mr-1" />Add
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {editingPlan?.features?.map((feature, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={feature}
                                        onChange={(e) => updateFeature(idx, e.target.value)}
                                        placeholder={`Feature ${idx + 1}`}
                                        className="rounded-lg h-9"
                                    />
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500" onClick={() => removeFeature(idx)}>
                                        <X size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-100 mt-2">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold text-sky-800">Plan Status</Label>
                            <p className="text-xs text-sky-600">Active plans are visible for schools to purchase</p>
                        </div>
                        <Switch
                            checked={editingPlan?.is_active ?? true}
                            onCheckedChange={(val) => setEditingPlan({ ...editingPlan, is_active: val })}
                        />
                    </div>
                </div>
                <DialogFooter className="pt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-8" onClick={onSave}>Save Plan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
