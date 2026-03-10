'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, Download, CreditCard, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolTheme, ts } from '../../theme-context';
import { toast } from 'sonner';
import { getSchoolInvoices } from '../../actions';

interface BillingHistoryModalProps {
    schoolId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function BillingHistoryModal({ schoolId, isOpen, onClose }: BillingHistoryModalProps) {
    const { isDark } = useSchoolTheme();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchInvoices();
        }
    }, [isOpen, schoolId]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const data = await getSchoolInvoices(schoolId);
            setInvoices(data);
        } catch (err) {
            toast.error('Failed to load billing history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'bg-emerald-500/10 text-emerald-500';
            case 'pending': return 'bg-amber-500/10 text-amber-500';
            case 'overdue': return 'bg-rose-500/10 text-rose-500';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#0c0f1a]/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[32px] border shadow-2xl ${ts.card(isDark)}`}
                >
                    <div className={`px-8 py-6 border-b flex items-center justify-between ${ts.border(isDark)}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <Receipt size={20} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Billing History</h3>
                                <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>Review and download your previous invoices</p>
                            </div>
                        </div>
                        <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                <p className={`text-sm font-bold ${ts.textMuted(isDark)}`}>Loading invoices...</p>
                            </div>
                        ) : invoices.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                    <Receipt size={32} className="text-slate-400" />
                                </div>
                                <div>
                                    <h4 className={`text-lg font-black ${ts.textPrimary(isDark)}`}>No Invoices Yet</h4>
                                    <p className={`text-sm font-bold max-w-xs mx-auto ${ts.textMuted(isDark)}`}>When you make a payment, your invoices will appear here.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {invoices.map((invoice) => (
                                    <div
                                        key={invoice.id}
                                        className={`p-6 rounded-[24px] border flex flex-col sm:flex-row items-center justify-between gap-6 transition-all hover:border-indigo-500/30 ${ts.card(isDark)}`}
                                    >
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-tighter opacity-70">
                                                        {new Date(invoice.created_at).toLocaleString('default', { month: 'short' })}
                                                    </p>
                                                    <p className="text-sm font-black leading-none">
                                                        {new Date(invoice.created_at).getDate()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-[13px] font-black truncate ${ts.textPrimary(isDark)}`}>
                                                    Invoice #{invoice.invoice_number}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${getStatusStyle(invoice.status)}`}>
                                                        {invoice.status}
                                                    </span>
                                                    <span className={`text-[11px] font-bold ${ts.textMuted(isDark)}`}>
                                                        • {invoice.currency} {invoice.total}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                                            <Button
                                                variant="ghost"
                                                className={`flex-1 sm:flex-none rounded-xl h-10 px-4 font-black text-[12px] gap-2 border ${isDark ? 'border-white/10 text-slate-100 hover:bg-white/5' : 'border-slate-200 text-slate-800 hover:bg-slate-50'}`}
                                                onClick={() => toast.info('Invoice download starting...')}
                                            >
                                                <Download size={14} /> Download
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={`p-8 border-t flex justify-end ${ts.border(isDark)}`}>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className={`rounded-2xl h-11 px-8 font-black text-[13px] border ${isDark ? 'border-white/10 text-slate-100 hover:bg-white/5' : 'border-slate-200 text-slate-800 hover:bg-slate-100'}`}
                        >
                            Close History
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
