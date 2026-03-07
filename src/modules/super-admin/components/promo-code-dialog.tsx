'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { PromoCode } from '../types';
import { useAdminTheme, t } from '../theme-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PromoCodeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCode: Partial<PromoCode> | null;
    setEditingCode: (code: Partial<PromoCode> | null) => void;
    onSave: () => void;
}

export function PromoCodeDialog({
    open,
    onOpenChange,
    editingCode,
    setEditingCode,
    onSave,
}: PromoCodeDialogProps) {
    const { isDark, accent } = useAdminTheme();
    const [loading, setLoading] = React.useState(false);

    const handleSave = async () => {
        setLoading(true);
        await onSave();
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[425px] border-2 rounded-[2rem] p-8 ${t.card(isDark)} ${t.border(isDark)}`}>
                <DialogHeader className="mb-6">
                    <DialogTitle className={`text-2xl font-black tracking-tight ${t.textPrimary(isDark)}`}>
                        {editingCode?.id ? 'EDIT PROMO CODE' : 'CREATE PROMO CODE'}
                    </DialogTitle>
                    <DialogDescription className={`text-xs font-bold uppercase tracking-widest mt-1 ${t.textMuted(isDark)}`}>
                        {editingCode?.id ? 'Modify discount settings' : 'Generate new discount'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="code" className={`text-xs font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Promo Code</Label>
                        <Input
                            id="code"
                            value={editingCode?.code || ''}
                            onChange={(e) => setEditingCode({ ...editingCode, code: e.target.value.toUpperCase() })}
                            className={`h-12 border-2 rounded-xl transition-all font-mono focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            placeholder="e.g. SUMMER2024"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="discount_type" className={`text-xs font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Type</Label>
                            <Select
                                value={editingCode?.discount_type || 'percentage'}
                                onValueChange={(v: any) => setEditingCode({ ...editingCode, discount_type: v })}
                            >
                                <SelectTrigger className={`h-12 border-2 rounded-xl transition-all font-bold focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                    <SelectValue placeholder="Discount Type" />
                                </SelectTrigger>
                                <SelectContent className={`border-2 rounded-xl shadow-2xl ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                                    <SelectItem value="percentage" className="font-bold">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed" className="font-bold">Fixed Amount (₹)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="discount_value" className={`text-xs font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Value</Label>
                            <Input
                                id="discount_value"
                                type="number"
                                min="0"
                                step="any"
                                value={editingCode?.discount_value || ''}
                                onChange={(e) => setEditingCode({ ...editingCode, discount_value: parseFloat(e.target.value) })}
                                className={`h-12 border-2 rounded-xl transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                placeholder="10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="max_uses" className={`text-xs font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Overall Usage Limit</Label>
                        <Input
                            id="max_uses"
                            type="number"
                            min="1"
                            value={editingCode?.max_uses || ''}
                            onChange={(e) => setEditingCode({ ...editingCode, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                            className={`h-12 border-2 rounded-xl transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            placeholder="Leave blank for unlimited"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="valid_from" className={`text-xs font-bold uppercase tracking-widest text-[#10b981]`}>Valid From</Label>
                            <Input
                                id="valid_from"
                                type="date"
                                value={editingCode?.valid_from ? new Date(editingCode.valid_from).toISOString().split('T')[0] : ''}
                                onChange={(e) => setEditingCode({ ...editingCode, valid_from: e.target.value || null })}
                                className={`h-12 border-2 rounded-xl bg-transparent transition-all focus-visible:ring-4 focus-visible:ring-emerald-400/20 ${t.textPrimary(isDark)} border-emerald-500/30 font-mono text-sm`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="valid_until" className={`text-xs font-bold uppercase tracking-widest text-[#f43f5e]`}>Valid Until</Label>
                            <Input
                                id="valid_until"
                                type="date"
                                value={editingCode?.valid_until ? new Date(editingCode.valid_until).toISOString().split('T')[0] : ''}
                                onChange={(e) => setEditingCode({ ...editingCode, valid_until: e.target.value || null })}
                                className={`h-12 border-2 rounded-xl bg-transparent transition-all focus-visible:ring-4 focus-visible:ring-rose-400/20 ${t.textPrimary(isDark)} border-rose-500/30 font-mono text-sm`}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className={`h-12 border-2 rounded-xl px-8 font-bold text-xs uppercase tracking-widest ${isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'} ${t.textMuted(isDark)}`}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className={`h-12 rounded-xl px-8 font-black text-xs uppercase tracking-widest shadow-xl transition-all
                            ${t.btnPrimary(isDark, accent)}`}
                        style={isDark ? { boxShadow: `0 10px 25px -5px ${accent.swatchDark}33` } : {}}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        SAVE CODE
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
