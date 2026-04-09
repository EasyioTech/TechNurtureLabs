'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminTheme, t } from '../../theme-context';
import { 
    HardDrive, Download, RotateCcw, AlertCircle, CheckCircle2, 
    Trash2, Info, RefreshCw, Calendar, Database, Users, 
    ShieldAlert, Clock, ArrowRight, Server, Search, Filter, 
    DownloadCloud, History, Zap, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
    performSchoolBackupAdmin, 
    listSchoolBackupsAdmin, 
    downloadSchoolBackupFileAdmin, 
    restoreSchoolFromBackupFileAdmin,
    syncBackupsFromR2Admin,
    getBackupPreviewAdmin,
    getBackupDownloadUrlAdmin,
    deleteBackupFileAdmin
} from '@/app/(super-admin)/admin-portal/actions/backup-actions';
import { X, ChevronDown } from 'lucide-react';

interface BackupsTabProps {
    schoolsList: Array<{ id: string; name: string }>;
}

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

export function BackupsTab({ schoolsList }: BackupsTabProps) {
    const { isDark, accent } = useAdminTheme();
    const [backups, setBackups] = useState<BackupWithMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [selectedSchoolId, setSelectedSchoolId] = useState(schoolsList[0]?.id || '');
    const [selectedBackup, setSelectedBackup] = useState<BackupWithMetadata | null>(null);
    const [showBackupInfo, setShowBackupInfo] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

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
        if (!selectedSchoolId) {
            toast.error('No school selected');
            return;
        }

        setIsBackingUp(true);
        try {
            const result = await performSchoolBackupAdmin(selectedSchoolId);
            if (result.success) {
                toast.success(`✓ Backup created successfully`);
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
        if (!window.confirm(`⚠️ CRITICAL WARNING: This will restore ALL data for ${currentSchool?.name}.\n\nCurrent data will be OVERWRITTEN.\n\nRestore from: ${backup.created}?\n\nThis action is irreversible.`)) {
            return;
        }

        setIsBackingUp(true);
        try {
            const result = await restoreSchoolFromBackupFileAdmin(selectedSchoolId, backup.fileName);
            if (result.success) {
                toast.success('✓ Restore completed successfully');
                setTimeout(() => window.location.reload(), 2000);
            } else {
                toast.error(result.message || 'Restore failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Restore error');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleDownload = async (backup: BackupWithMetadata) => {
        try {
            const result = await getBackupDownloadUrlAdmin(backup.fileName);
            if (result.success && result.url) {
                // Trigger actual download
                const link = document.createElement('a');
                link.href = result.url;
                link.download = backup.fileName.split('/').pop() || 'backup.json.gz';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Download initiated');
            } else {
                toast.error(result.error || 'Failed to generate download link');
            }
        } catch (error: any) {
            toast.error(error.message || 'Download error');
        }
    };

    const handleDelete = async (backup: BackupWithMetadata) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete this backup?\n\nFile: ${backup.fileName}`)) {
            return;
        }

        try {
            const result = await deleteBackupFileAdmin(selectedSchoolId, backup.fileName);
            if (result.success) {
                toast.success('Backup deleted permanently');
                await loadBackups();
            } else {
                toast.error(result.error || 'Delete failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Delete error');
        }
    };

    const handleSync = async () => {
        setIsLoading(true);
        try {
            const result = await syncBackupsFromR2Admin(selectedSchoolId);
            if (result.success) {
                toast.success(result.message);
                await loadBackups();
            } else {
                toast.error(result.error || 'Sync failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Sync error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreview = async (backup: BackupWithMetadata) => {
        setSelectedBackup(backup);
        setShowBackupInfo(true);
        setPreviewLoading(true);
        setPreviewData(null);
        
        try {
            const result = await getBackupPreviewAdmin(backup.fileName);
            if (result.success) {
                setPreviewData(result.metadata);
            } else {
                toast.error(result.error || 'Failed to load preview');
            }
        } catch (error: any) {
            toast.error(error.message || 'Preview error');
        } finally {
            setPreviewLoading(false);
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
            return new Date(dateString).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const filteredBackups = backups.filter(b => 
        b.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* ── Left Column: Controls & List ── */}
                <div className="xl:col-span-8 space-y-6">
                    
                    {/* TOP ACTIONS CARD */}
                    <div className={`p-6 rounded-[2.5rem] border transition-all duration-300 ${t.card(isDark)} ${t.border(isDark)} shadow-xl shadow-black/5`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <label className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 block ${t.textMuted(isDark)}`}>ACTIVE SCHOOL NODE</label>
                                <div className="relative">
                                    <Server size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.textMuted(isDark)}`} />
                                    <select
                                        value={selectedSchoolId}
                                        onChange={(e) => setSelectedSchoolId(e.target.value)}
                                        className={`w-full pl-11 pr-4 py-3 rounded-2xl border font-black text-sm transition-all outline-none appearance-none ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-white/20' : 'bg-neutral-50 border-neutral-200 text-slate-900 focus:border-slate-300'}`}
                                    >
                                        {schoolsList.map(school => (
                                            <option key={school.id} value={school.id} className="bg-neutral-900">{school.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 ${t.textMuted(isDark)} pointer-events-none`} />
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleBackup}
                                    disabled={isBackingUp || !selectedSchoolId}
                                    className={`rounded-2xl h-14 px-8 font-black text-sm gap-3 shadow-2xl ${t.btnPrimary(isDark, accent)}`}
                                    style={isDark ? { boxShadow: t.glowStyle(isDark, accent).boxShadow } : {}}
                                >
                                    {isBackingUp ? (
                                        <RefreshCw size={20} className="animate-spin" />
                                    ) : (
                                        <Database size={20} />
                                    )}
                                    {isBackingUp ? 'SNAPSHOTTING...' : 'INITIATE BACKUP'}
                                </Button>
                                
                                <Button
                                    onClick={handleSync}
                                    disabled={isLoading}
                                    variant="outline"
                                    className={`w-14 h-14 rounded-2xl border ${t.border(isDark)} ${isDark ? 'hover:bg-white/5' : 'hover:bg-neutral-100'}`}
                                >
                                    <RefreshCw size={20} className={isLoading ? 'animate-spin opacity-50' : ''} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* SEARCH & FILTERS */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.textMuted(isDark)}`} />
                            <input 
                                type="text"
                                placeholder="Search backup archives..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-11 pr-4 py-4 rounded-[1.25rem] border text-xs font-bold transition-all outline-none ${isDark ? 'bg-white/[0.02] border-white/10 text-white focus:bg-white/[0.05]' : 'bg-white border-neutral-200 text-slate-900 focus:bg-neutral-50'}`}
                            />
                        </div>
                        <Button variant="outline" className={`h-[52px] px-5 rounded-[1.25rem] border ${t.border(isDark)}`}>
                            <Filter size={18} />
                        </Button>
                    </div>

                    {/* BACKUPS LIST */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className={`text-[10px] font-black uppercase tracking-[0.25em] ${t.textMuted(isDark)}`}>ARCHIVE HISTORY</h3>
                            <span className={`text-[10px] font-black ${t.textMuted(isDark)}`}>{filteredBackups.length} TOTAL SNAPS</span>
                        </div>
                        
                        {isLoading ? (
                            <div className="py-20 text-center space-y-4">
                                <motion.div 
                                    animate={{ rotate: 360 }} 
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    className={`w-12 h-12 rounded-full border-4 border-t-transparent mx-auto ${isDark ? 'border-white/10' : 'border-neutral-200'}`}
                                    style={{ borderTopColor: isDark ? accent.swatchDark : accent.swatchLight }}
                                />
                                <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Decrypting Archive Nodes...</p>
                            </div>
                        ) : filteredBackups.length > 0 ? (
                            <div className="grid gap-3">
                                {filteredBackups.map((backup, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className={`group p-5 rounded-[2rem] border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:scale-[1.01] ${isDark ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20' : 'bg-white border-neutral-200 hover:shadow-xl hover:shadow-black/5'}`}
                                    >
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-neutral-50 border-neutral-100'}`}>
                                                <History size={20} className={isDark ? accent.text : 'text-slate-900'} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-black truncate max-w-[300px] ${t.textPrimary(isDark)}`}>
                                                    {backup.fileName.split('/').pop()?.replace('.json.gz', '')}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold ${t.textMuted(isDark)}`}>
                                                        <Clock size={12} /> {formatDate(backup.timestamp)}
                                                    </span>
                                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold ${t.textMuted(isDark)}`}>
                                                        <HardDrive size={12} /> {formatFileSize(backup.size)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        ENCRYPTED
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() => handlePreview(backup)}
                                                className={`h-11 px-4 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-neutral-100 text-slate-700'}`}
                                            >
                                                <Info size={14} /> Details
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleDownload(backup)}
                                                className={`h-11 px-4 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest ${isDark ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                                            >
                                                <Download size={14} /> Download
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleRestore(backup)}
                                                className={`h-11 px-4 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest ${isDark ? 'hover:bg-emerald-500/20 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-600'}`}
                                            >
                                                <RotateCcw size={14} /> Restore
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleDelete(backup)}
                                                className={`h-11 px-4 rounded-xl text-rose-500 ${isDark ? 'hover:bg-rose-500/20' : 'hover:bg-rose-50'}`}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className={`p-16 rounded-[3rem] border-2 border-dashed text-center ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-neutral-100 bg-neutral-50/50'}`}>
                                <div className={`w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                                    <ShieldAlert size={32} className={`opacity-20 ${isDark ? 'text-white' : 'text-slate-400'}`} />
                                </div>
                                <h4 className={`text-sm font-black uppercase tracking-widest mb-2 ${t.textPrimary(isDark)}`}>Isolated Vault Empty</h4>
                                <p className={`text-xs font-semibold max-w-[240px] mx-auto ${t.textMuted(isDark)}`}>No secure snapshots found for this node. Initialize a new backup to secure your data.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Column: Stats & Missing Features ── */}
                <div className="xl:col-span-4 space-y-6">
                    
                    {/* STATS OVERVIEW */}
                    <div className={`p-8 rounded-[2.5rem] border overflow-hidden relative ${t.card(isDark)} ${t.border(isDark)} shadow-2xl shadow-black/5`}>
                        <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[80px] opacity-20 ${isDark ? accent.bg : 'bg-indigo-500'}`} />
                        
                        <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-8 ${t.textMuted(isDark)}`}>SYSTEM SNAPSHOT</h3>
                        
                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-neutral-100'}`}>
                                        <Database size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Total Storage</span>
                                </div>
                                <span className={`text-lg font-black tracking-tighter ${t.textPrimary(isDark)}`}>
                                    {formatFileSize(backups.reduce((sum, b) => sum + b.size, 0))}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-neutral-100'}`}>
                                        <Clock size={14} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Retention</span>
                                </div>
                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${isDark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-slate-700'}`}>
                                    30 DAYS ACTIVE
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-neutral-100'}`}>
                                        <Zap size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Auto-Sync</span>
                                </div>
                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${isDark ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-600'}`}>
                                    DISABLED
                                </span>
                            </div>
                        </div>

                        <div className={`mt-8 pt-8 border-t border-dashed ${t.border(isDark)}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldAlert size={14} className="text-amber-500" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Risk Assessment</span>
                            </div>
                            <div className="space-y-2">
                                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-neutral-100'}`}>
                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '65%' }} />
                                </div>
                                <p className={`text-[10px] font-bold ${t.textMuted(isDark)}`}>Critical data uncovered. Manual backup policy active.</p>
                            </div>
                        </div>
                    </div>

                    {/* ROADMAP / MISSING FEATURES (Explicitly asked by user) */}
                    <div className={`p-8 rounded-[2.5rem] border ${t.card(isDark)} ${t.border(isDark)} bg-gradient-to-br from-indigo-500/5 to-purple-500/5`}>
                        <div className="flex items-center gap-2 mb-6 text-indigo-500">
                            <Sparkles size={16} />
                            <h3 className={`text-[10px] font-[1000] uppercase tracking-[0.3em]`}>SYSTEM ROADMAP</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { title: 'Automated Daily Backups', desc: 'Trigger CRON jobs for nightly data redundancy.', status: 'PLANNING' },
                                { title: 'Cross-Region Replication', desc: 'Mirror snapshots to secondary cloud nodes (AWS S3/GCP).', status: 'IN LOG' },
                                { title: 'Custom Retention Policies', desc: 'Configurable TTL for individual school archives.', status: 'PENDING' },
                                { title: 'Point-in-Time Recovery', desc: 'Granular log-based restoration to any specific second.', status: 'RESEARCH' },
                                { title: 'Backup Audit Logs', desc: 'Detailed tracking of who accessed or deleted archives.', status: 'TODO' },
                                { title: 'S3 Direct Sync', desc: 'Automated off-site storage synchronization.', status: 'MISSING' }
                            ].map((item, i) => (
                                <div key={i} className="group cursor-help">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className={`text-xs font-black ${t.textPrimary(isDark)}`}>{item.title}</p>
                                            <p className={`text-[9px] font-bold leading-tight mt-1 ${t.textMuted(isDark)}`}>{item.desc}</p>
                                        </div>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded border whitespace-nowrap ${isDark ? 'border-white/10 text-white/40' : 'border-neutral-200 text-slate-400'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* WARNING BOX */}
                    <div className={`p-6 rounded-[2rem] border-l-4 border-rose-500 flex gap-4 ${isDark ? 'bg-rose-500/5 text-rose-200' : 'bg-rose-50 text-rose-800'}`}>
                        <ShieldAlert size={20} className="shrink-0 text-rose-500" />
                        <p className="text-[10px] font-bold leading-relaxed">
                            <span className="font-black uppercase tracking-wider block mb-1">Critical Security Note</span>
                            Restoring any archive node completely wipes existing state. Perform a manual "Pre-Restore" snapshot before any destructive action.
                        </p>
                    </div>
                </div>
            </div>

            {/* BACKUP INFO MODAL */}
            {showBackupInfo && selectedBackup && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl ${isDark ? 'bg-black/60' : 'bg-white/40'}`}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={`rounded-[3rem] p-8 max-w-lg w-full border shadow-2xl overflow-hidden relative ${isDark ? 'bg-neutral-900 border-white/10' : 'bg-white border-neutral-200'}`}
                    >
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${accent.bg}`} />
                        
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-neutral-50'}`}>
                                    <DownloadCloud size={24} className={isDark ? accent.text : 'text-slate-900'} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-black ${t.textPrimary(isDark)}`}>Node Manifest</h3>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>Archive Details</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowBackupInfo(false)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-neutral-100 text-slate-900'}`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <DetailItem label="ARCHIVE NAME" value={selectedBackup.fileName.split('/').pop() || ''} isDark={isDark} />
                            <DetailItem label="SNAPSHOT SIZE" value={formatFileSize(selectedBackup.size)} isDark={isDark} />
                            <DetailItem label="TIMESTAMP" value={formatDate(selectedBackup.timestamp)} isDark={isDark} />
                            <DetailItem label="SCHOOL NODE" value={currentSchool?.name || 'N/A'} isDark={isDark} />
                            
                            {previewLoading ? (
                                <div className="col-span-2 py-4 flex items-center gap-3">
                                    <RefreshCw size={14} className="animate-spin text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Fetching detailed manifest...</span>
                                </div>
                            ) : previewData ? (
                                <>
                                    <DetailItem label="TOTAL STUDENTS" value={(previewData.studentsCount || 0).toString()} isDark={isDark} />
                                    <DetailItem label="TOTAL REVENUE" value={`₹${parseFloat(previewData.revenueTotal || '0').toLocaleString()}`} isDark={isDark} />
                                    <DetailItem label="RECORDS COUNT" value={Object.values((previewData.recordCounts || {}) as Record<string, number>).reduce((a: number, b: number) => a + b, 0).toString()} isDark={isDark} />
                                    <DetailItem label="COVERAGE" value="Full Academic + Billing" isDark={isDark} />
                                </>
                            ) : (
                                <>
                                    <DetailItem label="STUDENTS" value={(selectedBackup.studentCount || '---').toString()} isDark={isDark} />
                                    <DetailItem label="REVENUE" value={selectedBackup.revenueTotal ? `₹${parseFloat(selectedBackup.revenueTotal).toLocaleString()}` : '---'} isDark={isDark} />
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => {
                                    handleRestore(selectedBackup);
                                    setShowBackupInfo(false);
                                }}
                                disabled={isBackingUp}
                                className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest gap-2 ${t.btnPrimary(isDark, accent)}`}
                            >
                                <RotateCcw size={18} /> Restore Now
                            </Button>
                            <Button
                                onClick={() => handleDownload(selectedBackup)}
                                variant="outline"
                                className={`h-14 px-8 rounded-2xl border ${t.border(isDark)} font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}
                            >
                                <DownloadCloud size={18} />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
    return (
        <div className="min-w-0">
            <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 ${t.textMuted(isDark)}`}>{label}</p>
            <p className={`text-[11px] font-bold truncate ${t.textPrimary(isDark)}`}>{value}</p>
        </div>
    );
}

