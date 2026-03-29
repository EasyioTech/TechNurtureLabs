'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Lock, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolTheme, ts } from '../../theme-context';
import { toast } from 'sonner';
import { updateSchoolAdminPassword } from '../../actions';

interface ChangePasswordModalProps {
    schoolId: string;
    adminId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ChangePasswordModal({ schoolId, adminId, isOpen, onClose }: ChangePasswordModalProps) {
    const { isDark } = useSchoolTheme();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [formData, setFormData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.new !== formData.confirm) {
            toast.error('New passwords do not match');
            return;
        }
        if (formData.new.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await updateSchoolAdminPassword(schoolId, adminId, formData.current, formData.new);
            if (res.success) {
                toast.success(res.message);
                setFormData({ current: '', new: '', confirm: '' });
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error('Failed to update password');
        } finally {
            setLoading(false);
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
                    className={`relative w-full max-w-md overflow-hidden rounded-[32px] border shadow-2xl ${ts.card(isDark)}`}
                >
                    <div className={`px-8 py-6 border-b flex items-center justify-between ${ts.border(isDark)}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Change Password</h3>
                                <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>Ensure your account stays secure</p>
                            </div>
                        </div>
                        <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-5">
                        <div className="space-y-2">
                            <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Current Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    required
                                    value={formData.current}
                                    onChange={e => setFormData({ ...formData, current: e.target.value })}
                                    className={`w-full h-12 pl-12 pr-12 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className={`w-full h-px ${ts.divider(isDark)} my-2`} />

                        <div className="space-y-2">
                            <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    required
                                    value={formData.new}
                                    onChange={e => setFormData({ ...formData, new: e.target.value })}
                                    className={`w-full h-12 pl-12 pr-12 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Confirm New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    required
                                    value={formData.confirm}
                                    onChange={e => setFormData({ ...formData, confirm: e.target.value })}
                                    className={`w-full h-12 pl-12 pr-12 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'}`}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3">
                            <Button
                                type="submit"
                                disabled={loading}
                                className={`w-full rounded-2xl h-12 font-black text-[13px] ${ts.btnPrimary(isDark)}`}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                                Update Password
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className={`w-full rounded-2xl h-12 font-black text-[13px] border ${isDark ? 'border-white/10 text-slate-100 hover:bg-white/5' : 'border-slate-200 text-slate-800 hover:bg-slate-100'}`}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
