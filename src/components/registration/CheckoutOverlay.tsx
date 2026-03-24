'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Tag, Loader2, Gift, BadgeCheck, CreditCard, Shield } from 'lucide-react';

interface CheckoutOverlayProps {
    showCheckout: boolean;
    checkoutOrder: any;
    setShowCheckout: (show: boolean) => void;
    appliedPromo: any;
    promoCodeInput: string;
    setPromoCodeInput: (val: string) => void;
    handleApplyPromo: () => void;
    promoLoading: boolean;
    promoError: string;
    removePromo: () => void;
    handleRazorpayPayment: () => void;
    loading: boolean;
    setPromoError: (val: string) => void;
    settings?: any;
}

export const CheckoutOverlay: React.FC<CheckoutOverlayProps> = ({
    showCheckout, checkoutOrder, setShowCheckout, appliedPromo,
    promoCodeInput, setPromoCodeInput, handleApplyPromo,
    promoLoading, promoError, removePromo, handleRazorpayPayment,
    loading, setPromoError, settings
}) => {
    return (
        <AnimatePresence>
            {showCheckout && checkoutOrder && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 30, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
                    >
                        <div className="relative bg-gradient-to-br from-indigo-600 to-blue-700 px-8 py-8 text-white overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white, transparent 60%)' }} />
                            <button
                                onClick={() => setShowCheckout(false)}
                                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden">
                                    {settings?.logo_url ? (
                                        <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Lock size={18} />
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Secure Checkout</p>
                                    {settings?.show_platform_name !== false && (
                                        <p className="text-sm font-bold text-white">{settings?.platform_name || 'TechNurture Labs'}</p>
                                    )}
                                </div>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">{checkoutOrder.plan.name}</h2>
                            <p className="text-indigo-200 text-sm font-medium mt-1">Annual School License</p>
                        </div>

                        <div className="px-8 py-6 space-y-5">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-500">Plan Price</span>
                                    <span className="font-black text-slate-900">
                                        {'\u20B9'}{Number(checkoutOrder.original_price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <AnimatePresence mode="wait">
                                    {!appliedPromo ? (
                                        <motion.div key="promo-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <div className="flex gap-2 mt-2">
                                                <div className="relative flex-1">
                                                    <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        placeholder="Promo Code"
                                                        value={promoCodeInput}
                                                        onChange={(e) => { setPromoCodeInput(e.target.value.toUpperCase()); setPromoError(''); }}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleApplyPromo(); }}
                                                        className="w-full h-12 pl-9 pr-4 border-2 border-slate-200 rounded-2xl text-sm font-bold font-mono uppercase tracking-widest focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleApplyPromo}
                                                    disabled={promoLoading || !promoCodeInput}
                                                    className="h-12 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                                >
                                                    {promoLoading ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                                                </button>
                                            </div>
                                            {promoError && (
                                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-rose-500 text-xs font-bold mt-2 ml-1 flex items-center gap-1">
                                                    <X size={12} /> {promoError}
                                                </motion.p>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="promo-applied"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                                                        <Gift size={14} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">{appliedPromo.code}</p>
                                                        <p className="text-[10px] font-bold text-emerald-600">Code Applied</p>
                                                    </div>
                                                </div>
                                                <button onClick={removePromo} className="text-emerald-600 hover:text-rose-500 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-black text-emerald-700">
                                                {appliedPromo.discount_type === 'percentage'
                                                    ? `${'\uD83C\uDF89'} ${appliedPromo.discount_value}% off - saving ${'\u20B9'}${Number(checkoutOrder.discount_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}!`
                                                    : `${'\uD83C\uDF89'} Flat ${'\u20B9'}${Number(checkoutOrder.discount_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} off applied!`}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {appliedPromo && checkoutOrder.discount_amount > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex justify-between items-center text-emerald-600 overflow-hidden"
                                        >
                                            <span className="text-sm font-bold flex items-center gap-1.5">
                                                <BadgeCheck size={16} /> Promo Discount
                                            </span>
                                            <motion.span
                                                key={checkoutOrder.discount_amount}
                                                initial={{ scale: 1.3, color: '#10B981' }}
                                                animate={{ scale: 1 }}
                                                className="font-black text-lg"
                                            >
                                                - {'\u20B9'}{Number(checkoutOrder.discount_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                            </motion.span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="h-px bg-slate-100" />

                                <div className="flex justify-between items-center">
                                    <span className="text-base font-black text-slate-900">Total Due</span>
                                    <div className="text-right">
                                        {appliedPromo && checkoutOrder.discount_amount > 0 && (
                                            <p className="text-xs text-slate-400 line-through">{'\u20B9'}{Number(checkoutOrder.original_price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                                        )}
                                        <motion.p
                                            key={checkoutOrder.final_amount}
                                            initial={{ scale: 1.1 }}
                                            animate={{ scale: 1 }}
                                            className="text-3xl font-black text-slate-900"
                                        >
                                            {checkoutOrder.final_amount === 0 ? 'FREE' : `${'\u20B9'}${Number(checkoutOrder.final_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                                        </motion.p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { icon: <Lock size={12} />, label: '256-bit SSL' },
                                    { icon: <Shield size={12} />, label: 'PCI Compliant' },
                                    { icon: <BadgeCheck size={12} />, label: 'RBI Approved' }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-500">{item.icon}</span>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleRazorpayPayment}
                                disabled={loading || promoLoading}
                                className={`w-full h-16 rounded-2xl font-black text-base uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 cursor-pointer
                  ${checkoutOrder.final_amount === 0
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30'}
                  active:scale-[0.98] disabled:opacity-60
                `}
                            >
                                {loading ? (
                                    <><Loader2 size={20} className="animate-spin" /> Activating Portal...</>
                                ) : promoLoading ? (
                                    <><Loader2 size={20} className="animate-spin" /> Applying promo...</>
                                ) : (
                                    <><BadgeCheck size={20} /> Activate School Portal</>
                                )}
                            </button>

                            <p className="text-center text-[10px] text-slate-400 font-bold">
                                Secure Instant Activation • No Payment Gateway Required
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
