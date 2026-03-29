'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolTheme, ts } from '../../theme-context';
import { toast } from 'sonner';
import { updateSchoolAdminProfile } from '../../actions';

interface EditAdminProfileModalProps {
    schoolId: string;
    adminProfile: {
        id: string;
        first_name: string;
        last_name: string;
        email?: string | null;
        phone?: string | null;
    };
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function EditAdminProfileModal({ schoolId, adminProfile, isOpen, onClose, onUpdate }: EditAdminProfileModalProps) {
    const { isDark } = useSchoolTheme();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: ''
    });

    useEffect(() => {
        if (isOpen && adminProfile) {
            setFormData({
                first_name: adminProfile.first_name || '',
                last_name: adminProfile.last_name || ''
            });
        }
    }, [adminProfile, isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await updateSchoolAdminProfile(schoolId, adminProfile.id, formData);
            if (res.success) {
                toast.success(res.message);
                onUpdate();
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error('Failed to update profile');
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
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Edit Admin Profile</h3>
                                <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>Update your personal information</p>
                            </div>
                        </div>
                        <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-5">
                        <div className="space-y-2">
                            <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>First Name</label>
                            <input
                                type="text"
                                required
                                value={formData.first_name}
                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                className={`w-full h-12 px-5 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${isDark ? 'border-white/5 focus:bg-white/[0.05] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Last Name</label>
                            <input
                                type="text"
                                required
                                value={formData.last_name}
                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                className={`w-full h-12 px-5 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${isDark ? 'border-white/5 focus:bg-white/[0.05] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'}`}
                            />
                        </div>

                        <div className="space-y-2 opacity-60">
                            <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Primary Identifier ({adminProfile.email ? 'Email' : 'Phone'})</label>
                            <input
                                type="text"
                                disabled
                                value={adminProfile.email || adminProfile.phone || ''}
                                className={`w-full h-12 px-5 rounded-2xl border bg-transparent text-sm font-bold outline-none cursor-not-allowed ${isDark ? 'border-white/5' : 'border-slate-200'}`}
                            />
                        </div>

                        <div className="mt-8 flex flex-col gap-3">
                            <Button
                                type="submit"
                                disabled={loading}
                                className={`w-full rounded-2xl h-12 font-black text-[13px] ${ts.btnPrimary(isDark)}`}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                                Save Profile
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className={`w-full rounded-2xl h-12 font-black text-[13px] ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
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
