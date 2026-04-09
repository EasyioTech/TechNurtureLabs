'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Clock, HardDrive, History, Download, RotateCcw, 
    Trash2, Info, Lock, ShieldCheck, Check, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminTheme, t } from '../../theme-context';

interface BackupWithMetadata {
    fileName: string;
    size: number;
    timestamp: string;
    created: string;
    schoolName?: string;
    studentCount?: number;
    revenueTotal?: string;
    recordsCount?: any;
    inDb?: boolean;
}

interface BackupCardProps {
    backup: BackupWithMetadata;
    index: number;
    onPreview: () => void;
    onDownload: () => void;
    onRestore: () => void;
    onDelete: () => void;
}

export function BackupCard({ 
    backup, 
    index, 
    onPreview, 
    onDownload, 
    onRestore, 
    onDelete 
}: BackupCardProps) {
    const { isDark, accent } = useAdminTheme();
    
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

    const fileNameDisplay = backup.fileName.split('/').pop()?.replace('.json.gz', '') || 'Untitled Archive';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className={`group relative p-6 rounded-[2.5rem] border transition-all duration-500 overflow-hidden cursor-pointer
                ${isDark 
                    ? 'bg-neutral-900 border-white/5 hover:bg-neutral-800/80 hover:border-white/10 hover:-translate-y-1' 
                    : 'bg-white border-neutral-100 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1'}`}
            onClick={onPreview}
        >
            {/* Folder Tab Effect */}
            <div className={`absolute top-0 left-8 h-1 w-12 rounded-full opacity-30 ${isDark ? accent.bg : 'bg-slate-900'}`} />

            {/* Glowing Accent */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-[40px] opacity-10 transition-all duration-700 group-hover:scale-150 group-hover:opacity-20 ${isDark ? accent.bg : 'bg-indigo-500'}`} />

            <div className="flex flex-col h-full gap-6">
                {/* Header: Icon & Meta */}
                <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${isDark ? 'bg-white/5' : 'bg-neutral-50'}`}>
                        <div className="relative">
                            <Database size={28} className={isDark ? accent.text : 'text-slate-900'} />
                            <div className="absolute -top-1 -right-1 flex">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <span className={`text-[9px] font-black tracking-[0.2em] mb-1 opacity-50 ${t.textMuted(isDark)}`}>CAPACITY</span>
                        <span className={`text-xs font-black ${t.textPrimary(isDark)}`}>{formatFileSize(backup.size)}</span>
                    </div>
                </div>

                {/* Content: Title & Stats */}
                <div className="space-y-4">
                    <div className="min-w-0">
                        <h4 className={`text-base font-black tracking-tight truncate leading-tight transition-colors ${isDark ? 'group-hover:text-white' : 'group-hover:text-slate-900'}`}>
                            {fileNameDisplay}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 opacity-60">
                            <Clock size={12} />
                            <span className="text-[10px] font-bold">{formatDate(backup.timestamp)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge className={`h-5 text-[8px] font-black tracking-wider px-2 border-0 ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Lock size={8} className="mr-1" /> SECURE SNAPSHOT
                        </Badge>
                        {backup.studentCount && (
                             <Badge className={`h-5 text-[8px] font-black tracking-wider px-2 border-0 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                <Database size={8} className="mr-1" /> {backup.studentCount} RECORDS
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Footer: Quick Actions (Visible on Hover in Desktop, always on mobile) */}
                <div className="mt-auto pt-4 border-t border-dashed border-white/5 flex items-center justify-between gap-2">
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); onDownload(); }}
                            className={`w-9 h-9 rounded-xl ${isDark ? 'hover:bg-blue-500/20 hover:text-blue-400' : 'hover:bg-blue-50 hover:text-blue-600'}`}
                        >
                            <Download size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className={`w-9 h-9 rounded-xl ${isDark ? 'hover:bg-rose-500/20 hover:text-rose-400' : 'hover:bg-rose-50 hover:text-rose-600'}`}
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                    
                    <Button
                        onClick={(e) => { e.stopPropagation(); onRestore(); }}
                        variant="outline"
                        className={`h-9 px-4 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest border-2 transition-all group/btn 
                            ${isDark ? 'border-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-900 border-amber-500' : 'border-amber-100 text-amber-600 hover:bg-amber-50 hover:border-amber-200'}`}
                    >
                        <RotateCcw size={14} className="group-hover/btn:rotate-[-180deg] transition-transform duration-500" />
                        Restore
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

