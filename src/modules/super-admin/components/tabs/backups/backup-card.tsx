'use client';

import React from 'react';
import { 
    Clock, HardDrive, History, Download, RotateCcw, 
    Trash2, Info, Lock, ShieldCheck, Check, Database,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminTheme, t } from '../../../theme-context';

interface BackupWithMetadata {
    id: string;
    type: 'system-wide' | 'single';
    fileName: string;
    size: number;
    timestamp: string;
    created: string;
    schoolName?: string;
    studentCount?: number;
    nodeCount?: number;
    nodes?: any[];
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

    const fileNameDisplay = backup.type === 'system-wide' 
        ? `SYSTEM VAULT: ${backup.nodeCount} INSTITUTIONS`
        : (backup.schoolName ? `${backup.schoolName.toUpperCase()} ARCHIVE` : (backup.fileName.split('/').pop()?.replace('.json.gz', '') || 'Untitled Archive'));

    return (
        <div
            className={`group relative p-5 sm:p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden cursor-pointer
                ${isDark
                    ? 'bg-neutral-900/90 border-white/10 hover:bg-neutral-800 hover:border-white/20 hover:-translate-y-1 shadow-2xl shadow-black/40'
                    : 'bg-white border-neutral-100 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1'}`}
            onClick={onPreview}
        >
            {/* Folder Tab Effect */}
            <div className={`absolute top-0 left-8 h-1.5 w-14 rounded-full opacity-40 transition-all group-hover:w-20 ${isDark ? accent.bg : 'bg-indigo-500'}`} />

            {/* Glowing Accent */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-[40px] opacity-10 transition-all duration-700 group-hover:scale-150 group-hover:opacity-30 ${isDark ? accent.bg : 'bg-blue-400'}`} />

            <div className="flex flex-col h-full gap-5 sm:gap-6">
                {/* Header: Icon & Meta */}
                <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110 ${isDark ? 'bg-white/5 shadow-xl shadow-black/20' : 'bg-neutral-50 shadow-lg shadow-black/[0.02]'}`}>
                        <div className="relative">
                            <Database size={24} className={isDark ? accent.text : 'text-indigo-600'} />
                            <div className="absolute -top-1 -right-1 flex">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <span className={`text-[8px] sm:text-[9px] font-black tracking-[0.2em] mb-1 opacity-50 ${t.textMuted(isDark)}`}>CAPACITY</span>
                        <span className={`text-xs font-black ${t.textPrimary(isDark)}`}>{formatFileSize(backup.size)}</span>
                    </div>
                </div>

                {/* Content: Title & Stats */}
                <div className="space-y-3 sm:space-y-4">
                    <div className="min-w-0">
                        <h4 className={`text-sm sm:text-base font-black tracking-tight truncate leading-tight transition-colors ${t.textPrimary(isDark)} ${isDark ? 'group-hover:text-white' : 'group-hover:text-slate-900 text-slate-800'}`}>
                            {fileNameDisplay}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 opacity-60">
                            <Clock size={12} className={isDark ? accent.text : 'text-indigo-500'} />
                            <span className={`text-[10px] font-bold ${t.textSecondary(isDark)}`}>{formatDate(backup.timestamp)}</span>
                        </div>
                    </div>

                    {/* School List for Grouped Backups */}
                    {backup.nodes && backup.nodes.length > 0 && (
                        <div className={`p-3 rounded-2xl border border-dashed transition-colors ${isDark ? 'bg-black/20 border-white/5 group-hover:border-white/10' : 'bg-neutral-50 border-neutral-200 group-hover:border-neutral-300'}`}>
                            <div className="flex flex-wrap gap-1.5">
                                {backup.nodes.slice(0, 3).map((node: any, i: number) => (
                                    <div key={i} className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${isDark ? 'bg-white/5 text-white/60' : 'bg-white text-slate-500 border border-slate-100'}`}>
                                        {node.schoolName}
                                    </div>
                                ))}
                                {backup.nodes.length > 3 && (
                                    <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                        +{backup.nodes.length - 3} MORE
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Badge className={`h-5 text-[8px] font-black tracking-wider px-2 border-0 ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                            <Lock size={8} className="mr-1" /> SECURE
                        </Badge>
                        {backup.nodeCount && backup.nodeCount > 1 && (
                            <Badge className={`h-5 text-[8px] font-black tracking-wider px-2 border-0 ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                                <Database size={8} className="mr-1" /> {backup.nodeCount} NODES
                            </Badge>
                        )}
                        {backup.studentCount !== undefined && backup.studentCount > 0 && (
                             <Badge className={`h-5 text-[8px] font-black tracking-wider px-2 border-0 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                                <Users size={8} className="mr-1" /> {backup.studentCount} RECORDS
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Footer: Quick Actions */}
                <div className={`mt-auto pt-4 border-t border-dashed flex items-center justify-between gap-2 ${isDark ? 'border-white/5' : 'border-neutral-100'}`}>
                    <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
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
                        className={`h-9 px-4 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest border transition-all group/btn 
                            ${isDark ? 'border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-slate-900 border-amber-500' : 'border-amber-200 text-amber-600 hover:bg-amber-500 hover:text-white hover:border-amber-500'}`}
                    >
                        <RotateCcw size={14} className="group-hover/btn:rotate-[-180deg] transition-transform duration-500" />
                        Restore
                    </Button>
                </div>
            </div>

        </div>
    );
}

