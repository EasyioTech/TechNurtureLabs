'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Tag, Calendar, AlertCircle, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PromoCode } from '../../types';
import { PromoCodeDialog } from '../promo-code-dialog';
import { format } from 'date-fns';
import { useAdminTheme, t } from '../../theme-context';

export function PromoCodesTab({
    promoCodes,
    onSavePromoCode,
    onDeletePromoCode,
    showDialog,
    setShowDialog,
    editingCode,
    setEditingCode,
}: {
    promoCodes: PromoCode[];
    onSavePromoCode: () => void;
    onDeletePromoCode: (id: string) => void;
    showDialog: boolean;
    setShowDialog: (open: boolean) => void;
    editingCode: Partial<PromoCode> | null;
    setEditingCode: (code: Partial<PromoCode> | null) => void;
}) {
    const { isDark, accent } = useAdminTheme();

    return (
        <div className="space-y-6">
            <div className={`p-6 sm:p-8 rounded-[2.5rem] ${t.card(isDark)} ${t.border(isDark)} shadow-xl ${isDark ? '' : 'shadow-slate-200/50'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className={`text-2xl font-black tracking-tight ${t.textPrimary(isDark)}`}>Discount Codes</h2>
                        <p className={`text-sm font-bold uppercase tracking-widest mt-1 ${t.textMuted(isDark)}`}>Manage platform level promo codes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {promoCodes.map((code) => (
                        <motion.div
                            key={code.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -4 }}
                            className={`p-6 rounded-3xl ${t.border(isDark)} transition-all group flex flex-col justify-between
                                ${isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100 hover:shadow-lg'}`}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl border-2 ${code.is_active ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-600') : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-500')}`}>
                                        <Tag size={20} strokeWidth={2.5} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${code.is_active ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100') : (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-100')}`}>
                                        {code.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                                <h3 className={`text-xl font-black mb-1 font-mono uppercase tracking-widest ${t.textPrimary(isDark)}`}>{code.code}</h3>
                                <p className={`text-sm font-bold mb-4 flex items-center gap-1.5 ${t.textMuted(isDark)}`}>
                                    <Percent size={14} />
                                    {code.discount_type === 'percentage' ? `${code.discount_value}% OFF` : `₹${code.discount_value} OFF`}
                                </p>

                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between items-center text-xs font-medium">
                                        <span className={t.textMuted(isDark)}>Usage</span>
                                        <span className={t.textPrimary(isDark)}>{code.current_uses} / {code.max_uses || '∞'}</span>
                                    </div>
                                    {(code.valid_from || code.valid_until) && (
                                        <div className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                                            {code.valid_from && <span className="flex items-center gap-1.5 text-emerald-500"><Calendar size={12} /> From: {format(new Date(code.valid_from), 'PP')}</span>}
                                            {code.valid_until && <span className="flex items-center gap-1.5 text-rose-500"><Calendar size={12} /> Until: {format(new Date(code.valid_until), 'PP')}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                                <Button
                                    variant="outline" size="sm"
                                    className={`flex-1 rounded-xl text-xs font-bold border-2 ${t.btnOutline(isDark)}`}
                                    onClick={() => { setEditingCode(code); setShowDialog(true); }}
                                >
                                    EDIT CODE
                                </Button>
                                <Button
                                    variant="outline" size="sm"
                                    className={`flex-none rounded-xl text-xs font-bold border-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 ${isDark ? 'border-rose-500/20 hover:border-rose-500/30 dark:hover:bg-rose-500/10' : 'border-rose-200'}`}
                                    onClick={() => onDeletePromoCode(code.id)}
                                >
                                    DELETE
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                    {promoCodes.length === 0 && (
                        <div className={`col-span-full py-16 text-center border-2 border-dashed rounded-[2rem] ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <AlertCircle className={`mx-auto mb-4 ${t.textMuted(isDark)}`} size={32} />
                            <p className={`text-lg font-bold ${t.textMuted(isDark)}`}>No Promo Codes Created Yet</p>
                        </div>
                    )}
                </div>
            </div>

            <PromoCodeDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                editingCode={editingCode}
                setEditingCode={setEditingCode}
                onSave={onSavePromoCode}
            />
        </div>
    );
}
