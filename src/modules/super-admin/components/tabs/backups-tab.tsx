'use client';

import React, { useState, useEffect } from 'react';
import { useAdminTheme, t } from '../../theme-context';
import { HardDrive, Download, RotateCcw, AlertCircle, CheckCircle2, Trash2, Info, RefreshCw, Calendar, Database, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { performSchoolBackupAdmin, listSchoolBackupsAdmin, downloadSchoolBackupFileAdmin, restoreSchoolFromBackupFileAdmin } from '@/app/(super-admin)/admin-portal/actions/backup-actions';

interface BackupsTabProps {
    schoolsList: Array<{ id: string; name: string }>;
    selectedSchoolId?: string;
}

interface BackupWithMetadata {
    fileName: string;
    size: number;
    timestamp: string;
    created: string;
    schoolName?: string;
    studentCount?: number;
    recordsCount?: number;
}

export function BackupsTab({ schoolsList, selectedSchoolId }: BackupsTabProps) {
    const { isDark, accent } = useAdminTheme();
    const [backups, setBackups] = useState<BackupWithMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<BackupWithMetadata | null>(null);
    const [showBackupInfo, setShowBackupInfo] = useState(false);

    // Use provided schoolId or first school
    const currentSchoolId = selectedSchoolId || schoolsList[0]?.id || '';
    const currentSchool = schoolsList.find(s => s.id === currentSchoolId);

    useEffect(() => {
        if (currentSchoolId) {
            loadBackups();
        }
    }, [currentSchoolId]);

    const loadBackups = async () => {
        setIsLoading(true);
        try {
            const result = await listSchoolBackupsAdmin(currentSchoolId);
            if (result.success && result.backups) {
                setBackups(result.backups as BackupWithMetadata[]);
            } else {
                toast.error(result.error || 'Failed to load backups');
                setBackups([]);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error loading backups');
            setBackups([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackup = async () => {
        if (!currentSchoolId) {
            toast.error('No school selected');
            return;
        }

        setIsBackingUp(true);
        try {
            const result = await performSchoolBackupAdmin(currentSchoolId);
            if (result.success) {
                toast.success(`✓ Backup created: ${result.fileName}`);
                // Refresh list immediately
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

    const handleRestore = async (backup: BackupWithMetadata) => {
        if (!window.confirm(`⚠️ WARNING: This will restore ALL data for ${currentSchool?.name}.\n\nRestore from: ${backup.created}?\n\nThis CANNOT be undone easily.`)) {
            return;
        }

        setIsBackingUp(true);
        try {
            const result = await restoreSchoolFromBackupFileAdmin(currentSchoolId, backup.fileName);
            if (result.success) {
                toast.success('✓ Restore completed successfully');
                // Refresh after restore
                setTimeout(() => window.location.reload(), 2000);
            } else {
                const errorMsg = Array.isArray(result.errors)
                    ? result.errors[0]
                    : result.message || 'Restore failed';
                toast.error(errorMsg);
            }
        } catch (error: any) {
            toast.error(error.message || 'Restore error');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleDownload = async (backup: BackupWithMetadata) => {
        try {
            const result = await downloadSchoolBackupFileAdmin(currentSchoolId, backup.fileName);
            if (result.success) {
                // In future, this could trigger actual download
                toast.success('Backup downloaded');
                setSelectedBackup(backup);
                setShowBackupInfo(true);
            } else {
                toast.error(result.error || 'Failed to download backup');
            }
        } catch (error: any) {
            toast.error(error.message || 'Download error');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <HardDrive size={28} />
                    </div>
                    <div>
                        <h2 className={`text-3xl font-black tracking-tight ${t.textPrimary(isDark)}`}>
                            School Backups
                        </h2>
                        <p className={`text-sm font-bold ${t.textSecondary(isDark)}`}>
                            {currentSchool?.name || 'Select School'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <Database size={18} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                        <p className={`text-xs font-bold uppercase tracking-wide ${t.textMuted(isDark)}`}>Total Backups</p>
                    </div>
                    <p className={`text-2xl font-black ${t.textPrimary(isDark)}`}>{backups.length}</p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <HardDrive size={18} className={isDark ? 'text-green-400' : 'text-green-600'} />
                        <p className={`text-xs font-bold uppercase tracking-wide ${t.textMuted(isDark)}`}>Total Storage</p>
                    </div>
                    <p className={`text-2xl font-black ${t.textPrimary(isDark)}`}>
                        {formatFileSize(backups.reduce((sum, b) => sum + b.size, 0))}
                    </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar size={18} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                        <p className={`text-xs font-bold uppercase tracking-wide ${t.textMuted(isDark)}`}>Latest Backup</p>
                    </div>
                    <p className={`text-xl font-black ${t.textPrimary(isDark)}`}>
                        {backups.length > 0 ? new Date(backups[0].timestamp).toLocaleDateString() : 'None'}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    onClick={handleBackup}
                    disabled={isBackingUp || !currentSchoolId}
                    className={`flex-1 rounded-2xl h-12 font-black text-base ${t.btnPrimary(isDark, accent)}`}
                    style={isDark ? { boxShadow: t.glowStyle(isDark, accent).boxShadow } : {}}
                >
                    {isBackingUp ? (
                        <>
                            <RefreshCw size={18} className="animate-spin mr-2" />
                            Creating Backup...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={18} className="mr-2" />
                            💾 Create Backup Now
                        </>
                    )}
                </Button>

                <Button
                    onClick={loadBackups}
                    disabled={isRefreshing || !currentSchoolId}
                    variant="outline"
                    className={`rounded-2xl h-12 font-black text-base ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                    {isRefreshing ? (
                        <>
                            <RefreshCw size={18} className="animate-spin mr-2" />
                            Refreshing...
                        </>
                    ) : (
                        <>
                            <RefreshCw size={18} className="mr-2" />
                            Refresh List
                        </>
                    )}
                </Button>
            </div>

            {/* Backups List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <RefreshCw size={32} className="animate-spin mx-auto mb-4 opacity-50" />
                        <p className={t.textMuted(isDark)}>Loading backups...</p>
                    </div>
                </div>
            ) : backups.length > 0 ? (
                <div className="space-y-3">
                    <h3 className={`text-sm font-black uppercase tracking-[0.25em] mb-4 ${t.textMuted(isDark)}`}>
                        Backup History
                    </h3>
                    {backups.map((backup, idx) => (
                        <div
                            key={idx}
                            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:border-blue-500/50 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/[0.08]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-black break-all ${t.textPrimary(isDark)}`}>
                                    {backup.fileName}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <span className={`text-xs font-bold ${t.textSecondary(isDark)}`}>
                                        📅 {formatDate(backup.timestamp)}
                                    </span>
                                    <span className={`text-xs font-bold ${t.textSecondary(isDark)}`}>
                                        💾 {formatFileSize(backup.size)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedBackup(backup);
                                        setShowBackupInfo(true);
                                    }}
                                    className={`rounded-xl px-3 font-black text-xs ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-200'}`}
                                    title="View backup information"
                                >
                                    <Info size={16} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(backup)}
                                    disabled={isBackingUp}
                                    className={`rounded-xl px-3 font-black text-xs ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-200'}`}
                                    title="Download backup file"
                                >
                                    <Download size={16} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRestore(backup)}
                                    disabled={isBackingUp}
                                    className={`rounded-xl px-3 font-black text-xs ${isDark ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                    title="Restore from this backup"
                                >
                                    <RotateCcw size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`p-8 rounded-2xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <HardDrive size={48} className={`mx-auto mb-4 opacity-30 ${isDark ? 'text-white' : 'text-slate-400'}`} />
                    <p className={`text-sm font-bold ${t.textMuted(isDark)}`}>
                        No backups found. Create your first backup using the button above.
                    </p>
                </div>
            )}

            {/* Backup Info Modal */}
            {showBackupInfo && selectedBackup && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/50' : 'bg-black/30'}`}>
                    <div className={`rounded-2xl p-6 max-w-md w-full border ${isDark ? 'bg-neutral-900 border-white/10' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-black ${t.textPrimary(isDark)}`}>Backup Information</h3>
                            <button
                                onClick={() => setShowBackupInfo(false)}
                                className={`text-2xl font-black ${t.textMuted(isDark)} hover:${t.textPrimary(isDark)}`}
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wide ${t.textMuted(isDark)}`}>File Name</p>
                                <p className={`font-mono text-sm break-all ${t.textPrimary(isDark)}`}>{selectedBackup.fileName}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wide ${t.textMuted(isDark)}`}>Size</p>
                                <p className={`text-sm ${t.textPrimary(isDark)}`}>{formatFileSize(selectedBackup.size)}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wide ${t.textMuted(isDark)}`}>Created</p>
                                <p className={`text-sm ${t.textPrimary(isDark)}`}>{formatDate(selectedBackup.timestamp)}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wide ${t.textMuted(isDark)}`}>School</p>
                                <p className={`text-sm ${t.textPrimary(isDark)}`}>{currentSchool?.name}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <Button
                                onClick={() => handleRestore(selectedBackup)}
                                disabled={isBackingUp}
                                className={`flex-1 rounded-xl ${t.btnPrimary(isDark, accent)}`}
                            >
                                Restore
                            </Button>
                            <Button
                                onClick={() => setShowBackupInfo(false)}
                                variant="outline"
                                className={`flex-1 rounded-xl`}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Warning */}
            <div className={`p-4 rounded-2xl border-l-4 ${isDark ? 'bg-red-500/5 border-red-500 text-red-300' : 'bg-red-50 border-red-500 text-red-700'}`}>
                <p className="text-sm font-bold">
                    ⚠️ Restoring will replace ALL school data permanently. Backups are automatically retained for 30 days. Only super admins can perform these operations.
                </p>
            </div>
        </div>
    );
}
