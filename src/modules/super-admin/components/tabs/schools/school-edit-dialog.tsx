import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { SchoolInfo, SchoolClass } from '../../../types';
import { useAdminTheme, t } from '../../../theme-context';

interface SchoolEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingSchool: Partial<SchoolInfo> | null;
    setEditingSchool: (s: Partial<SchoolInfo> | null) => void;
    classes: SchoolClass[];
    onSave: () => void;
}

export function SchoolEditDialog({
    open,
    onOpenChange,
    editingSchool,
    setEditingSchool,
    classes,
    onSave
}: SchoolEditDialogProps) {
    const { isDark, accent } = useAdminTheme();

    const handleToggleClass = (classId: string) => {
        if (!editingSchool) return;
        const currentIds = editingSchool.classIds || [];
        const newIds = currentIds.includes(classId)
            ? currentIds.filter((id: string) => id !== classId)
            : [...currentIds, classId];
        setEditingSchool({ ...editingSchool, classIds: newIds });
    };

    if (!editingSchool) return null;


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[540px] rounded-[24px] border overflow-y-auto max-h-[90vh] shadow-2xl p-6 ${t.card(isDark)}`}>
                <DialogHeader className="mb-4">
                    <DialogTitle className={`text-xl font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                        Edit School Details
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Update the details for the selected school.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>School Name</Label>
                            <Input value={editingSchool.name || ''} onChange={e => setEditingSchool({ ...editingSchool, name: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                        </div>
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Contact Email</Label>
                            <Input value={editingSchool.email || ''} onChange={e => setEditingSchool({ ...editingSchool, email: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Admin Name</Label>
                            <Input 
                                value={editingSchool.principal_name || ''} 
                                onChange={e => setEditingSchool({ ...editingSchool, principal_name: e.target.value })} 
                                placeholder="Principal/Admin Full Name"
                                className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Password</Label>
                            <Input 
                                type="password"
                                value={editingSchool.password || ''} 
                                onChange={e => setEditingSchool({ ...editingSchool, password: e.target.value })} 
                                placeholder={editingSchool.id ? '•••••••• (leave blank to keep)' : 'Set portal password'}
                                className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Phone</Label><Input value={editingSchool.phone || ''} onChange={e => setEditingSchool({ ...editingSchool, phone: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                        <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Website</Label><Input value={editingSchool.website || ''} onChange={e => setEditingSchool({ ...editingSchool, website: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                    </div>
                    <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Address</Label><Input value={editingSchool.address || ''} onChange={e => setEditingSchool({ ...editingSchool, address: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                    
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>City</Label><Input value={editingSchool.city || ''} onChange={e => setEditingSchool({ ...editingSchool, city: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                        <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>State</Label><Input value={editingSchool.state || ''} onChange={e => setEditingSchool({ ...editingSchool, state: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                        <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Pincode</Label><Input value={editingSchool.pincode || ''} onChange={e => setEditingSchool({ ...editingSchool, pincode: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Country</Label><Input value={editingSchool.country || 'IN'} onChange={e => setEditingSchool({ ...editingSchool, country: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                        <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Logo URL</Label><Input value={editingSchool.logo_url || ''} onChange={e => setEditingSchool({ ...editingSchool, logo_url: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className={`flex flex-row items-center justify-between rounded-xl border p-3.5 shadow-sm ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}><Label className={`text-xs font-bold leading-normal ${t.textSecondary(isDark)}`}>Data Processing Consent</Label><Switch checked={editingSchool.data_processing_consent || false} onCheckedChange={v => setEditingSchool({ ...editingSchool, data_processing_consent: v })} className={`data-[state=checked]:${accent.bg}`} /></div>
                        <div className={`flex flex-row items-center justify-between rounded-xl border p-3.5 shadow-sm ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}><Label className={`text-xs font-bold leading-normal ${t.textSecondary(isDark)}`}>Guardian Consent</Label><Switch checked={editingSchool.minor_data_guardian_consent || false} onCheckedChange={v => setEditingSchool({ ...editingSchool, minor_data_guardian_consent: v })} className={`data-[state=checked]:${accent.bg}`} /></div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Offered Classes</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const allIds = classes.map(g => g.id);
                                    const currentIds = editingSchool.classIds || [];
                                    const newIds = currentIds.length === allIds.length ? [] : allIds;
                                    setEditingSchool({ ...editingSchool, classIds: newIds });
                                }}
                                className={`h-7 px-3 rounded-full text-[10px] font-black border-2 ${t.btnOutline(isDark)}`}
                            >
                                {(editingSchool.classIds?.length || 0) === classes.length ? 'DESELECT ALL' : 'SELECT ALL'}
                            </Button>
                        </div>
                        <div className={`p-4 rounded-[24px] border-2 flex flex-wrap gap-2 ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                            {classes.map(cls => {
                                const isSelected = (editingSchool.classIds || []).includes(cls.id);
                                return (
                                    <button
                                        key={cls.id}
                                        type="button"
                                        onClick={() => handleToggleClass(cls.id)}
                                        className={`px-4 py-2 rounded-full text-[11px] font-black tracking-tight transition-all border-2
                                            ${isSelected
                                                ? (isDark ? `${accent.bg} text-slate-900 border-white shadow-lg` : `${accent.bg} text-slate-900 border-slate-900 shadow-lg`)
                                                : (isDark ? 'bg-white/[0.05] text-slate-400 border-white/10 hover:bg-white/10 hover:text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')}`}
                                    >
                                        Class {cls.name}
                                    </button>
                                );
                            })}
                        </div>
                        <p className={`text-[10px] font-bold ${t.textMuted(isDark)} px-1`}>
                            Select the classes supported by this institution. This governs the available options for student registration.
                        </p>
                    </div>
                </div>

                <DialogFooter className={`pt-6 border-t mt-6 ${t.border(isDark)}`}>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className={`rounded-full h-11 px-7 font-bold text-sm bg-transparent ${isDark ? 'hover:bg-white/10 text-white hover:text-white' : 'hover:bg-slate-200 text-slate-700'}`}>Cancel</Button>
                    <Button type="button" className={`rounded-full h-11 px-9 font-black text-sm shadow-xl transition-all border-0 ${t.btnPrimary(isDark, accent)}`} style={t.glowStyle(isDark, accent)} onClick={onSave}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
