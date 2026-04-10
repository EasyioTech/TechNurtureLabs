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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className={`text-3xl font-black tracking-tighter ${t.textPrimary(isDark)}`}>Growth Incentives</h2>
                    <p className={`text-xs font-bold uppercase tracking-[0.2em] mt-1 ${t.textMuted(isDark)}`}>Manage and track platform discount codes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {promoCodes.map((code) => {
                    const isPercentage = code.discount_type === 'percentage';
                    const usagePercent = code.max_uses ? Math.min(100, (code.current_uses / code.max_uses) * 100) : 0;
                    
                    return (
                        <motion.div
                            key={code.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className={`relative rounded-[2rem] overflow-hidden border-2 transition-all duration-500 group
                                ${isDark ? 'bg-white/[0.03] border-white/[0.05] hover:border-white/10 hover:bg-white/[0.04]' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl'}`}
                        >
                            {/* Ticket Notch Effect */}
                            <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${isDark ? 'bg-[#09090b]' : 'bg-slate-50'} border-r-2 ${isDark ? 'border-white/[0.05]' : 'border-slate-100'}`} />
                            <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${isDark ? 'bg-[#09090b]' : 'bg-slate-50'} border-l-2 ${isDark ? 'border-white/[0.05]' : 'border-slate-100'}`} />
                            
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl transition-transform group-hover:rotate-6 ${t.accentSoft(isDark, accent)}`}>
                                        <Tag size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border
                                            ${code.is_active ? 
                                                'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                            {code.is_active ? 'Active' : 'Expired'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-6">
                                    <h3 className={`text-4xl font-black tracking-tighter ${t.textPrimary(isDark)}`}>
                                        {isPercentage ? `${code.discount_value}%` : `₹${code.discount_value}`} <span className={`text-sm tracking-widest uppercase opacity-40 ml-1`}>OFF</span>
                                    </h3>
                                    <p className={`text-lg font-mono font-black uppercase tracking-[0.2em] ${accent.text}`}>
                                        {code.code}
                                    </p>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-dashed border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Redeemed</span>
                                        <span className={`text-[10px] font-black ${t.textPrimary(isDark)}`}>
                                            {code.current_uses} / {code.max_uses || '∞'}
                                        </span>
                                    </div>
                                    {code.max_uses && (
                                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-slate-100'}`}>
                                            <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${usagePercent}%` }} 
                                                className={`h-full ${usagePercent > 90 ? 'bg-rose-500' : accent.bg}`} 
                                            />
                                        </div>
                                    )}
                                    
                                    {(code.valid_from || code.valid_until) && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                                            {code.valid_until && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={12} className="text-rose-500" />
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>
                                                        Expires {format(new Date(code.valid_until), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`flex border-t ${isDark ? 'border-white/[0.03] bg-white/[0.01]' : 'border-slate-100 bg-slate-50/50'}`}>
                                <button
                                    onClick={() => { setEditingCode(code); setShowDialog(true); }}
                                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-black/5 transition-colors ${t.textPrimary(isDark)}`}
                                >
                                    Review
                                </button>
                                <div className={`w-[1px] ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`} />
                                <button
                                    onClick={() => onDeletePromoCode(code.id)}
                                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/5 transition-colors"
                                >
                                    Dissolve
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
                
                {promoCodes.length === 0 && (
                    <div className={`col-span-full py-24 text-center border-4 border-dashed rounded-[3rem] ${isDark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
                        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                            <AlertCircle className={t.textMuted(isDark)} size={32} />
                        </div>
                        <p className={`text-xl font-black ${t.textPrimary(isDark)}`}>No Active Promotions</p>
                        <p className={`text-sm font-bold mt-1 ${t.textMuted(isDark)}`}>Create your first discount code to boost engagement.</p>
                    </div>
                )}
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
