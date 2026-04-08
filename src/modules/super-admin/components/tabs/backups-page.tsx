'use client';

import React, { useState, useEffect } from 'react';
import { useAdminTheme, t } from '../../theme-context';
import { HardDrive, Download, RotateCcw, AlertCircle, CheckCircle2, Info, RefreshCw, ChevronLeft, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { performSchoolBackupAdmin, listSchoolBackupsAdmin, downloadSchoolBackupFileAdmin, restoreSchoolFromBackupFileAdmin, deleteBackupFileAdmin } from '@/app/(super-admin)/admin-portal/actions/backup-actions';

interface BackupsPageProps {
    schoolsList: Array<{ id: string; name: string }>;
    onClose: () => void;
}

interface BackupFile {
    fileName: string;
    size: number;
    timestamp: string;
    created: string;
}

interface BackupInfo {
    schoolName: string;
    students: number;
    xp: number;
    revenue: string | number;
    records: Record<string, number>;
}

export function BackupsPage({ schoolsList, onClose }: BackupsPageProps) {
    const { isDark, accent } = useAdminTheme();
    const [selectedSchoolId, setSelectedSchoolId] = useState(schoolsList[0]?.id || '');
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
    const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const [deletingFileName, setDeletingFileName] = useState<string | null>(null);

    const currentSchool = schoolsList.find(s => s.id === selectedSchoolId);

    useEffect(() => {
        if (selectedSchoolId) {
            loadBackups();
        }
    }, [selectedSchoolId]);

    const loadBackups = async () => {
        setIsLoading(true);
        try {
            const result = await listSchoolBackupsAdmin(selectedSchoolId);
            if (result.success) {
                setBackups(result.backups as BackupFile[]);
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
        if (!selectedSchoolId) return;
        setIsBackingUp(true);
        try {
            const result = await performSchoolBackupAdmin(selectedSchoolId);
            if (result.success) {
                toast.success('Backup created successfully');
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

    const handleRestore = async (backup: BackupFile) => {
        if (!window.confirm(`Restore from ${backup.created}?\n\nThis will replace ALL school data.`)) return;

        setIsBackingUp(true);
        try {
            const result = await restoreSchoolFromBackupFileAdmin(selectedSchoolId, backup.fileName);
            if (result.success) {
                toast.success('Restore completed');
                setTimeout(() => window.location.reload(), 2000);
            } else {
                toast.error(result.errors?.[0] || result.message || 'Restore failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Restore error');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleDownload = async (backup: BackupFile) => {
        try {
            const result = await downloadSchoolBackupFileAdmin(selectedSchoolId, backup.fileName);
            if (result.success && result.backup) {
                setSelectedBackup(backup);
                setBackupInfo(result.backup);
                setShowInfo(true);
                toast.success('Backup info loaded');
            } else {
                toast.error(result.error || 'Download failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Download error');
        }
    };

    const handleDelete = async (backup: BackupFile) => {
        if (!window.confirm(`Delete backup from ${backup.created}?\n\nThis cannot be undone.`)) return;

        setDeletingFileName(backup.fileName);
        try {
            const result = await deleteBackupFileAdmin(selectedSchoolId, backup.fileName);
            if (result.success) {
                toast.success('Backup deleted');
                await loadBackups();
            } else {
                toast.error(result.error || 'Delete failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Delete error');
        } finally {
            setDeletingFileName(null);
        }
    };

    const formatSize = (bytes: number) => {
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
        <div className={`min-h-screen ${isDark ? 'bg-neutral-900' : 'bg-slate-50'}`}>
            {/* Header */}
            <div className={`border-b ${isDark ? 'border-white/10 bg-neutral-800/50' : 'border-slate-200 bg-white'}`}>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg hover:bg-white/10 ${isDark ? 'text-white' : 'text-slate-700'}`}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className={`text-2xl font-black ${t.textPrimary(isDark)}`}>School Backups</h1>
                            <p className={`text-sm ${t.textMuted(isDark)}`}>{currentSchool?.name || 'Select school'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* School Selector */}
                <div className="mb-8">
                    <label className={`block text-sm font-black mb-2 ${t.textMuted(isDark)}`}>SCHOOL</label>
                    <select
                        value={selectedSchoolId}
                        onChange={(e) => setSelectedSchoolId(e.target.value)}
                        className={`w-full p-3 rounded-lg border font-semibold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    >
                        {schoolsList.map(school => (
                            <option key={school.id} value={school.id}>
                                {school.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-8">
                    <Button
                        onClick={handleBackup}
                        disabled={isBackingUp}
                        className={`flex-1 rounded-lg h-11 font-black ${t.btnPrimary(isDark, accent)}`}
                        style={isDark ? { boxShadow: t.glowStyle(isDark, accent).boxShadow } : {}}
                    >
                        {isBackingUp ? (
                            <>
                                <Loader2 size={16} className="animate-spin mr-2" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} className="mr-2" />
                                Create Backup
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={loadBackups}
                        disabled={isLoading}
                        variant="outline"
                        className={`rounded-lg h-11 font-black ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                    </Button>
                </div>

                {/* Backups List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin opacity-50" />
                    </div>
                ) : backups.length > 0 ? (
                    <div className="space-y-2">
                        {backups.map((backup, idx) => {
                            // Extract readable name from fileName (format: backups/schools/schoolId/safeName_timestamp.json.gz)
                            const parts = backup.fileName.split('/');
                            const fileWithExt = parts[parts.length - 1]; // safeName_timestamp.json.gz
                            const cleanName = fileWithExt.replace(/_\d+\.json\.gz$/, '').replace(/_/g, ' ');

                            return (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border flex items-center justify-between gap-4 transition-colors ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold break-all capitalize ${t.textPrimary(isDark)}`}>
                                            {cleanName}
                                        </p>
                                        <p className={`text-xs ${t.textMuted(isDark)} mt-1`}>
                                            {formatDate(backup.timestamp)} • {formatSize(backup.size)}
                                        </p>
                                    </div>

                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownload(backup)}
                                            disabled={isBackingUp}
                                            className={`px-3 rounded-lg font-black text-xs ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}
                                            title="View backup info"
                                        >
                                            <Info size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRestore(backup)}
                                            disabled={isBackingUp}
                                            className={`px-3 rounded-lg font-black text-xs ${isDark ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                            title="Restore from this backup"
                                        >
                                            <RotateCcw size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(backup)}
                                            disabled={isBackingUp || deletingFileName === backup.fileName}
                                            className={`px-3 rounded-lg font-black text-xs ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                                            title="Delete this backup"
                                        >
                                            {deletingFileName === backup.fileName ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={`p-8 rounded-lg border text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                        <p className={`text-sm ${t.textMuted(isDark)}`}>No backups yet. Create one to get started.</p>
                    </div>
                )}

                {/* Info Modal */}
                {showInfo && selectedBackup && backupInfo && (
                    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-black/50' : 'bg-black/30'}`}>
                        <div className={`rounded-lg p-6 max-w-md w-full border max-h-[90vh] overflow-y-auto ${isDark ? 'bg-neutral-800 border-white/10' : 'bg-white border-slate-200'}`}>
                            <h3 className={`text-lg font-black mb-4 ${t.textPrimary(isDark)}`}>Backup Details</h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <p className={`text-xs font-black uppercase ${t.textMuted(isDark)} mb-1`}>School</p>
                                    <p className={`text-sm ${t.textPrimary(isDark)}`}>{backupInfo.schoolName}</p>
                                </div>
                                <div>
                                    <p className={`text-xs font-black uppercase ${t.textMuted(isDark)} mb-1`}>Created</p>
                                    <p className={`text-sm ${t.textPrimary(isDark)}`}>{formatDate(selectedBackup.timestamp)}</p>
                                </div>
                                <div>
                                    <p className={`text-xs font-black uppercase ${t.textMuted(isDark)} mb-1`}>Size</p>
                                    <p className={`text-sm ${t.textPrimary(isDark)}`}>{formatSize(selectedBackup.size)}</p>
                                </div>
                                <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                    <p className={`text-xs font-black uppercase ${t.textMuted(isDark)} mb-2`}>Data Summary</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className={`${t.textMuted(isDark)}`}>Students</p>
                                            <p className={`font-semibold ${t.textPrimary(isDark)}`}>{backupInfo.students}</p>
                                        </div>
                                        <div>
                                            <p className={`${t.textMuted(isDark)}`}>Total XP</p>
                                            <p className={`font-semibold ${t.textPrimary(isDark)}`}>{backupInfo.xp.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className={`${t.textMuted(isDark)}`}>Revenue</p>
                                            <p className={`font-semibold ${t.textPrimary(isDark)}`}>₹{typeof backupInfo.revenue === 'number' ? backupInfo.revenue.toLocaleString() : backupInfo.revenue}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                    <p className={`text-xs font-black uppercase ${t.textMuted(isDark)} mb-2`}>Records</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {Object.entries(backupInfo.records).map(([key, count]) => (
                                            <div key={key}>
                                                <p className={`${t.textMuted(isDark)} capitalize`}>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                <p className={`font-semibold ${t.textPrimary(isDark)}`}>{count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        handleRestore(selectedBackup);
                                        setShowInfo(false);
                                    }}
                                    disabled={isBackingUp}
                                    className={`flex-1 rounded-lg ${t.btnPrimary(isDark, accent)}`}
                                >
                                    Restore
                                </Button>
                                <Button
                                    onClick={() => setShowInfo(false)}
                                    variant="outline"
                                    className="flex-1 rounded-lg"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Warning */}
                <div className={`mt-8 p-4 rounded-lg border-l-4 ${isDark ? 'bg-amber-500/10 border-amber-500 text-amber-200' : 'bg-amber-50 border-amber-500 text-amber-800'}`}>
                    <div className="flex gap-3">
                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">Important</p>
                            <p className="text-sm mt-1">Restoring will replace ALL school data. Backups are kept for 30 days. Only super admins can perform these operations.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
