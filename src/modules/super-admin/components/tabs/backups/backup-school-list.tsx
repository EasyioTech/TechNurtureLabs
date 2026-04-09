'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Server, Users, IndianRupee, RotateCcw, 
    AlertCircle, Filter, ArrowRightCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminTheme, t } from '../../../theme-context';

interface BackupSchoolNode {
    id: string;
    name: string;
    students: number;
    revenue: number;
    timestamp?: string;
}

interface BackupSchoolListProps {
    schools: BackupSchoolNode[];
    isRestoring: boolean;
    onRestore: (schoolId: string) => void;
    onRestoreAll: () => void;
}

export function BackupSchoolList({ 
    schools, 
    isRestoring, 
    onRestore,
    onRestoreAll
}: BackupSchoolListProps) {
    const { isDark, accent } = useAdminTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmTarget, setConfirmTarget] = useState<string | 'all' | null>(null);

    const filteredSchools = useMemo(() => {
        return schools.filter(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [schools, searchQuery]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header / Search Area */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 opacity-30 ${t.textPrimary(isDark)}`} />
                    <input 
                        type="text" 
                        placeholder="Filter institutional nodes..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                            isDark 
                             ? 'bg-white/5 border-white/5 focus:border-white/20 focus:bg-white/[0.07] text-white' 
                             : 'bg-neutral-50 border-neutral-100 focus:border-neutral-200 focus:bg-white text-slate-950'
                        }`}
                    />
                </div>
                
                <Button
                    onClick={() => setConfirmTarget('all')}
                    disabled={isRestoring || schools.length === 0}
                    variant="outline"
                    className={`h-11 px-6 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest border-2 transition-all active:scale-95 ${
                        isDark ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-slate-900 border-amber-500' : 'border-amber-100 text-amber-600 hover:bg-amber-50'
                    }`}
                >
                    <RotateCcw size={14} /> Full Restore
                </Button>
            </div>

            {/* List Container */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {filteredSchools.length > 0 ? (
                    filteredSchools.map((school, idx) => (
                        <motion.div
                            key={school.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-5 rounded-3xl border transition-all group relative overflow-hidden ${
                                isDark 
                                 ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05] hover:border-white/10' 
                                 : 'bg-white border-neutral-100 hover:shadow-xl hover:shadow-black/5 hover:border-neutral-200'
                            }`}
                        >
                            {/* Inner Backdrop Glimmer */}
                            <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${isDark ? accent.bg : 'bg-indigo-500'}`} />

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                                        isDark ? 'bg-white/5' : 'bg-neutral-50'
                                    }`}>
                                        <Server size={22} className={isDark ? accent.text : 'text-slate-900'} />
                                    </div>
                                    
                                    <div>
                                        <h4 className={`text-sm sm:text-base font-black tracking-tight ${t.textPrimary(isDark)}`}>
                                            {school.name}
                                        </h4>
                                        <div className="flex items-center gap-4 mt-1.5 overflow-hidden">
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Users size={12} className={`opacity-40 ${t.textPrimary(isDark)}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-wider opacity-60 ${t.textPrimary(isDark)}`}>
                                                    {school.students.toLocaleString()} Students
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <IndianRupee size={12} className={`opacity-40 ${t.textPrimary(isDark)}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-wider opacity-60 ${t.textPrimary(isDark)}`}>
                                                    {formatCurrency(school.revenue)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex flex-col items-end mr-4">
                                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] opacity-40 ${t.textMuted(isDark)}`}>NODE STATUS</span>
                                        <span className={`text-[10px] font-black text-emerald-500 uppercase tracking-widest`}>HEALTHY</span>
                                    </div>
                                    
                                    <Button
                                        onClick={() => setConfirmTarget(school.id)}
                                        disabled={isRestoring}
                                        className={`h-11 px-6 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                                            isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg'
                                        }`}
                                    >
                                        Restore
                                        <ArrowRightCircle size={14} className="opacity-50" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-20 px-8 text-center opacity-20">
                        <Filter size={48} className="mb-4" />
                        <h4 className="text-xl font-black uppercase tracking-tighter">No Nodes Filtered</h4>
                        <p className="text-sm font-bold max-w-xs mx-auto mt-2">Adjust your refinement parameters to locate specific institutional snapshots.</p>
                    </div>
                )}
            </div>

            {/* Granular Confirmation Dialog */}
            <AnimatePresence>
                {confirmTarget && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className={`max-w-md w-full p-8 rounded-[3rem] border shadow-2xl ${
                                isDark ? 'bg-neutral-900 border-white/10' : 'bg-white border-neutral-200'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-3xl mb-6 flex items-center justify-center ${isDark ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-600'}`}>
                                <AlertCircle size={32} />
                            </div>
                            
                            <h4 className={`text-2xl font-[1000] tracking-tighter uppercase mb-2 ${t.textPrimary(isDark)}`}>
                                Security Override
                            </h4>
                            <p className={`text-sm font-bold leading-relaxed mb-8 ${t.textMuted(isDark)}`}>
                                {confirmTarget === 'all' 
                                    ? "You are about to perform a full system restoration. This will overwrite all platform data with the archive contents. This operation is irreversible and fully audited."
                                    : "You are initiating a surgical node restoration for this school. All current records for this institution will be reverted to the snapshot state."
                                }
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmTarget(null)}
                                    className={`h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest ${
                                        isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-neutral-100 text-slate-900'
                                    }`}
                                >
                                    ABORT
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (confirmTarget === 'all') {
                                            onRestoreAll();
                                        } else {
                                            onRestore(confirmTarget);
                                        }
                                        setConfirmTarget(null);
                                    }}
                                    className={`h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-900/20 border-0`}
                                >
                                    EXECUTE RESTORE
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
