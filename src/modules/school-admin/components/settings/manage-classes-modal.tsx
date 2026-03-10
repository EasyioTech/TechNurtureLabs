'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolTheme, ts } from '../../theme-context';
import { toast } from 'sonner';
import { updateSchoolClasses } from '../../actions';

interface ManageClassesModalProps {
    schoolId: string;
    currentClasses: { id: string; name: string }[];
    globalClasses: { id: string; name: string; level: number }[];
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function ManageClassesModal({ schoolId, currentClasses, globalClasses, isOpen, onClose, onUpdate }: ManageClassesModalProps) {
    const { isDark } = useSchoolTheme();
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(currentClasses.map(c => c.id));
        }
    }, [currentClasses, isOpen]);

    const toggleClass = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await updateSchoolClasses(schoolId, selectedIds);
            if (res.success) {
                toast.success(res.message);
                onUpdate();
                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error('Failed to update school classes');
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
                    className={`relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-[32px] border shadow-2xl ${ts.card(isDark)}`}
                >
                    <div className={`px-8 py-6 border-b flex items-center justify-between ${ts.border(isDark)}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <GraduationCap size={20} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-black tracking-tight ${ts.textPrimary(isDark)}`}>Manage Academic Classes</h3>
                                <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>Select the classes provided by your institution</p>
                            </div>
                        </div>
                        <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)]">
                        <div className={`p-4 rounded-2xl mb-6 flex gap-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/20 text-amber-500' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p className="text-[12px] font-bold leading-relaxed">
                                Updating these classes will affect student registration and filtering. Removing a class will not delete students but they may lose their class context.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {globalClasses.map(cls => {
                                const isSelected = selectedIds.includes(cls.id);
                                return (
                                    <button
                                        key={cls.id}
                                        onClick={() => toggleClass(cls.id)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isSelected
                                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 shadow-lg shadow-indigo-500/5'
                                            : `${ts.border(isDark)} ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} ${ts.textPrimary(isDark)}`
                                            }`}
                                    >
                                        <span className="text-[13px] font-black">{cls.name}</span>
                                        {isSelected && <CheckCircle2 size={16} />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-10 flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className={`flex-1 rounded-2xl h-12 font-black text-[13px] border ${isDark ? 'border-white/10 text-slate-100 hover:bg-white/5' : 'border-slate-200 text-slate-800 hover:bg-slate-100'}`}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className={`flex-[2] rounded-2xl h-12 font-black text-[13px] ${ts.btnPrimary(isDark)}`}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                                Save Selection
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
