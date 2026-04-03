'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Clock, HardDrive, AlertCircle, CheckCircle2, Layers, BookOpen, X
} from 'lucide-react';
import { useAdminTheme, t } from '../theme-context';
import { formatDistanceToNow, format } from 'date-fns';

interface BackupPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    backup: any;
    backupType: 'course' | 'lesson';
    isRestoring: boolean;
    onRestore: () => void;
}

export function BackupPreviewModal({
    isOpen,
    onClose,
    backup,
    backupType,
    isRestoring,
    onRestore
}: BackupPreviewModalProps) {
    const { isDark, accent } = useAdminTheme();
    const [confirmRestore, setConfirmRestore] = useState(false);

    if (!backup) return null;

    const backupDate = new Date(backup.lastModified);
    const fileSize = (backup.size / 1024).toFixed(1);
    const fileName = backup.key.split('/').pop() || 'Backup';
    const relativeTime = formatDistanceToNow(backupDate, { addSuffix: true });
    const formattedDate = format(backupDate, 'MMM dd, yyyy');
    const formattedTime = format(backupDate, 'hh:mm a');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`w-full max-w-md sm:max-w-lg border-0 p-0 overflow-hidden rounded-2xl sm:rounded-3xl ${
                isDark ? 'bg-[#0a0d13]' : 'bg-white'
            }`}>
                {/* Header */}
                <div className={`relative px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 border-b ${
                    isDark ? 'border-white/5' : 'border-slate-100'
                }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                isDark ? 'bg-white/5' : 'bg-slate-50'
                            }`}>
                                {backupType === 'course'
                                    ? <Layers size={20} className="text-sky-400" />
                                    : <BookOpen size={20} className="text-orange-400" />
                                }
                            </div>
                            <div className="min-w-0">
                                <h2 className={`text-base sm:text-lg font-bold tracking-tight truncate ${t.textPrimary(isDark)}`}>
                                    {fileName}
                                </h2>
                                <p className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider mt-1 ${t.textMuted(isDark)}`}>
                                    {backupType === 'course' ? 'Full Course Backup' : 'Lesson Backup'}
                                </p>
                            </div>
                        </div>
                        <DialogClose asChild>
                            <button className={`p-1 rounded-lg transition-colors ${
                                isDark
                                    ? 'hover:bg-white/10 text-white/50 hover:text-white'
                                    : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                            }`}>
                                <X size={18} />
                            </button>
                        </DialogClose>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4">
                    {/* Date & Time Card */}
                    <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
                        isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
                    }`}>
                        <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                            }`}>
                                <Clock size={16} className="text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>
                                    Created
                                </p>
                                <p className={`text-sm sm:text-base font-semibold mt-1 ${t.textPrimary(isDark)}`}>
                                    {formattedDate} at {formattedTime}
                                </p>
                                <p className={`text-[10px] sm:text-xs font-medium mt-1 ${t.textMuted(isDark)}`}>
                                    {relativeTime}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Size Card */}
                    <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
                        isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
                    }`}>
                        <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isDark ? 'bg-purple-500/20' : 'bg-purple-50'
                            }`}>
                                <HardDrive size={16} className="text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>
                                    File Size
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`text-xs sm:text-sm font-bold ${
                                        isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                        {fileSize} KB
                                    </Badge>
                                    {Number(fileSize) > 5000 && (
                                        <span className={`text-[9px] sm:text-[10px] font-medium ${t.textMuted(isDark)}`}>
                                            Large file
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning Info */}
                    <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border flex items-start gap-3 ${
                        isDark ? 'border-amber-500/20 bg-amber-500/[0.05]' : 'border-amber-100 bg-amber-50'
                    }`}>
                        <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className={`text-xs sm:text-sm font-medium ${
                            isDark ? 'text-amber-200' : 'text-amber-800'
                        }`}>
                            Restoring will update existing data or recover deleted content. This cannot be undone immediately.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t flex gap-2 sm:gap-3 ${
                    isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50'
                }`}>
                    <button
                        onClick={onClose}
                        disabled={isRestoring}
                        className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-colors ${
                            isDark
                                ? 'bg-white/5 text-white hover:bg-white/10 disabled:opacity-50'
                                : 'bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:opacity-50'
                        }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => setConfirmRestore(!confirmRestore)}
                        disabled={isRestoring || confirmRestore}
                        className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                            isDark
                                ? `${accent.bg} text-white hover:opacity-90 disabled:opacity-50`
                                : `${accent.bg} text-white hover:opacity-90 disabled:opacity-50`
                        }`}
                    >
                        {confirmRestore ? (
                            <>
                                <CheckCircle2 size={14} />
                                <span className="hidden sm:inline">Confirmed</span>
                                <span className="sm:hidden">OK</span>
                            </>
                        ) : (
                            'Confirm Restore'
                        )}
                    </button>
                    {confirmRestore && (
                        <button
                            onClick={() => {
                                onRestore();
                                setConfirmRestore(false);
                            }}
                            disabled={isRestoring}
                            className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                                isRestoring
                                    ? 'bg-emerald-500/50 text-white'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            }`}
                        >
                            {isRestoring ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="hidden sm:inline">Restoring...</span>
                                </>
                            ) : (
                                'Complete Restore'
                            )}
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
