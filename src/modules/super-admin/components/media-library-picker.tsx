'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminTheme, t } from '../theme-context';
import {
    Film, FileText, ImageIcon, Search, Loader2,
    Cloud, HardDrive, AlertCircle, Trash2, Check, Upload, Folder
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpload } from '@/hooks/use-upload';
import { UploadProgress } from '@/components/shared/upload-progress';
import { uploadStore } from '@/lib/upload-store';

type AssetType = 'all' | 'video' | 'image' | 'document';

interface MediaAsset {
    id: string;
    file_name: string;
    original_name: string;
    file_url: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    storage_type: 'r2' | 'local';
    asset_type: 'video' | 'image' | 'document';
    created_at: string;
}

interface MediaLibraryPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (url: string) => void;
    /** If set, only assets of this type are shown */
    filterType?: 'video' | 'image' | 'document';
    /** Current selected URL to highlight */
    currentUrl?: string;
    /** Filter by folder */
    folder?: string;
}

function formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function AssetIcon({ asset_type, mime_type, className }: { asset_type: string; mime_type: string; className?: string }) {
    if (asset_type === 'video') return <Film size={20} className={className} />;
    if (asset_type === 'image') return <ImageIcon size={20} className={className} />;
    return <FileText size={20} className={className} />;
}

const TABS: { id: AssetType; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All', icon: HardDrive },
    { id: 'video', label: 'Videos', icon: Film },
    { id: 'image', label: 'Images', icon: ImageIcon },
    { id: 'document', label: 'Docs', icon: FileText },
];

export function MediaLibraryPicker({
    open, onOpenChange, onSelect, filterType, currentUrl, folder
}: MediaLibraryPickerProps) {
    const { isDark, accent } = useAdminTheme();
    const [assets, setAssets] = React.useState<MediaAsset[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState<AssetType>(filterType ?? 'all');
    const [activeFolder, setActiveFolder] = React.useState<string>(folder ?? 'all');
    const [search, setSearch] = React.useState('');
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [uploadFile, setUploadFile] = React.useState<File | null>(null);
    const [storagePref, setStoragePref] = React.useState<'r2' | 'local'>('r2');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const { upload, progress, isUploading, error: uploadError, reset: resetUpload, abort, uploadId } = useUpload({
        onSuccess: () => {
            toast.success('Upload complete');
            setUploadFile(null);
            loadAssets(activeTab);
        },
        onError: (err) => {
            toast.error(err || 'Failed to upload file');
        }
    });

    // Notify upload store that this upload is being handled locally in this dialog
    React.useEffect(() => {
        if (isUploading) {
            uploadStore.updateTask(uploadId, { isLocalVisible: true });
        }
        return () => {
            uploadStore.updateTask(uploadId, { isLocalVisible: false });
        };
    }, [uploadId, isUploading]);

    // Load assets when the sheet opens
    React.useEffect(() => {
        if (!open) return;
        setActiveTab(filterType ?? 'all');
        loadAssets(filterType ?? 'all');
    }, [open, filterType]);

    async function loadAssets(type: AssetType, targetFolder: string = activeFolder) {
        setLoading(true);
        setError(null);
        try {
            const folderQuery = targetFolder !== 'all' ? `&folder=${targetFolder}` : '';
            const url = type === 'all'
                ? `/api/media/library?_t=${Date.now()}${folderQuery}`
                : `/api/media/library?type=${type}${folderQuery}`;
            const res = await fetch(url);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
                throw new Error(errorData.details || errorData.error || 'Failed to load library');
            }
            const data = await res.json();
            setAssets(data);
        } catch (err: any) {
            console.error('[Media Library] Load error:', err);
            setError(err.message || 'Could not load the media library. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleTabChange(tab: AssetType) {
        // Allow switching between visible tabs (e.g. "All" and "Videos")
        setActiveTab(tab);
        loadAssets(tab);
    }

    async function handleDelete(asset: MediaAsset, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm(`Delete "${asset.original_name}"? This cannot be undone.`)) return;
        setDeletingId(asset.id);
        try {
            const res = await fetch(`/api/media/library/${asset.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setAssets(prev => prev.filter(a => a.id !== asset.id));
            toast.success('Asset deleted');
        } catch {
            toast.error('Failed to delete asset');
        } finally {
            setDeletingId(null);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const isVideo = filterType === 'video';
        const isImage = filterType === 'image';

        if (isVideo) {
            const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
            if (!validVideoTypes.includes(file.type)) {
                toast.error('Invalid video format. Please upload MP4 or WebM.');
                return;
            }
        } else if (isImage) {
            const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
            if (!validImageTypes.includes(file.type)) {
                toast.error('Invalid image type. Please upload PNG, JPG, or SVG.');
                return;
            }
        }

        const maxSize = 2048 * 1024 * 1024; // 2GB limit for all videos and other files
        const maxImageSize = 25 * 1024 * 1024; // 25MB for images

        if (isImage && file.size > maxImageSize) {
            toast.error('Image too large. Maximum size is 25MB.');
            return;
        }

        if (file.size > maxSize) {
            toast.error('File too large. Maximum size is 2GB.');
            return;
        }

        setUploadFile(file);
        
        const additionalData: Record<string, string> = {
            purpose: filterType === 'video' ? 'system_video' : 'library',
            storagePreference: storagePref
        };
        const folderToSave = folder || (activeFolder !== 'all' ? activeFolder : 'library');
        additionalData.folder = folderToSave;

        try {
            await upload(file, additionalData);
        } catch (err: any) {
            console.error('[Upload]', err);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const filtered = assets.filter(a =>
        a.original_name.toLowerCase().includes(search.toLowerCase())
    );

    const visibleTabs = filterType
        ? TABS.filter(t => t.id === filterType || t.id === 'all')
        : TABS;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className={`w-full sm:max-w-[560px] p-0 flex flex-col border-0 ${isDark ? 'bg-[#0a0d13]' : 'bg-white'}`}
            >
                {/* Header */}
                <SheetHeader className={`px-6 pt-6 pb-4 border-b shrink-0 ${t.border(isDark)}`}>
                    <SheetTitle className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${accent.bg} text-slate-900`}>
                            <ImageIcon size={16} />
                        </div>
                        <div className="text-left flex-1">
                            <h2 className={`text-lg font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                                Media Library
                            </h2>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>
                                Select a previously uploaded asset
                            </p>
                        </div>

                        <Button
                            size="sm"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className={`rounded-full h-8 px-4 text-xs font-black uppercase tracking-wider ${accent.bg} text-slate-900 shrink-0`}
                        >
                            {isUploading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Upload size={14} className="mr-1.5" />}
                            Upload New
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleUpload}
                            accept={filterType === 'video' ? 'video/*' : filterType === 'image' ? 'image/*' : undefined}
                        />
                    </SheetTitle>

                    {/* Storage Preference Toggle */}
                    <div className="flex items-center gap-3 mt-4 px-1">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
                            Storage Destination:
                        </p>
                        <div className={`p-1 rounded-full flex gap-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                            {[
                                { id: 'r2', label: 'Cloud (R2)', icon: Cloud },
                                { id: 'local', label: 'Local Server', icon: HardDrive }
                            ].map(opt => {
                                const isActive = storagePref === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setStoragePref(opt.id as 'r2' | 'local')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all
                                            ${isActive 
                                                ? (isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-sm') 
                                                : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}
                                    >
                                        <opt.icon size={10} />
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mt-4">
                        <Search size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.textMuted(isDark)}`} />
                        <Input
                            placeholder="Search by filename..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className={`rounded-full h-10 pl-10 pr-4 text-sm font-medium border-2 focus-visible:ring-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] text-white border-white/5' : 'bg-slate-50 border-slate-200'}`}
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-3">
                        {visibleTabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight transition-all border-2
                                        ${isActive
                                            ? (isDark ? `${accent.bg} text-slate-900 border-${accent.name}-400` : `${accent.bg} text-slate-900 border-${accent.name}-400`)
                                            : (isDark ? 'bg-transparent text-slate-400 border-white/10 hover:bg-white/5' : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50')}`}
                                >
                                    <tab.icon size={11} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                {/* Folders */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                        {[
                            { id: 'all', label: 'All Assets', color: 'text-slate-400' },
                            { id: 'lesson', label: 'Lessons', color: 'text-sky-400' },
                            { id: 'course', label: 'Courses', color: 'text-indigo-400' },
                            { id: 'branding', label: 'Branding', color: 'text-amber-400' },
                            { id: 'library', label: 'General', color: 'text-emerald-400' },
                            { id: 'video', label: 'Videos', color: 'text-rose-400' },
                        ].map(f => {
                            const isActive = activeFolder === f.id;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => { setActiveFolder(f.id); loadAssets(activeTab, f.id); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap border-2
                                        ${isActive
                                            ? (isDark ? `${accent.bg} text-slate-900 border-white shadow-lg` : `${accent.bg} text-slate-900 border-slate-900 shadow-lg`)
                                            : (isDark ? 'bg-white/[0.03] border-white/5 text-slate-500 hover:bg-white/[0.06]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100')}`}
                                >
                                    <Folder size={12} className={isActive ? 'text-slate-900' : f.color} />
                                    {f.label}
                                </button>
                            );
                        })}
                    </div>
                </SheetHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {uploadFile && (
                        <UploadProgress
                            progress={progress}
                            fileName={uploadFile.name}
                            isUploading={isUploading}
                            error={uploadError}
                            onCancel={abort}
                            onReset={resetUpload}
                            isDark={isDark}
                        />
                    )}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <Loader2 size={28} className={`animate-spin ${isDark ? accent.text : 'text-slate-900'}`} />
                            <p className={`text-sm font-bold ${t.textMuted(isDark)}`}>Loading library...</p>
                        </div>
                    ) : error ? (
                        <div className={`flex flex-col items-center justify-center h-48 gap-3 rounded-2xl border-2 ${isDark ? 'border-rose-500/20 bg-rose-500/5' : 'border-rose-200 bg-rose-50'}`}>
                            <AlertCircle size={28} className="text-rose-500" />
                            <p className={`text-sm font-bold text-center ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{error}</p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadAssets(activeTab)}
                                className="rounded-full font-bold text-xs"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                                <ImageIcon size={24} className={t.textMuted(isDark)} />
                            </div>
                            <p className={`text-sm font-bold ${t.textMuted(isDark)}`}>
                                {search ? 'No assets match your search.' : 'No assets uploaded yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filtered.map(asset => {
                                const isSelected = asset.file_url === currentUrl;
                                const isDeleting = deletingId === asset.id;
                                return (
                                    <div
                                        key={asset.id}
                                        className={`relative group/card text-left rounded-2xl border-2 overflow-hidden transition-all cursor-pointer
                                            ${isSelected
                                                ? (isDark ? `border-${accent.name}-400 ring-2 ring-${accent.name}-400/20` : `border-${accent.name}-400 ring-2 ring-${accent.name}-400/10`)
                                                : (isDark ? 'border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]' : 'border-slate-100 hover:border-slate-300 bg-slate-50 hover:bg-white')
                                            } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => {
                                            if (isDeleting) return;
                                            onSelect(asset.file_url);
                                            onOpenChange(false);
                                        }}
                                    >
                                        {/* Preview area */}
                                        <div className={`aspect-video relative flex items-center justify-center ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}>
                                            {asset.asset_type === 'image' ? (
                                                <img
                                                    src={asset.file_url}
                                                    alt={asset.original_name}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            ) : asset.asset_type === 'video' ? (
                                                <div className="w-full h-full relative group/video">
                                                    <video
                                                        src={asset.file_url}
                                                        className="w-full h-full object-cover"
                                                        preload="metadata"
                                                        muted
                                                        onMouseOver={e => (e.target as HTMLVideoElement).play()}
                                                        onMouseOut={e => {
                                                            const v = e.target as HTMLVideoElement;
                                                            v.pause();
                                                            v.currentTime = 0;
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-transparent transition-all">
                                                        <Film size={20} className="text-white drop-shadow-lg" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <AssetIcon
                                                    asset_type={asset.asset_type}
                                                    mime_type={asset.mime_type}
                                                    className={isDark ? 'text-slate-400' : 'text-slate-500'}
                                                />
                                            )}

                                            {/* Selected check */}
                                            {isSelected && (
                                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${accent.bg} text-slate-900`}>
                                                    <Check size={12} strokeWidth={3} />
                                                </div>
                                            )}

                                            {/* Storage badge */}
                                            <div className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase
                                                ${asset.storage_type === 'r2'
                                                    ? (isDark ? `${accent.softDark.split(' ').slice(0, 2).join(' ')}` : `${accent.softLight.split(' ').slice(0, 2).join(' ')}`)
                                                    : (isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500')}`}
                                            >
                                                {asset.storage_type === 'r2' ? <Cloud size={8} /> : <HardDrive size={8} />}
                                                {asset.storage_type === 'r2' ? 'R2' : 'Local'}
                                            </div>

                                            {/* Delete button on hover */}
                                            <button
                                                type="button"
                                                onClick={e => handleDelete(asset, e)}
                                                disabled={isDeleting}
                                                className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity
                                                    ${isDark ? 'bg-rose-500/80 text-white hover:bg-rose-500' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
                                                title="Delete"
                                            >
                                                {isDeleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                                            </button>
                                        </div>

                                        {/* Info */}
                                        <div className="p-2.5 space-y-0.5">
                                            <p className={`text-[11px] font-black truncate ${t.textPrimary(isDark)}`}>
                                                {asset.original_name}
                                            </p>
                                            <p className={`text-[9px] font-bold uppercase tracking-wider ${t.textMuted(isDark)}`}>
                                                {formatBytes(asset.file_size)} · {asset.asset_type}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
