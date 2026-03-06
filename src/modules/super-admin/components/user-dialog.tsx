'use client';

import React from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { UserMetric, SchoolInfo } from '../types';
import { useAdminTheme, t } from '../theme-context';
import { User, Mail, Building2, GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingUser: Partial<any> | null;
    setEditingUser: (user: Partial<any> | null) => void;
    onSave: () => void;
    schools: SchoolInfo[];
    classes: any[];
}

export function UserDialog({
    open, onOpenChange, editingUser, setEditingUser, onSave, schools, classes
}: UserDialogProps) {
    const { isDark, accent } = useAdminTheme();
    const [showPassword, setShowPassword] = React.useState(false);

    // Filter grades based on selected school if needed, but currently grades are global
    // Actually, in fetchAllAdminData, grades are global. 
    // Usually schools and grades have a mapping, but let's stick to global grades for now 
    // unless we have school-specific grade mapping data available here.

    const isEditing = !!editingUser?.id;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[480px] rounded-[24px] border-0 shadow-2xl p-0 overflow-hidden ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>

                {/* Header */}
                <div className={`px-6 py-6 border-b ${t.border(isDark)}`}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accent.bg} text-slate-900`}>
                                <User size={20} />
                            </div>
                            <div className="text-left">
                                <h2 className={`text-xl font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                                    {isEditing ? 'Update Student' : 'New Student'}
                                </h2>
                                <p className={`text-[11px] font-bold uppercase tracking-widest mt-0.5 ${t.textMuted(isDark)}`}>
                                    {isEditing ? 'Modify student profile' : 'Create a new student account'}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className={`px-6 py-6 space-y-5 max-h-[60vh] overflow-y-auto ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>First Name *</Label>
                            <Input
                                placeholder="John"
                                value={editingUser?.first_name || ''}
                                onChange={e => setEditingUser({ ...editingUser, first_name: e.target.value })}
                                className={`rounded-full h-11 px-5 font-bold border-2 focus-visible:ring-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Last Name *</Label>
                            <Input
                                placeholder="Doe"
                                value={editingUser?.last_name || ''}
                                onChange={e => setEditingUser({ ...editingUser, last_name: e.target.value })}
                                className={`rounded-full h-11 px-5 font-bold border-2 focus-visible:ring-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Email Address *</Label>
                        <div className="relative">
                            <Input
                                type="email"
                                placeholder="student@school.com"
                                value={editingUser?.email || ''}
                                onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                className={`rounded-full h-11 pl-11 pr-5 font-bold border-2 focus-visible:ring-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                            />
                            <Mail size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Password *</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={editingUser?.password || ''}
                                    onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                    className={`rounded-full h-11 px-5 pr-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-600 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Assigned Institution *</Label>
                        <Select
                            value={editingUser?.school_id || ''}
                            onValueChange={val => setEditingUser({ ...editingUser, school_id: val })}
                        >
                            <SelectTrigger className={`rounded-full h-11 px-5 font-bold border-2 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}>
                                <SelectValue placeholder="Select School" />
                            </SelectTrigger>
                            <SelectContent className={`rounded-2xl border ${isDark ? 'bg-[#0f1219] border-white/10' : 'bg-white border-slate-200'}`}>
                                {schools.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="font-bold text-sm">{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Assigned Class *</Label>
                        <Select
                            value={editingUser?.class_id || ''}
                            onValueChange={val => setEditingUser({ ...editingUser, class_id: val })}
                        >
                            <SelectTrigger className={`rounded-full h-11 px-5 font-bold border-2 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}>
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent className={`rounded-2xl border ${isDark ? 'bg-[#0f1219] border-white/10' : 'bg-white border-slate-200'}`}>
                                {classes.map(g => (
                                    <SelectItem key={g.id} value={g.id} className="font-bold text-sm">{g.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-6 py-5 border-t flex justify-end gap-3 ${isDark ? 'border-white/10 bg-[#0f1219]' : 'border-slate-100 bg-slate-50'}`}>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}
                        className={`rounded-full h-11 px-6 font-bold text-sm bg-transparent ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200'}`}>
                        Cancel
                    </Button>
                    <Button onClick={onSave} disabled={!editingUser?.email || !editingUser?.school_id || !editingUser?.class_id || !editingUser?.first_name || !editingUser?.last_name || (!isEditing && !editingUser?.password)}
                        className={`rounded-full h-11 px-8 font-black text-sm shadow-xl transition-all border-0 ${t.btnPrimary(isDark, accent)}`}>
                        {isEditing ? 'Save Changes' : 'Create Student'}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
