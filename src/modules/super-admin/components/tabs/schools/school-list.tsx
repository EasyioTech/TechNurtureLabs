import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
    Building2, CheckCircle2, CreditCard, Edit, Mail, MapPin, 
    Plus, Users, Loader2 
} from 'lucide-react';
import { SchoolInfo, PaymentPlan } from '../../../types';
import { useAdminTheme, t } from '../../../theme-context';

interface SchoolListProps {
    schools: SchoolInfo[];
    paymentPlans: PaymentPlan[];
    onToggleStatus: (schoolId: string, isActive: boolean) => void;
    onEdit: (school: SchoolInfo) => void;
    onRegister: () => void;
    onAssignPlan: (schoolId: string, planId: string) => void;
    page: number;
    searchQuery: string;
    hasMore: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
}

export function SchoolList({
    schools,
    paymentPlans,
    onToggleStatus,
    onEdit,
    onRegister,
    onAssignPlan,
    page,
    searchQuery,
    hasMore,
    loadingMore,
    onLoadMore
}: SchoolListProps) {
    const { isDark, accent } = useAdminTheme();
    const [assignSchoolId, setAssignSchoolId] = useState<string | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');

    // Intersection Observer for Infinite Scroll
    const observer = React.useRef<IntersectionObserver | null>(null);
    const lastElementRef = React.useCallback((node: HTMLDivElement | null) => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && onLoadMore) {
                onLoadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore, onLoadMore]);

    function handleAssignPlan() {
        if (assignSchoolId && selectedPlanId) {
            onAssignPlan(assignSchoolId, selectedPlanId);
            setAssignSchoolId(null);
            setSelectedPlanId('');
        }
    }

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className={`rounded-[24px] border overflow-hidden transition-all duration-300 shadow-xl shadow-black/5 ${t.card(isDark)}`}>
            <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b ${t.border(isDark)} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div>
                    <h3 className={`text-lg font-black tracking-tight ${t.textPrimary(isDark)}`}>School Directory</h3>
                    <p className={`text-[11px] sm:text-[12px] font-medium ${t.textMuted(isDark)}`}>Manage all registered schools and partner organizations.</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Button type="button" size="sm"
                        onClick={onRegister}
                        className={`rounded-xl gap-2 h-9 px-4 text-[10px] font-black shadow-lg transition-all
                            ${isDark ? '' : 'shadow-black/5'} ${t.btnPrimary(isDark, accent)}`}
                        style={isDark ? t.glowStyle(isDark, accent) : {}}>
                        <Plus size={14} strokeWidth={3} /> REGISTER SCHOOL
                    </Button>
                    <Badge className={`text-[10px] font-black px-3 py-1 rounded-full ${isDark ? 'bg-white/[0.12] text-white shadow-lg shadow-black/20' : 'bg-slate-900 text-white shadow-md shadow-slate-200'}`}>
                        PAGE {page + 1}
                    </Badge>
                </div>
            </div>
            <div className={t.divider(isDark)}>
                {schools.map((school, i) => (
                    <motion.div key={school.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.04 }}
                        className={`px-4 sm:px-6 py-4 flex items-start sm:items-center gap-3 sm:gap-4 transition-all group ${t.cardHover(isDark)}`}>
                        
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 mt-1 sm:mt-0">
                            {school.logo_url ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <img src={school.logo_url} alt={school.name} className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <div className={`w-full h-full rounded-full flex items-center justify-center text-[12px] sm:text-[14px] font-black
                                    ${t.initialCircle(isDark, accent)}`}>
                                    {school.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3">
                                <p className={`font-black text-sm sm:text-base tracking-tight truncate ${t.textPrimary(isDark)}`}>{school.name}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Badge className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-md ${school.plan_name ? t.accentSoft(isDark, accent) : (isDark ? 'bg-white/[0.1] text-slate-400 border border-white/[0.05]' : 'bg-slate-100 text-slate-400 border border-slate-200')}`}>
                                        {school.plan_name ? school.plan_name.toUpperCase() : 'NO PLAN'}
                                    </Badge>
                                    <Badge className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-md border ${school.is_active ? t.live(isDark) : t.danger(isDark)}`}>
                                        {school.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1.5 mt-2 sm:mt-1.5">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <Mail size={10} className={`flex-shrink-0 ${t.textMuted(isDark)}`} />
                                    <span className={`text-[10px] sm:text-[11px] font-bold truncate ${t.textMuted(isDark)} mb-[-1px]`}>{school.email}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {school.city && (
                                        <div className="flex items-center gap-1">
                                            <MapPin size={10} className={`flex-shrink-0 ${t.textMuted(isDark)}`} />
                                            <span className={`text-[10px] sm:text-[11px] font-bold ${t.textMuted(isDark)}`}>{school.city}</span>
                                        </div>
                                    )}
                                    <div className="lg:hidden flex items-center gap-1">
                                        <Users size={10} className={`flex-shrink-0 ${t.textSecondary(isDark)}`} /> 
                                        <span className={`text-[10px] sm:text-[11px] font-black ${t.textSecondary(isDark)}`}>{(school.student_count || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:flex flex-col items-end min-w-[80px]">
                            <p className={`text-[9px] font-black tracking-widest uppercase mb-0.5 ${t.textMuted(isDark)}`}>Students</p>
                            <p className={`text-[11px] font-black ${t.textSecondary(isDark)}`}>{(school.student_count || 0).toLocaleString()}</p>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5 self-center sm:self-auto flex-shrink-0">
                            {paymentPlans.length > 0 && (
                                <Popover open={assignSchoolId === school.id} onOpenChange={(open) => {
                                    if (open) { 
                                        setAssignSchoolId(school.id); 
                                        setSelectedPlanId(school.plan_name ? (paymentPlans.find(p => p.name === school.plan_name)?.id || '') : ''); 
                                    }
                                    else { setAssignSchoolId(null); }
                                }}>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="ghost" size="sm" className={`rounded-lg h-7 sm:h-8 px-2 sm:px-3 text-[9px] font-black lg:opacity-0 lg:group-hover:opacity-100 transition-all ${isDark ? 'text-sky-400 hover:bg-sky-400/10 hover:text-sky-400' : 'text-sky-600 hover:bg-sky-50'}`}>
                                            <CreditCard size={11} className="sm:mr-1" /><span className="hidden sm:inline">PLAN</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className={`w-72 rounded-2xl p-4 shadow-2xl border ${isDark ? 'bg-[#0f1219] border-white/10' : 'bg-white border-slate-200'}`} side="left">
                                        <p className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark ? accent.text : 'text-slate-900'}`}>Assign Subscription Plan</p>
                                        <p className={`text-[11px] font-medium mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            For: <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{school.name}</span>
                                        </p>
                                        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                            <SelectTrigger className={`rounded-xl h-10 px-4 text-[12px] font-bold border-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                                <SelectValue placeholder="Choose a plan..." />
                                            </SelectTrigger>
                                            <SelectContent className={`rounded-xl border ${isDark ? 'bg-[#0f1219] border-white/10' : 'bg-white border-slate-200'}`}>
                                                {paymentPlans.map(p => (
                                                    <SelectItem key={p.id} value={p.id} className="text-[12px] font-bold cursor-pointer">
                                                        {p.name}   ₹{p.price.toLocaleString()}/{p.billing_cycle}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" onClick={handleAssignPlan} disabled={!selectedPlanId}
                                            className={`mt-4 w-full rounded-xl h-10 text-[11px] font-black border-0 disabled:opacity-40 ${t.btnPrimary(isDark, accent)}`}>
                                            Assign Plan
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                            )}

                            <Button type="button" variant="ghost" size="icon" className={`w-8 h-8 rounded-full lg:opacity-0 lg:group-hover:opacity-100 transition-all ${isDark ? `text-slate-500 ${accent.hoverText} hover:bg-white/[0.06]` : 'text-slate-300 hover:text-slate-800 hover:bg-slate-100'}`}
                                onClick={() => onEdit(school)}>
                                <Edit size={14} />
                            </Button>
                            <div className="scale-75 sm:scale-90 origin-right">
                                <Switch checked={school.is_active} onCheckedChange={(val) => onToggleStatus(school.id, val)} className={`data-[state=checked]:${accent.bg}`} />
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Loading indicator for Infinite Scroll */}
                <div ref={lastElementRef} className="py-8 flex flex-col items-center justify-center">
                    {loadingMore ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Fetching next institutions...</p>
                        </div>
                    ) : !hasMore && schools.length > 0 ? (
                        <div className="flex flex-col items-center gap-1 opacity-40">
                            <CheckCircle2 size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                            <p className={`text-[9px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>End of Directory</p>
                        </div>
                    ) : null}
                </div>

                {schools.length === 0 && !loadingMore && (
                    <div className="py-20 text-center">
                        <Building2 size={32} className={`mx-auto mb-4 opacity-20 ${t.textMuted(isDark)}`} />
                        <p className={`text-[12px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
                            {searchQuery ? `No matches for "${searchQuery}"` : 'No institutions found'}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
