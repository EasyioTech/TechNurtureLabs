'use client';

import React, { useState, useEffect } from 'react';
import { useAdminTheme, t } from '../../theme-context';
import { HardDrive, Download, RotateCcw, AlertCircle, CheckCircle2, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { performSchoolBackupAdmin, listSchoolBackupsAdmin, downloadSchoolBackupFileAdmin, restoreSchoolFromBackupFileAdmin } from '@/app/(super-admin)/admin-portal/actions/backup-actions';

const t_default = t;

interface BackupsTabProps {
    schoolsList: Array<{ id: string; name: string }>;
}

export function BackupsTab({ schoolsList }: BackupsTabProps) {
    const { isDark, accent } = useAdminTheme();
    const [selectedSchool, setSelectedSchool] = useState<string>(schoolsList[0]?.id || '');
    const [backups, setBackups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    useEffect(() => {
        if (selectedSchool) {
            loadBackups();
        }
    }, [selectedSchool]);

    const loadBackups = async () => {
        setIsLoading(true);
        try {
            const result = await listSchoolBackupsAdmin(selectedSchool);
            if (result.success && result.backups) {
                setBackups(result.backups);
            } else {
                toast.error(result.error || 'Failed to load backups');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error loading backups');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackup = async () => {
        if (!selectedSchool) {
            toast.error('Please select a school');
            return;
        }

        setIsBackingUp(true);
        try {
            const result = await performSchoolBackupAdmin(selectedSchool);
            if (result.success) {
                toast.success('✓ Backup created successfully');
                await loadBackups();
            } else {
                toast.error(result.error || 'Backup failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Backup error');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestore = async (fileName: string) => {
        if (!confirm('⚠️ This will restore ALL school data. Continue?')) return;

        setIsBackingUp(true);
        try {
            const result = await restoreSchoolFromBackupFileAdmin(selectedSchool, fileName);
            if (result.success) {
                toast.success('✓ Restore completed');
                await loadBackups();
            } else {
                const errorMsg = result.errors?.[0] || result.message || 'Restore failed';
                toast.error(errorMsg);
            }
        } catch (error: any) {
            toast.error(error.message || 'Restore error');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleDownload = async (fileName: string) => {
        try {
            const result = await downloadSchoolBackupFileAdmin(selectedSchool, fileName);
            if (result.success) {
                toast.success('Backup preview loaded');
            } else {
                toast.error(result.error || 'Failed to download backup');
            }
        } catch (error: any) {
            toast.error(error.message || 'Download error');
        }
    };

    const schoolName = schoolsList.find(s => s.id === selectedSchool)?.name || 'Select School';

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* School Selection */}
            <div className={`p-6 rounded-3xl border ${t.card(isDark)}`}>
                <h3 className={`text-lg font-black mb-4 ${t.textPrimary(isDark)}`}>Select School</h3>
                <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className={`w-full p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-slate-900'}`}
                >
                    {schoolsList.map(school => (
                        <option key={school.id} value={school.id}>
                            {school.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Backup Status */}
            <div className={`p-6 rounded-3xl border ${t.card(isDark)} bg-gradient-to-br transition-all duration-300 ${isDark ? 'from-blue-500/5 to-transparent border-white/5' : 'from-blue-50 to-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className={`text-xl font-black mb-2 tracking-tight ${t.textPrimary(isDark)}`}>
                            Backup & Restore
                        </h3>
                        <p className={`text-sm font-bold ${t.textSecondary(isDark)}`}>
                            {schoolName}
                        </p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <HardDrive size={24} />
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                        <p className={`text-sm font-bold ${t.textSecondary(isDark)}`}>
                            Complete school data including students, courses, payments, and progress
                        </p>
                    </div>
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
                        <p className={`text-sm font-bold ${t.textSecondary(isDark)}`}>
                            Stored securely in Cloudflare R2 with automatic 30-day retention
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleBackup}
                    disabled={isBackingUp || !selectedSchool}
                    className={`w-full rounded-2xl h-12 font-black text-base ${t.btnPrimary(isDark, accent)}`}
                >
                    {isBackingUp ? (
                        <>
                            <Loader2 size={18} className="animate-spin mr-2" />
                            Creating Backup...
                        </>
                    ) : (
                        '💾 Backup Now'
                    )}
                </Button>
            </div>

            {/* Backup History */}
            {backups.length > 0 && (
                <div>
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.25em] mb-4 ${t.textMuted(isDark)}`}>
                        Recent Backups ({backups.length})
                    </h4>
                    <div className="space-y-3">
                        {backups.map((backup, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}
                            >
                                <div className="flex-1">
                                    <p className={`text-sm font-black ${t.textPrimary(isDark)}`}>
                                        {backup.created}
                                    </p>
                                    <p className={`text-xs font-bold ${t.textSecondary(isDark)}`}>
                                        {(backup.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownload(backup.fileName)}
                                        disabled={isBackingUp}
                                        className={`rounded-xl px-4 font-black text-xs ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        <Download size={16} /> Download
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRestore(backup.fileName)}
                                        disabled={isBackingUp}
                                        className={`rounded-xl px-4 font-black text-xs ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        <RotateCcw size={16} /> Restore
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin" size={32} />
                </div>
            )}

            {!isLoading && backups.length === 0 && (
                <div className={`p-8 rounded-2xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-sm font-bold ${t.textMuted(isDark)}`}>
                        No backups yet. Create your first backup using the button above.
                    </p>
                </div>
            )}

            {/* Warning */}
            <div className={`p-4 rounded-2xl border-l-4 ${isDark ? 'bg-red-500/5 border-red-500 text-red-300' : 'bg-red-50 border-red-500 text-red-700'}`}>
                <p className="text-sm font-bold">
                    ⚠️ Restoring will replace ALL current school data. Backups are kept for 30 days. Only super admins can perform backup/restore operations.
                </p>
            </div>
        </div>
    );
}
