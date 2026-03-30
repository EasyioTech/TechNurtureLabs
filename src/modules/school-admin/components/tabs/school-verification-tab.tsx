import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SchoolStudentMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { UserCheck, UserX, ShieldCheck, Mail, Building2, Calendar, Ghost, KeyRound, Check, X, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface VerificationTabProps {
    pendingStudents: SchoolStudentMetric[];
    onVerify: (id: string, verified: boolean) => void;
    pinRequests: any[];
    onPinReset: (requestId: string, action: 'approved' | 'rejected', newPin?: string) => void;
    loading?: boolean;
    pinLoading?: boolean;
}

export function SchoolVerificationTab({ 
    pendingStudents, onVerify, pinRequests, onPinReset, loading = false, pinLoading = false 
}: VerificationTabProps) {
    const { isDark } = useSchoolTheme();
    const [actioningPin, setActioningPin] = useState<string | null>(null);

    const handleApprovePin = (id: string) => {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        if (confirm(`Approve this reset request? A new PIN will be generated: ${pin}. Once approved, the PIN will be visible in the history below.`)) {
            setActioningPin(id);
            onPinReset(id, 'approved', pin);
        }
    };

    const handleRejectPin = (id: string) => {
        if (confirm('Reject this PIN reset request?')) {
            setActioningPin(id);
            onPinReset(id, 'rejected');
        }
    };

    // Separate pending and history
    const pendingPinRequests = pinRequests.filter(r => r.status === 'pending');
    const processedPinRequests = pinRequests.filter(r => r.status !== 'pending');

    return (
        <div className="space-y-6 sm:space-y-10">
            {/* 1. Registration Requests */}
            <div className={`rounded-2xl border overflow-hidden ${ts.card(isDark)} shadow-sm transition-all duration-300`}>
                
                {/* Header */}
                <div className={`px-5 py-5 border-b ${ts.border(isDark)} bg-gradient-to-br ${isDark ? 'from-indigo-500/5 to-transparent' : 'from-indigo-50/50 to-transparent'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h3 className={`font-black text-lg tracking-tight ${ts.textPrimary(isDark)}`}>Registration Requests</h3>
                                <p className={`text-[11px] font-bold ${ts.textMuted(isDark)}`}>New student approvals</p>
                            </div>
                        </div>
                        <Badge className={`w-fit px-3 py-1 rounded-lg border-0 text-[10px] font-black tracking-wider ${pendingStudents.length > 0 ? 'bg-rose-500 text-white' : ts.accentSoft(isDark)}`}>
                            {pendingStudents.length} PENDING
                        </Badge>
                    </div>
                </div>

                {/* List */}
                <div className="p-5">
                    {pendingStudents.length === 0 ? (
                        <div className="py-12 text-center">
                            <h4 className={`text-lg font-black mb-1 ${ts.textPrimary(isDark)}`}>All caught up!</h4>
                            <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>No students waiting for verification.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingStudents.map((student) => (
                                <div 
                                     key={student.id}
                                     className={`group rounded-2xl border p-4 transition-all duration-200 ${isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-md'}`}
                                 >
                                     <div className="flex flex-col h-full">
                                         <div className="flex items-center gap-3 mb-4">
                                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${isDark ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-600 text-white'}`}>
                                                 {student.full_name[0].toUpperCase()}
                                             </div>
                                             <div className="min-w-0">
                                                 <h4 className={`font-black text-sm tracking-tight truncate ${ts.textPrimary(isDark)}`}>{student.full_name}</h4>
                                                 <p className={`text-[10px] font-bold opacity-50 truncate ${ts.textPrimary(isDark)}`}>
                                                     {student.email || student.phone}
                                                 </p>
                                             </div>
                                         </div>

                                         <div className="grid grid-cols-2 gap-2 mb-4">
                                             <div className={`rounded-xl p-2.5 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                                                 <span className={`block text-[8px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Class</span>
                                                 <p className={`text-[11px] font-black tracking-tight truncate ${ts.textPrimary(isDark)}`}>{student.class_name || 'N/A'}</p>
                                             </div>
                                             <div className={`rounded-xl p-2.5 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                                                 <span className={`block text-[8px] font-black uppercase tracking-widest ${ts.textMuted(isDark)}`}>Joined</span>
                                                 <p className={`text-[11px] font-black tracking-tight truncate ${ts.textPrimary(isDark)}`}>
                                                     {student.last_active_at ? new Date(student.last_active_at).toLocaleDateString() : 'New'}
                                                 </p>
                                             </div>
                                         </div>

                                         <div className="mt-auto flex items-center gap-2">
                                             <Button 
                                                 onClick={() => onVerify(student.id, true)}
                                                 disabled={loading}
                                                 className={`flex-1 h-9 rounded-xl font-black text-[10px] uppercase tracking-widest ${ts.btnPrimary(isDark)}`}
                                             >
                                                 Verify
                                             </Button>
                                             <Button 
                                                 onClick={() => onVerify(student.id, false)}
                                                 disabled={loading}
                                                 variant="ghost"
                                                 className={`h-9 px-3 rounded-xl border transition-all hover:bg-rose-500/10 hover:text-rose-500 ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-100 text-slate-400'}`}
                                             >
                                                 <UserX size={14} />
                                             </Button>
                                         </div>
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. PIN Reset Requests */}
            <div className={`rounded-2xl border overflow-hidden ${ts.card(isDark)} shadow-sm`}>
                
                {/* Header */}
                <div className={`px-5 py-5 border-b ${ts.border(isDark)} bg-gradient-to-br ${isDark ? 'from-amber-500/5 to-transparent' : 'from-amber-50/50 to-transparent'}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                    <ShieldCheck size={20} strokeWidth={2.5} />
                                </div>
                                <h3 className={`font-black text-xl sm:text-2xl tracking-tight leading-none ${ts.textPrimary(isDark)}`}>PIN Reset Requests</h3>
                            </div>
                            <p className={`text-[12px] sm:text-[13px] font-bold ${ts.textMuted(isDark)}`}>
                                {loading ? 'Analyzing security logs...' : `Reviewing ${pendingPinRequests.length} pending authentication alerts`}
                            </p>
                        </div>
                        <Badge className={`w-fit px-3 py-1 rounded-lg border-0 text-[10px] font-black tracking-wider ${pendingPinRequests.length > 0 ? 'bg-amber-500 text-white shadow-md' : ts.accentSoft(isDark)}`}>
                            {pendingPinRequests.length} PENDING
                        </Badge>
                    </div>
                </div>

                {/* List */}
                <div className="p-5">
                    {pendingPinRequests.length === 0 ? (
                        <div className="py-12 text-center">
                            <h4 className={`text-lg font-black mb-1 ${ts.textPrimary(isDark)}`}>No Alerts</h4>
                            <p className={`text-[12px] font-bold ${ts.textMuted(isDark)}`}>Everything looks secure.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingPinRequests.map((req) => (
                                <div 
                                     key={req.id}
                                     className={`group rounded-2xl border p-4 transition-all duration-200 ${isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' : 'bg-amber-50/30 border-amber-100 hover:bg-white'}`}
                                 >
                                     <div className="flex flex-col h-full">
                                         <div className="flex items-center gap-3 mb-6">
                                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white border border-amber-100 text-amber-600'}`}>
                                                 {req.student.first_name[0]}{req.student.last_name[0]}
                                             </div>
                                             <div className="min-w-0">
                                                 <h4 className={`font-black text-sm tracking-tight truncate ${ts.textPrimary(isDark)}`}>
                                                     {req.student.first_name} {req.student.last_name}
                                                 </h4>
                                                 <p className={`text-[10px] font-bold opacity-50 truncate ${ts.textPrimary(isDark)}`}>
                                                     {req.student.email || req.student.phone}
                                                 </p>
                                             </div>
                                         </div>

                                         <div className="mt-auto flex items-center gap-2">
                                             <button 
                                                 onClick={() => handleApprovePin(req.id)}
                                                 disabled={pinLoading && actioningPin === req.id}
                                                 className={`flex-1 h-9 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isDark ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-md' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                                             >
                                                 {pinLoading && actioningPin === req.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2"><Check size={14} /> Approve</span>}
                                             </button>
                                             <Button 
                                                 onClick={() => handleRejectPin(req.id)}
                                                 disabled={pinLoading && actioningPin === req.id}
                                                 variant="ghost"
                                                 className={`h-9 px-3 rounded-xl border transition-all ${isDark ? 'border-white/10 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500' : 'border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                                             >
                                                 <X size={14} />
                                             </Button>
                                         </div>
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. PIN Reset History */}
            {processedPinRequests.length > 0 && (
                <div className={`rounded-2xl border overflow-hidden ${ts.card(isDark)} shadow-sm`}>
                    <div className={`px-5 py-4 border-b ${ts.border(isDark)} bg-slate-500/5`}>
                        <h4 className={`text-[11px] font-black uppercase tracking-widest ${ts.textPrimary(isDark)}`}>Recent Reset History</h4>
                    </div>
                    <div className="p-3 divide-y divide-slate-100 dark:divide-white/5">
                        {processedPinRequests.slice(0, 10).map(req => (
                            <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {req.status === 'approved' ? <Check size={14} /> : <X size={14} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-[12px] font-black truncate ${ts.textPrimary(isDark)}`}>{req.student.first_name} {req.student.last_name}</p>
                                        <p className={`text-[10px] font-bold opacity-50 ${ts.textMuted(isDark)}`}>{new Date(req.requested_at).toLocaleDateString()} • {req.student.email || req.student.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                    {req.status === 'approved' && req.new_pin && (
                                        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                                            <div className={`px-3 py-1.5 rounded-xl border-2 border-dashed flex items-center gap-2 ${isDark ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-indigo-100 bg-indigo-50'}`}>
                                                <span className={`text-[11px] font-mono font-black tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{req.new_pin}</span>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(req.new_pin);
                                                        toast.success('PIN copied to clipboard');
                                                    }}
                                                    className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-indigo-500/20 text-indigo-400' : 'hover:bg-indigo-100 text-indigo-600'}`}
                                                    title="Copy PIN"
                                                >
                                                    <Zap size={10} />
                                                </button>
                                            </div>
                                            <Badge className="bg-emerald-500 text-white text-[8px] font-black tracking-widest uppercase border-0 flex-shrink-0">APPROVED</Badge>
                                        </div>
                                    )}
                                    {req.status === 'rejected' && (
                                        <Badge className="bg-rose-500 text-white text-[8px] font-black tracking-widest uppercase border-0 self-end sm:self-center">REJECTED</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

