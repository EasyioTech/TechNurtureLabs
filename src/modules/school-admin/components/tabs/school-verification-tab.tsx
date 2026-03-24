'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SchoolStudentMetric } from '../../types';
import { useSchoolTheme, ts } from '../../theme-context';
import { UserCheck, UserX, ShieldCheck, Mail, Building2, Calendar, Ghost } from 'lucide-react';

interface VerificationTabProps {
    pendingStudents: SchoolStudentMetric[];
    onVerify: (id: string, verified: boolean) => void;
    loading?: boolean;
}

export function SchoolVerificationTab({ pendingStudents, onVerify, loading = false }: VerificationTabProps) {
    const { isDark } = useSchoolTheme();

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-[32px] border overflow-hidden ${ts.card(isDark)}`}>
                
                {/* Header */}
                <div className={`px-8 py-10 border-b ${ts.border(isDark)} bg-gradient-to-br ${isDark ? 'from-indigo-500/5 to-transparent' : 'from-indigo-50/50 to-transparent'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                    <ShieldCheck size={20} />
                                </div>
                                <h3 className={`font-black text-2xl tracking-tight ${ts.textPrimary(isDark)}`}>Registration Requests</h3>
                            </div>
                            <p className={`text-[13px] font-bold ${ts.textMuted(isDark)} max-w-lg`}>
                                Verify students who have registered to your institution. Only verified students can access their dashboard and start learning.
                            </p>
                        </div>
                        <Badge className={`px-4 py-2 rounded-xl border-0 text-[11px] font-black tracking-wider ${pendingStudents.length > 0 ? 'bg-rose-500 text-white animate-pulse' : ts.accentSoft(isDark)}`}>
                            {pendingStudents.length} PENDING REQUESTS
                        </Badge>
                    </div>
                </div>

                {/* List */}
                <div className="p-8">
                    {pendingStudents.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className={`w-20 h-20 rounded-[32px] mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                <Ghost size={40} className="text-slate-400 opacity-50" />
                            </div>
                            <h4 className={`text-xl font-black mb-2 ${ts.textPrimary(isDark)}`}>All caught up!</h4>
                            <p className={`text-[14px] font-bold ${ts.textMuted(isDark)}`}>There are no pending student verification requests at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {pendingStudents.map((student, i) => (
                                <motion.div 
                                     key={student.id}
                                     initial={{ opacity: 0, scale: 0.95 }}
                                     animate={{ opacity: 1, scale: 1 }}
                                     transition={{ delay: i * 0.05 }}
                                     className={`group rounded-[32px] border p-7 transition-all duration-500 ${isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)]' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-[0_24px_48px_-12px_rgba(79,70,229,0.1)] hover:border-indigo-500/20'}`}
                                 >
                                     <div className="flex flex-col h-full">
                                         <div className="flex items-start justify-between mb-8">
                                             <div className="flex items-center gap-5">
                                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${isDark ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}>
                                                     {student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                 </div>
                                                 <div>
                                                     <h4 className={`font-black text-xl tracking-tight leading-none mb-1.5 ${ts.textPrimary(isDark)}`}>{student.full_name}</h4>
                                                     <div className="flex items-center gap-2">
                                                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                         <span className={`text-[11px] font-black tracking-widest uppercase opacity-40 ${ts.textPrimary(isDark)}`}>{student.email}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                             <Badge className={`px-2.5 py-1 rounded-lg border-0 text-[9px] font-black tracking-[0.15em] ${isDark ? 'bg-amber-500/10 text-amber-500 shadow-sm' : 'bg-amber-100 text-amber-700 shadow-sm'}`}>
                                                 PENDING
                                             </Badge>
                                         </div>

                                         <div className="grid grid-cols-2 gap-4 mb-10">
                                             <div className={`rounded-2xl p-4 border transition-colors ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                                                 <div className="flex items-center gap-2 mb-1.5">
                                                     <Building2 size={12} className="text-indigo-500" />
                                                     <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${ts.textMuted(isDark)}`}>Assigned Class</span>
                                                 </div>
                                                 <p className={`text-[14px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>{student.class_name || 'NOT ASSIGNED'}</p>
                                             </div>
                                             <div className={`rounded-2xl p-4 border transition-colors ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100'}`}>
                                                 <div className="flex items-center gap-2 mb-1.5">
                                                     <Calendar size={12} className="text-indigo-500" />
                                                     <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${ts.textMuted(isDark)}`}>Registration Date</span>
                                                 </div>
                                                 <p className={`text-[14px] font-black tracking-tight ${ts.textPrimary(isDark)}`}>
                                                     {student.last_active_at ? new Date(student.last_active_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently Joined'}
                                                 </p>
                                             </div>
                                         </div>

                                         <div className="mt-auto flex items-center gap-3">
                                             <Button 
                                                 onClick={() => onVerify(student.id, true)}
                                                 disabled={loading}
                                                 className={`flex-1 h-14 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/10' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20'}`}
                                             >
                                                 <UserCheck size={18} className="mr-2" />
                                                 Verify Now
                                             </Button>
                                             <Button 
                                                 onClick={() => onVerify(student.id, false)}
                                                 disabled={loading}
                                                 variant="ghost"
                                                 className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-100 text-slate-400'}`}
                                             >
                                                 <UserX size={18} />
                                             </Button>
                                         </div>
                                     </div>
                                 </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
