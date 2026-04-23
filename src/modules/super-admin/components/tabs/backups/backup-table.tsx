'use client';

import React from 'react';
import { 
    FileText, HardDrive, Users, Calendar, 
    MoreVertical, Download, Trash2, Eye,
    ChevronRight, Database, ShieldCheck, Box
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminTheme, t } from '../../../theme-context';
import { cn } from "@/lib/utils";

interface BackupTableProps {
    backups: any[];
    onPreview: (backup: any) => void;
    onDownload: (backup: any) => void;
    onDelete: (backup: any) => void;
}

export function BackupTable({ backups, onPreview, onDownload, onDelete }: BackupTableProps) {
    const { isDark, accent } = useAdminTheme();

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    };

    return (
        <div className={cn(
            "rounded-[2rem] border overflow-hidden shadow-2xl transition-all mb-10",
            isDark ? "bg-black/20 border-white/5 shadow-black/40" : "bg-white border-neutral-200 shadow-neutral-200/50"
        )}>
            <div className="overflow-x-auto overflow-y-hidden">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className={cn(
                            "border-b transition-colors",
                            isDark ? "bg-white/[0.02] border-white/5" : "bg-neutral-50/50 border-neutral-100"
                        )}>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Archive Identifier</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Topology</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Metrics</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Timestamp</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-transparent">
                        {backups.map((backup) => {
                            const dateInfo = formatDate(backup.timestamp);
                            const isSystemWide = backup.type === 'system-wide';
                            
                            return (
                                <tr 
                                    key={backup.id}
                                    className={cn(
                                        "group transition-all duration-300",
                                        isDark ? "hover:bg-white/[0.03]" : "hover:bg-neutral-50/80"
                                    )}
                                >
                                    {/* Name / ID */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                                isSystemWide 
                                                    ? (isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600")
                                                    : (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")
                                            )}>
                                                {isSystemWide ? <Database size={18} /> : <Box size={18} />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={cn(
                                                    "text-sm font-black truncate max-w-[200px]",
                                                    t.textPrimary(isDark)
                                                )}>
                                                    {backup.fileName.split('/').pop()?.replace('.json.gz', '')}
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-bold opacity-40 uppercase tracking-tighter truncate",
                                                    t.textMuted(isDark)
                                                )}>
                                                    ID: {backup.id.slice(0, 16)}...
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Type / Topology */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <Badge className={cn(
                                                "w-fit h-5 text-[9px] font-black tracking-wider px-2 border-0",
                                                isSystemWide 
                                                    ? "bg-indigo-500/10 text-indigo-400" 
                                                    : "bg-neutral-500/10 text-neutral-400"
                                            )}>
                                                {isSystemWide ? 'SYSTEM-WIDE CLUSTER' : 'INDIVIDUAL NODE'}
                                            </Badge>
                                            {isSystemWide && (
                                                <span className="text-[10px] font-black opacity-40 pl-1 uppercase tracking-widest">
                                                    {backup.nodeCount} Linked Nodes
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Metrics */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <Users size={12} className="opacity-30" />
                                                    <span className={cn("text-xs font-black", t.textPrimary(isDark))}>
                                                        {backup.studentCount?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">Records</span>
                                            </div>
                                            <div className="w-[1px] h-8 bg-neutral-500/10" />
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <HardDrive size={12} className="opacity-30" />
                                                    <span className={cn("text-xs font-black", t.textPrimary(isDark))}>
                                                        {formatSize(backup.size)}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">Capacity</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Timestamp */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="opacity-30" />
                                                <span className={cn("text-xs font-black", t.textPrimary(isDark))}>
                                                    {dateInfo.date}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">
                                                {dateInfo.time}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-400"
                                                onClick={() => onPreview(backup)}
                                            >
                                                <Eye size={14} />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-400"
                                                onClick={() => onDownload(backup)}
                                            >
                                                <Download size={14} />
                                            </Button>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreVertical size={14} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className={cn(
                                                    "w-48 rounded-xl p-1 border shadow-xl",
                                                    isDark ? "bg-neutral-900 border-white/10" : "bg-white border-neutral-200"
                                                )}>
                                                    <DropdownMenuItem 
                                                        onClick={() => onPreview(backup)}
                                                        className="rounded-lg gap-2 font-bold text-xs cursor-pointer"
                                                    >
                                                        <ShieldCheck size={14} />
                                                        Restore Node
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => onDelete(backup)}
                                                        className="rounded-lg gap-2 font-bold text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                        Purge Archive
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* Footer / Stats */}
            <div className={cn(
                "px-6 py-4 border-t flex items-center justify-between",
                isDark ? "bg-white/[0.01] border-white/5" : "bg-neutral-50/30 border-neutral-100"
            )}>
                <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", t.textMuted(isDark))}>
                    Total Archives: {backups.length}
                </span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Vault Online</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
