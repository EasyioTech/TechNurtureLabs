'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Clock, HardDrive, AlertCircle, CheckCircle2, ShieldCheck, X, 
    Database, Users, IndianRupee, RotateCcw, ChevronRight, Server, Search
} from 'lucide-react';
import { useAdminTheme, t } from '../../theme-context';
import { motion, AnimatePresence } from 'framer-motion';

interface BackupFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    backup: any;
    previewData: any;
    isLoading: boolean;
    isRestoring: boolean;
    onRestore: (schoolId?: string) => void;
}

export function BackupFolderModal({
    isOpen,
    onClose,
    backup,
    previewData,
    isLoading,
    isRestoring,
    onRestore
}: BackupFolderModalProps) {
    const { isDark, accent } = useAdminTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmTarget, setConfirmTarget] = useState<'all' | string | null>(null);

    if (!backup) return null;

    const fileName = backup.fileName.split('/').pop() || 'Archive';
    
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const filteredSchools = previewData?.students?.length > 0 
        ? [ { id: previewData.schoolId, name: previewData.school?.name, students: previewData.students.length } ]
        : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`max-w-4xl w-full border-0 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl ${
                isDark ? 'bg-neutral-950/95 backdrop-blur-2xl' : 'bg-white'
            }`}>
               <DialogTitle className="sr-only">Exploration of {fileName}</DialogTitle>
                
                <div className="flex h-[80vh] overflow-hidden">
                    {/* LEFT PANEL: MANIFEST SUMMARY */}
                    <div className={`w-80 border-r flex flex-col p-8 shrink-0 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-neutral-50/50 border-neutral-100'}`}>
                        <div className="mb-8">
                            <div className={`w-14 h-14 rounded-2xl mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                                <ShieldCheck size={28} className={isDark ? accent.text : 'text-slate-900'} />
                            </div>
                            <h3 className={`text-xl font-black ${t.textPrimary(isDark)}`}>Archive Vault</h3>
                            <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${t.textMuted(isDark)}`}>Secure Snapshot</p>
                        </div>

                        <div className="space-y-6 flex-1">
                            <MetaItem label="SNAPSHOT ID" value={fileName.replace('.json.gz', '')} isDark={isDark} />
                            <MetaItem label="VAULTED AT" value={formatDate(backup.timestamp)} isDark={isDark} />
                            <MetaItem label="ENCRYPTION" value="AES-256 GZIP" isDark={isDark} />
                            <MetaItem label="DATA WEIGHT" value={formatFileSize(backup.size)} isDark={isDark} />
                            
                            {previewData && (
                                <div className={`mt-8 pt-8 border-t border-dashed ${t.border(isDark)}`}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <StatBox label="NODES" value="1" icon={Server} isDark={isDark} />
                                        <StatBox label="STUDENTS" value={previewData.students?.length?.toString() || '0'} icon={Users} isDark={isDark} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-6">
                            <Button
                                onClick={() => setConfirmTarget('all')}
                                disabled={isRestoring || isLoading}
                                className={`w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl ${t.btnPrimary(isDark, accent)}`}
                            >
                                <RotateCcw size={14} /> Global Restore
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT PANEL: BROWSER */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className={`p-8 border-b flex items-center justify-between ${t.border(isDark)}`}>
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative flex-1 max-w-sm">
                                    <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.textMuted(isDark)}`} />
                                    <input 
                                        type="text" 
                                        placeholder="Search school nodes..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${isDark ? 'bg-white/5 border-white/10 focus:bg-white/10' : 'bg-neutral-50 border-neutral-200'}`}
                                    />
                                </div>
                            </div>
                            <DialogClose asChild>
                                <button className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-neutral-100'}`}>
                                    <X size={20} />
                                </button>
                            </DialogClose>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                                    <RotateCcw size={32} className="animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Parsing Archive Nodes...</p>
                                </div>
                            ) : previewData ? (
                                <div className="grid grid-cols-1 gap-4">
                                   <div className={`p-6 rounded-3xl border transition-all group hover:scale-[1.01] ${isDark ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-neutral-50'}`}>
                                                    <Server size={20} className={isDark ? accent.text : 'text-slate-900'} />
                                                </div>
                                                <div>
                                                    <h4 className={`font-black text-sm ${t.textPrimary(isDark)}`}>{previewData.school?.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className={`flex items-center gap-1 text-[10px] font-black ${t.textMuted(isDark)}`}>
                                                            <Users size={12} /> {previewData.students?.length || 0} Learners
                                                        </span>
                                                        <span className={`flex items-center gap-1 text-[10px] font-black ${isDark ? accent.text : 'text-indigo-600'}`}>
                                                            <IndianRupee size={12} /> ₹{parseFloat(previewData.metadata?.totalRevenue || '0').toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => setConfirmTarget(previewData.schoolId)}
                                                variant="outline"
                                                className={`h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-tighter ${isDark ? 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
                                            >
                                                SELECT NODE
                                            </Button>
                                        </div>
                                   </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30 text-center">
                                    <Database size={48} />
                                    <p className="text-xs font-black uppercase tracking-widest max-w-[200px]">No school nodes detected in this archive manifest.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CONFIRMATION OVERLAY */}
                <AnimatePresence>
                    {confirmTarget && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className={`max-w-md w-full p-8 rounded-[2rem] border ${isDark ? 'bg-neutral-900 border-white/10' : 'bg-white'}`}
                            >
                                <AlertCircle size={40} className="text-rose-500 mb-6" />
                                <h4 className="text-xl font-black mb-2">Destructive Sequence Initiated</h4>
                                <p className={`text-xs font-bold leading-relaxed mb-8 ${t.textMuted(isDark)}`}>
                                    Restoring {confirmTarget === 'all' ? 'the entire system' : 'this specific node'} will rewrite all existing database paths.
                                    This action is audited and irreversible. Do you wish to proceed?
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setConfirmTarget(null)}
                                        className="h-12 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                    >
                                        Abort
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            onRestore(confirmTarget === 'all' ? undefined : confirmTarget);
                                            setConfirmTarget(null);
                                        }}
                                        className={`h-12 rounded-xl font-black text-[10px] uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-lg shadow-rose-900/20`}
                                    >
                                        Execute Restore
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

function MetaItem({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
    return (
        <div>
            <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 opacity-50 ${t.textMuted(isDark)}`}>{label}</p>
            <p className={`text-[10px] font-black truncate ${t.textPrimary(isDark)}`}>{value}</p>
        </div>
    );
}

function StatBox({ label, value, icon: Icon, isDark }: { label: string; value: string; icon: any; isDark: boolean }) {
    return (
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-neutral-100'}`}>
            <Icon size={14} className="mb-2 opacity-50" />
            <p className={`text-xs font-black ${t.textPrimary(isDark)}`}>{value}</p>
            <p className={`text-[8px] font-black uppercase tracking-widest opacity-50 ${t.textMuted(isDark)}`}>{label}</p>
        </div>
);
}
