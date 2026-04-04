'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolTheme, ts } from '../../theme-context';
import { toast } from 'sonner';
import { getSchoolInvoices } from '../../actions';
import { StandardLoader } from '../shared/standard-loader';

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
            setInvoices(data || []);
        } catch (err) {
            toast.error('Failed to load billing history');
            setInvoices([]);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'bg-[#0c0f1a]/80' : 'bg-black/50'} backdrop-blur-sm`}
            />

            {/* Modal */}
            <div 
                role="dialog"
                aria-modal="true"
                aria-labelledby="billing-history-title"
                aria-describedby="billing-history-description"
                className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[28px] sm:rounded-[32px] border shadow-2xl transition-all duration-300 ${ts.card(isDark)}`}
            >
                {/* Header */}
                <div className={`px-6 sm:px-8 py-6 border-b flex items-center justify-between gap-4 ${ts.border(isDark)}`}>
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Receipt size={20} />
                        </div>
                        <div className="min-w-0">
                            <h3 id="billing-history-title" className={`text-lg sm:text-xl font-black tracking-tight truncate ${ts.textPrimary(isDark)}`}>Billing History</h3>
                            <p id="billing-history-description" className={`text-[12px] font-bold truncate ${ts.textMuted(isDark)}`}>Review and download your invoices</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close dialog" className={`p-2 rounded-xl transition-colors flex-shrink-0 ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <StandardLoader message="Loading invoices..." size="medium" />
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <Receipt size={32} className={ts.textMuted(isDark)} />
                            </div>
                            <div>
                                <h4 className={`text-lg font-black mb-1 ${ts.textPrimary(isDark)}`}>No Invoices Yet</h4>
                                <p className={`text-sm font-bold max-w-xs mx-auto ${ts.textMuted(isDark)}`}>When you make a payment, your invoices will appear here.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className={`p-6 rounded-[24px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 transition-colors hover:border-indigo-500/30 ${ts.card(isDark)}`}
                                >
                                    <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-center ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-tighter opacity-70 leading-none">
                                                    {new Date(invoice.created_at).toLocaleString('default', { month: 'short' })}
                                                </p>
                                                <p className="text-sm font-black leading-none mt-1">
                                                    {new Date(invoice.created_at).getDate()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-[13px] font-black truncate ${ts.textPrimary(isDark)}`}>
                                                Invoice #{invoice.invoice_number}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${getStatusStyle(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                                <span className={`text-[11px] font-bold ${ts.textMuted(isDark)}`}>
                                                    {invoice.currency} {invoice.total}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        className={`w-full sm:w-auto rounded-xl h-10 px-4 font-black text-[12px] gap-2 border flex items-center justify-center transition-colors ${isDark ? 'border-white/10 text-slate-100 hover:bg-white/5' : 'border-slate-200 text-slate-800 hover:bg-slate-50'}`}
                                        onClick={() => window.open(`/api/school/invoice/${invoice.id}`, '_blank') || toast.info('Generating document...')}
                                    >
                                        <Download size={14} />
                                        <span className="truncate">Download PDF</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 sm:px-8 py-4 border-t flex justify-end ${ts.border(isDark)}`}>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className={`rounded-2xl h-11 px-8 font-black text-[13px] border transition-colors ${isDark ? 'border-white/10 text-slate-100 hover:bg-white/5' : 'border-slate-200 text-slate-800 hover:bg-slate-100'}`}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
