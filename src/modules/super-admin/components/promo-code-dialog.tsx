'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Tag } from 'lucide-react';
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

    // Auto-sanitization for the code input
    const sanitizeCode = (val: string) => val.replace(/\s+/g, '').toUpperCase();

    const handleSave = async () => {
        // Validation check for empty fields
        if (!editingCode?.code || editingCode.code.length < 3) return;
        if (!editingCode?.discount_value || isNaN(Number(editingCode.discount_value))) return;

        setLoading(true);
        try {
            await onSave();
            onOpenChange(false);
        } catch (_) {
            // Error handling usually handled by onSave toast
        } finally {
            setLoading(false);
        }
    };

    const type = editingCode?.discount_type || 'percentage';
    const val = editingCode?.discount_value || 0;
    const codeStr = editingCode?.code || 'NEWCODE';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[700px] gap-0 border-0 overflow-hidden rounded-[2.5rem] p-0 shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                <div className="flex flex-col md:flex-row h-full">
                    {/* ── Left Side: Inputs ── */}
                    <div className={`p-8 md:w-3/5 border-r ${t.border(isDark)}`}>
                        <DialogHeader className="mb-8">
                            <DialogTitle className={`text-2xl font-black tracking-tight ${t.textPrimary(isDark)}`}>
                                {editingCode?.id ? 'Edit Promo' : 'Create Promo'}
                            </DialogTitle>
                            <DialogDescription className={`text-[10px] font-black uppercase tracking-widest mt-1 opacity-60 ${t.textMuted(isDark)}`}>
                                Configure your discount strategy
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="code" className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Promo Code Identifier</Label>
                                <Input
                                    id="code"
                                    value={editingCode?.code || ''}
                                    autoFocus
                                    onChange={(e) => setEditingCode({ ...editingCode, code: sanitizeCode(e.target.value) })}
                                    className={`h-12 border-2 rounded-xl transition-all font-mono text-lg focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    placeholder="SUMMER2024"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Discount Type</Label>
                                    <Select
                                        value={type}
                                        onValueChange={(v: any) => setEditingCode({ ...editingCode, discount_type: v })}
                                    >
                                        <SelectTrigger className={`h-12 border-2 rounded-xl transition-all font-bold focus-visible:ring-4 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className={`border-2 rounded-xl shadow-2xl ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                                            <SelectItem value="percentage" className="font-bold">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed" className="font-bold">Fixed Amount (₹)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="discount_value" className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Value</Label>
                                    <Input
                                        id="discount_value"
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={editingCode?.discount_value ?? ''}
                                        onChange={(e) => setEditingCode({ ...editingCode, discount_value: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                                        className={`h-12 border-2 rounded-xl transition-all focus-visible:ring-4 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                        placeholder="10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max_uses" className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Available Stock (Usage Limit)</Label>
                                <Input
                                    id="max_uses"
                                    type="number"
                                    min="1"
                                    value={editingCode?.max_uses ?? ''}
                                    onChange={(e) => setEditingCode({ ...editingCode, max_uses: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className={`h-12 border-2 rounded-xl transition-all focus-visible:ring-4 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    placeholder="∞ Unlimited"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="valid_from" className={`text-[10px] font-black uppercase tracking-widest text-emerald-500`}>Launch Date</Label>
                                    <Input
                                        id="valid_from"
                                        type="date"
                                        value={editingCode?.valid_from ? new Date(editingCode.valid_from).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setEditingCode({ ...editingCode, valid_from: e.target.value || null })}
                                        className={`h-12 border-2 rounded-xl bg-transparent transition-all focus-visible:ring-4 focus-visible:ring-emerald-400/20 ${t.textPrimary(isDark)} border-emerald-500/20 font-mono text-sm`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="valid_until" className={`text-[10px] font-black uppercase tracking-widest text-rose-500`}>Expiry Date</Label>
                                    <Input
                                        id="valid_until"
                                        type="date"
                                        value={editingCode?.valid_until ? new Date(editingCode.valid_until).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setEditingCode({ ...editingCode, valid_until: e.target.value || null })}
                                        className={`h-12 border-2 rounded-xl bg-transparent transition-all focus-visible:ring-4 focus-visible:ring-rose-400/20 ${t.textPrimary(isDark)} border-rose-500/20 font-mono text-sm`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-white/[0.05]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className={`h-12 rounded-2xl px-6 font-bold text-xs uppercase tracking-widest border-2 ${t.btnOutline(isDark)}`}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className={`h-12 rounded-2xl px-10 font-black text-xs uppercase tracking-widest shadow-xl transition-all ${t.btnPrimary(isDark, accent)}`}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingCode?.id ? 'Update Code' : 'Create Now'}
                            </Button>
                        </div>
                    </div>

                    {/* ── Right Side: Live Premium Preview ── */}
                    <div className={`md:w-2/5 p-8 flex flex-col items-center justify-center relative overflow-hidden ${isDark ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 w-64 h-64 blur-3xl rounded-full opacity-20 bg-${accent.name}-500`} />
                        <div className={`absolute bottom-0 left-0 w-64 h-64 blur-3xl rounded-full opacity-10 bg-emerald-500`} />

                        <div className="relative z-10 w-full">
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-6 text-center ${t.textMuted(isDark)}`}>Live Preview</p>
                            
                            <motion.div
                                layout
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                className={`w-full aspect-[4/5] rounded-[2rem] border-4 p-8 flex flex-col items-center justify-between text-center relative shadow-2xl overflow-hidden
                                    ${isDark ? 'bg-slate-900 border-white/[0.05]' : 'bg-white border-slate-100 shadow-slate-200'}`}
                            >
                                {/* Ticket cutout effect */}
                                <div className={`absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`} />
                                <div className={`absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`} />
                                <div className={`absolute left-8 right-8 top-1/2 border-t-2 border-dashed ${isDark ? 'border-white/10' : 'border-slate-200'}`} />

                                <div className="space-y-4 pt-2">
                                    <div className={`mx-auto w-16 h-16 rounded-3xl flex items-center justify-center transition-transform duration-500 hover:rotate-6
                                        ${t.accentSoft(isDark, accent)}`}>
                                        <Tag size={32} />
                                    </div>
                                    <div>
                                        <h4 className={`text-4xl font-black tracking-tighter ${t.textPrimary(isDark)}`}>
                                            {type === 'percentage' ? `${val || 0}%` : `₹${val || 0}`}
                                        </h4>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Instant Discount</p>
                                    </div>
                                </div>

                                <div className="w-full space-y-3 pb-2">
                                    <div className={`py-4 rounded-2xl border-2 border-dashed font-mono font-black text-2xl tracking-[0.2em] transition-all
                                        ${isDark ? 'bg-white/[0.05] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                        {codeStr || 'CODE'}
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${editingCode?.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
                                            {editingCode?.is_active !== false ? 'Ready to use' : 'Inactive'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className={t.textMuted(isDark)}>Usage Cap</span>
                                    <span className={t.textPrimary(isDark)}>{editingCode?.max_uses || 'Unlimited'}</span>
                                </div>
                                <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-slate-100'}`}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className={`h-full ${accent.bg}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

