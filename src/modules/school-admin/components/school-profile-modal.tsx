'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Mail, Phone, MapPin, Globe, Save, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSchoolTheme, ts } from '../theme-context';
import { toast } from 'sonner';
import { updateSchoolProfile } from '../actions';

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
    const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '',
        city: '', state: '', pincode: '', country: '', udise_code: '', logo_url: '', website: '',
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (formErrors[field]) {
            const newErrors = { ...formErrors };
            delete newErrors[field];
            setFormErrors(newErrors);
        }
    };

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
                country: profile.country || '',
                udise_code: profile.udise_code || '',
                logo_url: profile.logo_url || '',
                website: profile.website || '',
            });
        }
    }, [profile, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormErrors({});

        try {
            const changedFields: any = {};
            Object.keys(formData).forEach(key => {
                const val = (formData as any)[key];
                const originalVal = (profile as any)[key] ?? '';
                if (val !== originalVal) {
                    changedFields[key] = val;
                }
            });

            if (Object.keys(changedFields).length > 0) {
                const res = await updateSchoolProfile(schoolId, changedFields);
                
                if (res.success) {
                    toast.success('Institution profile updated successfully');
                    onUpdate();
                    onClose();
                } else if (res.details) {
                    setFormErrors(res.details);
                    toast.error('Please check the highlighted fields');
                } else {
                    toast.error(res.error || 'Failed to update profile');
                }
            } else {
                toast.info('No changes detected');
                onClose();
            }
        } catch (err) {
            toast.error('Connection error: Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const ErrorMessage = ({ field }: { field: string }) => {
        if (!formErrors[field]) return null;
        return (
            <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-bold text-rose-500 mt-1.5 ml-1 flex items-center gap-1.5"
            >
                <Sparkles size={10} className="animate-pulse" />
                {formErrors[field][0]}
            </motion.p>
        );
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
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="school-profile-title"
                    className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[32px] border shadow-2xl ${ts.card(isDark)}`}
                >
                    {/* Header */}
                    <div className={`px-8 py-6 border-b flex items-center justify-between ${ts.border(isDark)}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <Building2 size={20} />
                            </div>
                            <div>
                                <h3 id="school-profile-title" className={`text-xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Edit Institution Profile</h3>
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
                                        name="name"
                                        value={formData.name}
                                        onChange={e => handleInputChange('name', e.target.value)}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${
                                            formErrors.name 
                                                ? 'border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10' 
                                                : isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                        }`}
                                    />
                                </div>
                                <ErrorMessage field="name" />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Official Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="email"
                                        required
                                        name="email"
                                        value={formData.email}
                                        onChange={e => handleInputChange('email', e.target.value)}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${
                                            formErrors.email 
                                                ? 'border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10' 
                                                : isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                        }`}
                                    />
                                </div>
                                <ErrorMessage field="email" />
                            </div>

                            {/* UDISE Code */}
                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>UDISE Code</label>
                                <div className="relative group">
                                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="text"
                                        name="udise_code"
                                        placeholder="11-digit UDISE Code"
                                        value={formData.udise_code}
                                        onChange={e => handleInputChange('udise_code', e.target.value)}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${
                                            formErrors.udise_code 
                                                ? 'border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10' 
                                                : isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                        }`}
                                    />
                                </div>
                                <ErrorMessage field="udise_code" />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Contact Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="text"
                                        name="phone"
                                        placeholder="10-digit mobile number"
                                        value={formData.phone}
                                        onChange={e => handleInputChange('phone', e.target.value)}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${
                                            formErrors.phone 
                                                ? 'border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10' 
                                                : isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                        }`}
                                    />
                                </div>
                                <ErrorMessage field="phone" />
                            </div>

                            {/* Logo URL - Read Only for School Admins */}
                            <div className="md:col-span-2 space-y-3">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Institution Logo</label>
                                <div className={`p-6 rounded-3xl border-2 border-dashed flex items-center gap-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
                                    {formData.logo_url ? (
                                        <div className="w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center shadow-sm overflow-hidden border border-slate-100">
                                            <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                                            <Building2 size={32} />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            <p className={`text-xs font-black uppercase tracking-wider ${ts.textPrimary(isDark)}`}>Read-Only Mode</p>
                                        </div>
                                        <p className={`text-[10px] font-bold leading-relaxed ${ts.textMuted(isDark)}`}>
                                            School logos are managed strictly by the Super Administrator. 
                                            Contact support if you need to update your branding.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Website */}
                            <div className="md:col-span-2 space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Institution Website</label>
                                <div className="relative group">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="text"
                                        name="website"
                                        value={formData.website}
                                        placeholder="www.your-school.com"
                                        onChange={e => handleInputChange('website', e.target.value)}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${
                                            formErrors.website 
                                                ? 'border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10' 
                                                : isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                        }`}
                                    />
                                </div>
                                <ErrorMessage field="website" />
                            </div>

                            {/* Full Address */}
                            <div className="md:col-span-2 space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Full Address</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={e => handleInputChange('address', e.target.value)}
                                        className={`w-full h-12 pl-12 pr-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${
                                            formErrors.address 
                                                ? 'border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10' 
                                                : isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                        }`}
                                    />
                                </div>
                                <ErrorMessage field="address" />
                            </div>

                            {/* City */}
                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={e => handleInputChange('city', e.target.value)}
                                    className={`w-full h-12 px-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${
                                        formErrors.city 
                                            ? 'border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10' 
                                            : isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                    }`}
                                />
                                <ErrorMessage field="city" />
                            </div>

                            {/* State */}
                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={e => handleInputChange('state', e.target.value)}
                                    className={`w-full h-12 px-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${
                                        formErrors.state 
                                            ? 'border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10' 
                                            : isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                    }`}
                                />
                                <ErrorMessage field="state" />
                            </div>

                            {/* Pincode & Country */}
                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Pincode / Zip</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    placeholder="6-digit Pincode"
                                    value={formData.pincode}
                                    onChange={e => handleInputChange('pincode', e.target.value)}
                                    className={`w-full h-12 px-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${
                                        formErrors.pincode 
                                            ? 'border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10' 
                                            : isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                    }`}
                                />
                                <ErrorMessage field="pincode" />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${ts.textMuted(isDark)}`}>Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={e => handleInputChange('country', e.target.value)}
                                    className={`w-full h-12 px-4 rounded-2xl border bg-transparent text-sm font-bold outline-none transition-all placeholder:text-slate-500 focus:ring-4 focus:ring-indigo-500/10 ${ts.textPrimary(isDark)} ${
                                        formErrors.country 
                                            ? 'border-rose-500/50 bg-rose-500/5 focus:ring-rose-500/10' 
                                            : isDark ? 'border-white/10 bg-white/5 focus:bg-white/[0.08] focus:border-indigo-500/50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'
                                    }`}
                                />
                                <ErrorMessage field="country" />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="mt-10 flex flex-col sm:flex-row gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className={`flex-1 rounded-2xl h-12 font-black text-[13px] border ${isDark ? 'border-white/10 text-slate-100 hover:bg-white/5' : 'border-slate-200 text-slate-800 hover:bg-slate-100'}`}
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
