'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Building2, CheckCircle2, CreditCard, IndianRupee, Edit, Mail, MapPin, ArrowUpRight } from 'lucide-react';
import { Stats, SchoolInfo, PaymentPlan } from '../../types';
import { useAdminTheme, t } from '../../theme-context';

interface SchoolsTabProps {
    stats: Stats;
    schoolsList: SchoolInfo[];
    paymentPlans?: PaymentPlan[];
    onToggleStatus: (schoolId: string, isActive: boolean) => void;
    onSaveSchool: (data: Partial<SchoolInfo>) => void;
    onAssignPlan?: (schoolId: string, planId: string) => void;
    showEditDialog: boolean;
    setShowEditDialog: (v: boolean) => void;
    editingSchool: Partial<SchoolInfo> | null;
    setEditingSchool: (s: Partial<SchoolInfo> | null) => void;
    searchQuery?: string;
    classes: any[];
}

export function SchoolsTab({
    stats, schoolsList, paymentPlans = [], onToggleStatus, onSaveSchool, onAssignPlan,
    showEditDialog, setShowEditDialog, editingSchool, setEditingSchool, searchQuery = '',
    classes
}: SchoolsTabProps) {
    const { isDark, accent } = useAdminTheme();
    const [assignSchoolId, setAssignSchoolId] = useState<string | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');

    const filteredSchools = searchQuery
        ? schoolsList.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.city || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : schoolsList;

    function openEdit(school: SchoolInfo) { setEditingSchool({ ...school }); setShowEditDialog(true); }
    function handleSave() { if (editingSchool) { onSaveSchool(editingSchool); } }

    function handleAssignPlan() {
        if (assignSchoolId && selectedPlanId && onAssignPlan) {
            onAssignPlan(assignSchoolId, selectedPlanId);
            setAssignSchoolId(null);
            setSelectedPlanId('');
        }
    }

    const handleToggleClass = (classId: string) => {
        if (!editingSchool) return;
        const currentIds = (editingSchool as any).classIds || [];
        const newIds = currentIds.includes(classId)
            ? currentIds.filter((id: string) => id !== classId)
            : [...currentIds, classId];
        setEditingSchool({ ...editingSchool, classIds: newIds } as any);
    };

    return (
        <div className="space-y-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { value: stats.activeSchools.toString(), label: 'Active Schools', icon: Building2, badge: `of ${stats.totalSchools}`, theme: 'accent' },
                    { value: stats.activeSubscriptions.toString(), label: 'Subscriptions', icon: CheckCircle2, badge: 'active', theme: 'accent' },
                    { value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, label: 'Total Revenue', icon: IndianRupee, badge: 'all-time', theme: 'accent' },
                ].map((item, i) => {
                    const activeTheme = isDark ? accent.softDark : accent.softLight;
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className={`rounded-[24px] border p-6 transition-all duration-300 shadow-lg shadow-black/5 flex flex-col justify-between group ${t.card(isDark)} ${t.cardHover(isDark)} ${t.cardHoverAccent(isDark, accent)}`}>
                            <div className="flex justify-between items-start mb-4">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>{item.label}</p>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${activeTheme}`}>
                                    <item.icon size={14} />
                                </div>
                            </div>
                            <div>
                                <p className={`text-3xl font-[900] tracking-tighter ${t.textPrimary(isDark)}`}>{item.value}</p>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black mt-3 px-2.5 py-1 rounded-full ${t.accentBadge(isDark, accent)}`}>
                                    <ArrowUpRight size={10} />{item.badge}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* School List */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                className={`rounded-[24px] border overflow-hidden transition-all duration-300 shadow-xl shadow-black/5 ${t.card(isDark)}`}>
                <div className={`px-6 py-5 border-b ${t.border(isDark)} flex items-center justify-between`}>
                    <div>
                        <h3 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>School Directory</h3>
                        <p className={`text-[12px] font-medium ${t.textMuted(isDark)}`}>Manage all registered schools and partner organizations.</p>
                    </div>
                    <Badge className={`text-[10px] font-black px-3 py-1 rounded-full ${isDark ? 'bg-white/[0.08] text-white' : 'bg-slate-900 text-white'}`}>
                        {filteredSchools.length}{searchQuery ? ` of ${schoolsList.length}` : ''} TOTAL
                    </Badge>
                </div>
                <div className={t.divider(isDark)}>
                    {filteredSchools.map((school, i) => (
                        <motion.div key={school.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.04 }}
                            className={`px-6 py-4 flex items-center gap-4 transition-all group ${t.cardHover(isDark)}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[14px] font-black flex-shrink-0
                                ${t.initialCircle(isDark, accent)}`}>
                                {school.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-black text-sm tracking-tight ${t.textPrimary(isDark)}`}>{school.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${t.textMuted(isDark)}`}><Mail size={10} />{school.email}</span>
                                    {school.city && <span className={`text-[10px] font-bold flex items-center gap-1 ${t.textMuted(isDark)}`}><MapPin size={10} />{school.city}</span>}
                                </div>
                            </div>
                            <div className="hidden lg:flex flex-col items-end mr-2">
                                <p className={`text-[10px] font-black tracking-widest uppercase mb-1 ${t.textMuted(isDark)}`}>Students</p>
                                <p className={`text-[12px] font-black ${t.textSecondary(isDark)}`}>{(school.student_count || 0).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className={`text-[9px] font-black px-2 py-0.5 rounded-md ${school.plan_name ? t.accentSoft(isDark, accent) : (isDark ? 'bg-white/[0.04] text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
                                    {school.plan_name ? school.plan_name.toUpperCase() : 'NO PLAN'}
                                </Badge>
                                <Badge className={`text-[9px] font-black px-2 py-0.5 rounded-md ${school.is_active ? t.live(isDark) : t.danger(isDark)}`}>
                                    {school.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Assign Plan */}
                                {paymentPlans.length > 0 && onAssignPlan && (
                                    <Popover open={assignSchoolId === school.id} onOpenChange={(open) => {
                                        if (open) { setAssignSchoolId(school.id); setSelectedPlanId(school.plan_name ? (paymentPlans.find(p => p.name === school.plan_name)?.id || '') : ''); }
                                        else { setAssignSchoolId(null); }
                                    }}>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="sm" className={`rounded-full h-7 px-3 text-[9px] font-black opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'text-sky-400 hover:bg-sky-400/10 hover:text-sky-400' : 'text-sky-600 hover:bg-sky-50'}`}>
                                                <CreditCard size={11} className="mr-1" />PLAN
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className={`w-72 rounded-2xl p-4 shadow-2xl border ${isDark ? 'bg-[#0f1219] border-white/10' : 'bg-white border-slate-200'}`} side="left">
                                            <p className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark ? accent.text : 'text-slate-900'}`}>Assign Subscription Plan</p>
                                            <p className={`text-[11px] font-medium mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                For: <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{school.name}</span>
                                            </p>
                                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                                <SelectTrigger className={`rounded-full h-10 px-4 text-[12px] font-bold border-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                                    <SelectValue placeholder="Choose a plan..." />
                                                </SelectTrigger>
                                                <SelectContent className={`rounded-2xl border ${isDark ? 'bg-[#0f1219] border-white/10' : 'bg-white border-slate-200'}`}>
                                                    {paymentPlans.map(p => (
                                                        <SelectItem key={p.id} value={p.id} className="text-[12px] font-bold cursor-pointer">
                                                            {p.name}  ₹{p.price.toLocaleString()}/{p.billing_cycle}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={handleAssignPlan} disabled={!selectedPlanId}
                                                className={`mt-3 w-full rounded-full h-9 text-[11px] font-black border-0 disabled:opacity-40 ${t.btnPrimary(isDark, accent)}`}>
                                                Assign Plan
                                            </Button>
                                        </PopoverContent>
                                    </Popover>
                                )}

                                <Button variant="ghost" size="icon" className={`w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-all ${isDark ? `text-slate-500 ${accent.hoverText} hover:bg-white/[0.06]` : 'text-slate-300 hover:text-slate-800 hover:bg-slate-100'}`}
                                    onClick={() => openEdit(school)}>
                                    <Edit size={14} />
                                </Button>
                                <Switch checked={school.is_active} onCheckedChange={(val) => onToggleStatus(school.id, val)} className={`data-[state=checked]:${accent.bg}`} />
                            </div>
                        </motion.div>
                    ))}
                    {filteredSchools.length === 0 && (
                        <div className="py-14 text-center">
                            <Building2 size={28} className={`mx-auto mb-2 ${t.textMuted(isDark)}`} />
                            <p className={`text-[11px] ${t.textMuted(isDark)}`}>
                                {searchQuery ? `No schools match "${searchQuery}"` : 'No schools registered'}
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className={`sm:max-w-[540px] rounded-[24px] border overflow-y-auto max-h-[90vh] shadow-2xl p-6 ${t.card(isDark)}`}>
                    <DialogHeader className="mb-4">
                        <DialogTitle className={`text-xl font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                            {editingSchool?.id ? 'Edit School Details' : 'Register New School'}
                        </DialogTitle>
                    </DialogHeader>
                    {editingSchool && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Name</Label><Input value={editingSchool.name} onChange={e => setEditingSchool({ ...editingSchool, name: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 focus-visible:border-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                                <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Email</Label><Input value={editingSchool.email} onChange={e => setEditingSchool({ ...editingSchool, email: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 focus-visible:border-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Phone</Label><Input value={editingSchool.phone || ''} onChange={e => setEditingSchool({ ...editingSchool, phone: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 focus-visible:border-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                                <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Website</Label><Input value={editingSchool.website || ''} onChange={e => setEditingSchool({ ...editingSchool, website: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 focus-visible:border-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                            </div>
                            <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Address</Label><Input value={editingSchool.address || ''} onChange={e => setEditingSchool({ ...editingSchool, address: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 focus-visible:border-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>City</Label><Input value={editingSchool.city || ''} onChange={e => setEditingSchool({ ...editingSchool, city: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 focus-visible:border-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                                <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>State</Label><Input value={editingSchool.state || ''} onChange={e => setEditingSchool({ ...editingSchool, state: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 focus-visible:border-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                                <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Pincode</Label><Input value={editingSchool.pincode || ''} onChange={e => setEditingSchool({ ...editingSchool, pincode: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 focus-visible:border-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Country</Label><Input value={editingSchool.country || 'IN'} onChange={e => setEditingSchool({ ...editingSchool, country: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 focus-visible:border-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                                <div className="space-y-2"><Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Logo URL</Label><Input value={editingSchool.logo_url || ''} onChange={e => setEditingSchool({ ...editingSchool, logo_url: e.target.value })} className={`rounded-full px-5 h-11 font-bold border-2 focus-visible:ring-${accent.name}-400/50 focus-visible:border-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className={`flex flex-row items-center justify-between rounded-xl border p-3.5 shadow-sm ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}><Label className={`text-xs font-bold leading-normal ${t.textSecondary(isDark)}`}>Data Processing Consent</Label><Switch checked={editingSchool.data_processing_consent} onCheckedChange={v => setEditingSchool({ ...editingSchool, data_processing_consent: v })} className={`data-[state=checked]:${accent.bg}`} /></div>
                                <div className={`flex flex-row items-center justify-between rounded-xl border p-3.5 shadow-sm ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}><Label className={`text-xs font-bold leading-normal ${t.textSecondary(isDark)}`}>Guardian Consent</Label><Switch checked={editingSchool.minor_data_guardian_consent} onCheckedChange={v => setEditingSchool({ ...editingSchool, minor_data_guardian_consent: v })} className={`data-[state=checked]:${accent.bg}`} /></div>
                                <div className={`flex flex-row items-center justify-between rounded-xl border p-3.5 shadow-sm ${(editingSchool.is_active ?? true) ? (isDark ? `border-${accent.name}-400/30 ${accent.softDark.split(' ')[0].replace('/10', '/5')}` : `border-${accent.name}-300/50 ${accent.softLight.split(' ')[0]}`) : (isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50')}`}><Label className={`text-xs font-bold leading-normal ${((editingSchool.is_active ?? true) && isDark) ? accent.text : t.textPrimary(isDark)}`}>Account Status</Label><Switch checked={editingSchool.is_active} onCheckedChange={v => setEditingSchool({ ...editingSchool, is_active: v })} className={`data-[state=checked]:${accent.bg}`} /></div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Offered Classes</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const allIds = classes.map(g => g.id);
                                            const currentIds = (editingSchool as any).classIds || [];
                                            const newIds = currentIds.length === allIds.length ? [] : allIds;
                                            setEditingSchool({ ...editingSchool, classIds: newIds } as any);
                                        }}
                                        className={`h-7 px-3 rounded-full text-[10px] font-black border-2 ${t.btnOutline(isDark)}`}
                                    >
                                        {((editingSchool as any).classIds?.length || 0) === classes.length ? 'DESELECT ALL' : 'SELECT ALL'}
                                    </Button>
                                </div>
                                <div className={`p-4 rounded-[24px] border-2 flex flex-wrap gap-2 ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                                    {classes.map(cls => {
                                        const isSelected = ((editingSchool as any).classIds || []).includes(cls.id);
                                        return (
                                            <button
                                                key={cls.id}
                                                type="button"
                                                onClick={() => handleToggleClass(cls.id)}
                                                className={`px-4 py-2 rounded-full text-[11px] font-black tracking-tight transition-all border-2
                                                    ${isSelected
                                                        ? (isDark ? `${accent.bg} text-slate-900 border-${accent.name}-400 shadow-lg` : `${accent.bg} text-slate-900 border-${accent.name}-400 shadow-lg`)
                                                        : (isDark ? 'bg-transparent text-slate-400 border-white/10 hover:bg-white/5' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')}`}
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
                    )}
                    <DialogFooter className={`pt-6 border-t mt-6 ${t.border(isDark)}`}>
                        <Button variant="ghost" onClick={() => setShowEditDialog(false)} className={`rounded-full h-11 px-7 font-bold text-sm bg-transparent ${isDark ? 'hover:bg-white/10 text-white hover:text-white' : 'hover:bg-slate-200 text-slate-700'}`}>Cancel</Button>
                        <Button className={`rounded-full h-11 px-9 font-black text-sm shadow-xl transition-all border-0 ${t.btnPrimary(isDark, accent)}`} style={t.glowStyle(isDark, accent)} onClick={handleSave}>
                            {editingSchool?.id ? 'Save Changes' : 'Register School'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
