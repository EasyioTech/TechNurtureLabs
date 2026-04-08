'use client';

import React, { useState, useEffect } from 'react';
import { useSchoolTheme, ts } from '../../theme-context';
import { HardDrive, Download, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { performSchoolBackup, getSchoolBackupList, downloadSchoolBackupFile, restoreSchoolFromBackupFile } from '../../actions/backup-actions';

interface BackupSectionProps {
    schoolId: string;
}

export function BackupSection({ schoolId }: BackupSectionProps) {
    const { isDark } = useSchoolTheme();
    const [backups, setBackups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

    useEffect(() => {
        loadBackups();
    }, []);

    const loadBackups = async () => {
        setIsLoading(true);
        try {
            const result = await getSchoolBackupList(schoolId);
            if (result.success && result.backups) {
                setBackups(result.backups);
                if (result.backups.length > 0) {
                    setLastBackup(result.backups[0].created);
                }
            }
        } catch (error) {
            toast.error('Failed to load backups');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackup = async () => {
        setIsLoading(true);
        try {
            const result = await performSchoolBackup(schoolId);
            if (result.success) {
                toast.success('✓ Backup created successfully');
                setLastBackup(new Date().toLocaleDateString());
                await loadBackups();
            } else {
                toast.error(result.error || 'Backup failed');
            }
        } catch (error) {
            toast.error('Backup error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (fileName: string) => {
        if (!confirm('⚠️ This will restore ALL school data. Continue?')) return;

        setIsLoading(true);
        try {
            const result = await restoreSchoolFromBackupFile(schoolId, fileName);
            if (result.success) {
                toast.success('✓ Restore completed');
                window.location.reload();
            } else {
                toast.error(result.message || 'Restore failed');
            }
        } catch (error) {
            toast.error('Restore error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {/* Backup Status */}
            <div className={`p-6 rounded-3xl border ${ts.card(isDark)} bg-gradient-to-br transition-all duration-300 ${isDark ? 'from-blue-500/5 to-transparent border-white/5' : 'from-blue-50 to-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className={`text-xl font-black mb-2 tracking-tight ${ts.textPrimary(isDark)}`}>
                            Data Backup & Recovery
                        </h3>
                        <p className={`text-sm font-bold ${ts.textSecondary(isDark)}`}>
                            {lastBackup ? `Last backup: ${lastBackup}` : 'No backups yet'}
                        </p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <HardDrive size={24} />
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                        <p className={`text-sm font-bold ${ts.textSecondary(isDark)}`}>
                            Complete school data including students, courses, payments, and progress
                        </p>
                    </div>
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
                        <p className={`text-sm font-bold ${ts.textSecondary(isDark)}`}>
                            Stored securely in Cloudflare R2 with automatic 30-day retention
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleBackup}
                    disabled={isLoading}
                    className={`w-full rounded-2xl h-12 font-black text-base ${ts.btnPrimary(isDark)}`}
                >
                    {isLoading ? '⏳ Creating Backup...' : '💾 Backup Now'}
                </Button>
            </div>

            {/* Backup History */}
            {backups.length > 0 && (
                <div className="mt-8">
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.25em] mb-4 ${ts.textMuted(isDark)}`}>
                        Recent Backups
                    </h4>
                    <div className="space-y-3">
                        {backups.map((backup, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                            >
                                <div className="flex-1">
                                    <p className={`text-sm font-black ${ts.textPrimary(isDark)}`}>
                                        {backup.created}
                                    </p>
                                    <p className={`text-xs font-bold ${ts.textSecondary(isDark)}`}>
                                        {(backup.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRestore(backup.fileName)}
                                        disabled={isLoading}
                                        className={`rounded-xl px-4 font-black text-xs ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        <RotateCcw size={16} /> Restore
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`rounded-xl px-4 font-black text-xs ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        <Download size={16} /> Download
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warning */}
            <div className={`mt-8 p-4 rounded-2xl border-l-4 ${isDark ? 'bg-red-500/5 border-red-500 text-red-300' : 'bg-red-50 border-red-500 text-red-700'}`}>
                <p className="text-sm font-bold">
                    ⚠️ Restoring will replace ALL current school data. Keep backups for at least 30 days.
                </p>
            </div>
        </div>
    );
}
