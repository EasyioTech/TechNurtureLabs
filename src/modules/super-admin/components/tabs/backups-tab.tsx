'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CloudUpload, RefreshCw, AlertCircle, Info, 
    Search, Filter, LayoutGrid, List, Database,
    Clock, HardDrive, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAdminTheme, t } from '../theme-context';
import { 
    performSystemWideBackupAdmin,
    performSchoolBackupAdmin,
    syncBackupsFromR2Admin, 
    getBackupPreviewAdmin, 
    deleteBackupFileAdmin, 
    restoreSchoolFromBackupFileAdmin,
    getBackupDownloadUrlAdmin
} from '@/app/(super-admin)/admin-portal/actions/backup-actions';
import { BackupCard } from './backups/backup-card';
import { BackupFolderModal } from './backups/backup-folder-modal';

interface BackupsTabProps {
    backups: any[];
    activeSchoolId?: string;
}

export function BackupsTab({ backups: initialBackups, activeSchoolId }: BackupsTabProps) {
    const { isDark, accent } = useAdminTheme();
    
    // State
    const [backups, setBackups] = useState(initialBackups);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBackup, setSelectedBackup] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // Derived
    const filteredBackups = useMemo(() => {
        return backups.filter(b => 
            b.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [backups, searchQuery]);

    // Actions
    const handleSync = async () => {
        if (!activeSchoolId) return;
        setIsSyncing(true);
        try {
            const result = await syncBackupsFromR2Admin(activeSchoolId);
            if (result.success) {
                toast.success(result.message);
                window.location.reload();
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleInitiateBackup = async () => {
        setIsBackingUp(true);
        try {
            // If a specific school is selected, back up only that school.
            // Otherwise, perform a system-wide backup of all active schools.
            const result = activeSchoolId
                ? await performSchoolBackupAdmin(activeSchoolId)
                : await performSystemWideBackupAdmin();
            if (result.success) {
                toast.success(activeSchoolId ? "School snapshot created successfully." : "System-wide vault initiated for all schools.");
                window.location.reload();
            } else {
                toast.error((result as any).error || 'Backup failed');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handlePreview = async (backup: any) => {
        setSelectedBackup(backup);
        setIsLoadingPreview(true);
        try {
            const result = await getBackupPreviewAdmin(backup.fileName);
            if (result.success) {
                setPreviewData(result.metadata);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleDownload = async (backup: any) => {
        try {
            const result = await getBackupDownloadUrlAdmin(backup.fileName);
            if (result.success && result.url) {
                window.open(result.url, '_blank');
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (backup: any) => {
        if (!confirm("Are you sure? This will remove the archive from both R2 and Database.")) return;
        try {
            // Extract schoolId from fileName path: backups/schools/{schoolId}/...
            const parts = backup.fileName.split('/');
            const schoolId = parts.length >= 3 ? parts[2] : (activeSchoolId || '');
            const result = await deleteBackupFileAdmin(schoolId, backup.fileName);
            if (result.success) {
                toast.success("The backup has been permanently deleted.");
                setBackups(prev => prev.filter(b => b.fileName !== backup.fileName));
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleRestore = async (schoolId?: string) => {
        if (!selectedBackup) return;
        setIsRestoring(true);
        try {
            // Extract schoolId from the backup filename path if not passed explicitly
            const parts = selectedBackup.fileName.split('/');
            const targetSchoolId = schoolId || (parts.length >= 3 ? parts[2] : (activeSchoolId || ''));
            const result = await restoreSchoolFromBackupFileAdmin(targetSchoolId, selectedBackup.fileName);
            if (result.success) {
                toast.success("The node state has been reverted successfully.");
                setSelectedBackup(null);
            } else {
                toast.error((result as any).message || 'Restore failed');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="space-y-10 py-6">
            {/* Control Center */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h2 className={`text-4xl font-black tracking-tight ${t.textPrimary(isDark)}`}>Archive Vault</h2>
                    <p className={`text-sm font-bold opacity-60 ${t.textMuted(isDark)}`}>
                        Manage cross-node backups and historical snapshots.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSync}
                        disabled={isSyncing || !activeSchoolId}
                        variant="ghost"
                        className={`h-12 px-6 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest ${isDark ? 'hover:bg-white/5' : 'hover:bg-neutral-100'}`}
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        Sync Nodes
                    </Button>
                    <Button
                        onClick={handleInitiateBackup}
                        disabled={isBackingUp}
                        className={`h-12 px-8 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${t.btnPrimary(isDark, accent)}`}
                    >
                        <CloudUpload size={18} className={isBackingUp ? 'animate-bounce' : ''} />
                        Vault Now
                    </Button>
                </div>
            </div>

            {/* Browser Header */}
            <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-center gap-4 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-neutral-50 border-neutral-100'}`}>
                <div className="relative flex-1 w-full">
                    <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 opacity-30 ${t.textMuted(isDark)}`} />
                    <input 
                        type="text" 
                        placeholder="Scan archives by name, ID or date..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-2xl text-xs font-bold border transition-all ${isDark ? 'bg-black/40 border-white/10 focus:border-white/20' : 'bg-white border-neutral-200'}`}
                    />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-neutral-200'}`}>
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-6 h-6 rounded-full border-2 ${isDark ? 'bg-neutral-800 border-neutral-900' : 'bg-neutral-100 border-white'}`} />
                            ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight opacity-50">Active Nodes</span>
                    </div>
                </div>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredBackups.map((backup, idx) => (
                        <BackupCard 
                            key={backup.fileName}
                            backup={backup}
                            index={idx}
                            onPreview={() => handlePreview(backup)}
                            onDownload={() => handleDownload(backup)}
                            onDelete={() => handleDelete(backup)}
                            onRestore={() => handlePreview(backup)}
                        />
                    ))}
                </AnimatePresence>

                {filteredBackups.length === 0 && (
                    <div className={`col-span-full py-32 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center space-y-4 opacity-30 ${t.border(isDark)}`}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-neutral-50'}`}>
                            <Database size={40} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black">No Vaults Found</h3>
                            <p className="text-xs font-bold max-w-xs mx-auto mt-2">Initialize your first school backup to start securing institutional data.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Roadmap Section */}
            <div className={`mt-20 p-10 rounded-[3rem] border overflow-hidden relative ${isDark ? 'bg-gradient-to-br from-neutral-900 to-black border-white/5' : 'bg-slate-900 border-slate-800'}`}>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <Badge className="bg-amber-500/20 text-amber-500 border-0 font-black text-[10px] uppercase px-4 py-1.5 rounded-full">Coming Soon</Badge>
                        <h3 className="text-3xl font-black text-white">Advanced Data Sovereignty</h3>
                        <p className="text-slate-400 font-bold leading-relaxed max-w-md text-sm">
                            We're engineering granular row-level restoration, automated cross-region replication, and institutional audit trails for maximum security.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: ShieldCheck, text: "Zero Trust Enc." },
                                { icon: HardDrive, text: "Cold Storage" },
                                { icon: RefreshCw, text: "Auto Replicate" },
                                { icon: AlertCircle, text: "DR Testing" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-white/60">
                                    <item.icon size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="shrink-0 scale-110 opacity-20 md:opacity-100">
                        <Database size={240} className="text-white/5" strokeWidth={1} />
                    </div>
                </div>
            </div>

            {/* Folder Exploration Modal */}
            <BackupFolderModal 
                isOpen={!!selectedBackup}
                onClose={() => setSelectedBackup(null)}
                backup={selectedBackup}
                previewData={previewData}
                isLoading={isLoadingPreview}
                isRestoring={isRestoring}
                onRestore={handleRestore}
            />
        </div>
    );
}
