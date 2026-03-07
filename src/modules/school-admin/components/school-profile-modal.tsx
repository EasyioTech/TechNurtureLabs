'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Mail, Phone, MapPin, Globe, Save, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSchoolTheme, ts } from '../theme-context';
import { toast } from 'sonner';
import { updateSchoolProfile } from '../actions';
import { ImageUpload } from '@/modules/shared/components/image-upload';

interface SchoolProfileModalProps {
    schoolId: string;
    profile: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function SchoolProfileModal({ schoolId, profile, isOpen, onClose, onUpdate }: SchoolProfileModalProps) {
    const { isDark } = useSchoolTheme();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '',
        city: '', state: '', pincode: '', logo_url: '', website: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                address: profile.address || '',
                city: profile.city || '',
                state: profile.state || '',
                pincode: profile.pincode || '',
                logo_url: profile.logo_url || '',
                website: profile.website || '',
            });
        }
    }, [profile, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Find only changed fields to avoid unnecessary updates
            const changedFields: any = {};
            Object.keys(formData).forEach(key => {
                const val = (formData as any)[key];
                const originalVal = (profile as any)[key] ?? '';
                if (val !== originalVal) {
                    changedFields[key] = val;
                }
            });

            if (Object.keys(changedFields).length > 0) {
                await updateSchoolProfile(schoolId, changedFields);
                toast.success('Institution profile updated successfully');
                onUpdate();
            } else {
                toast.info('No changes detected');
            }
            onClose();
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
                    className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[32px] border shadow-2xl ${ts.card(isDark)}`}
                >
                    {/* Header */}
                    <div className={`px-8 py-6 border-b flex items-center justify-between ${ts.border(isDark)}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <Building2 size={20} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Edit Institution Profile</h3>
                                <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>Manage your institution's public information</p>
                            </div>
                        </div>
                        <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)] p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Institution Name */}
                            <div className="md:col-span-2 space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Institution Name</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${isDark ? 'border-white/5 focus:bg-white/[0.05] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Official Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${isDark ? 'border-white/5 focus:bg-white/[0.05] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Contact Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${isDark ? 'border-white/5 focus:bg-white/[0.05] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Logo URL */}
                            <div className="md:col-span-2">
                                <ImageUpload
                                    label="Institution Logo"
                                    description="This logo will be displayed on the student dashboard, certificates, and reports. High-quality PNG or SVG with transparent background is recommended."
                                    value={formData.logo_url}
                                    onChange={url => setFormData({ ...formData, logo_url: url })}
                                    isDark={isDark}
                                />
                            </div>

                            {/* Website */}
                            <div className="md:col-span-2 space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Institution Website</label>
                                <div className="relative group">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="text"
                                        value={formData.website}
                                        placeholder="www.your-school.com"
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${isDark ? 'border-white/5 focus:bg-white/[0.05] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Full Address */}
                            <div className="md:col-span-2 space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Full Address</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${isDark ? 'border-white/5 focus:bg-white/[0.05] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* City */}
                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className={`w-full h-12 px-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${isDark ? 'border-white/5 focus:bg-white/[0.05] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                        }`}
                                />
                            </div>

                            {/* State */}
                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>State</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    className={`w-full h-12 px-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${isDark ? 'border-white/5 focus:bg-white/[0.05] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="mt-10 flex flex-col sm:flex-row gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className={`flex-1 rounded-2xl h-12 font-black text-[13px] ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className={`flex-[2] rounded-2xl h-12 font-black text-[13px] ${ts.btnPrimary(isDark)}`}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
