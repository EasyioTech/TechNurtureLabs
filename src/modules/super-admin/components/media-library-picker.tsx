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
import { useAuth } from '@/components/providers/auth-provider';

type AssetType = 'all' | 'video' | 'image' | 'document' | 'cloudflare_stream';

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
    onSelect: (url: string, assetId: string) => void;
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
    { id: 'all', label: 'All Cloud Assets', icon: HardDrive },
    { id: 'video', label: 'R2 Videos', icon: Film },
    { id: 'cloudflare_stream', label: 'Stream Videos', icon: Cloud },
    { id: 'image', label: 'Cloud Images', icon: ImageIcon },
    { id: 'document', label: 'Cloud Documents', icon: FileText },
];

const FOLDERS = [
    { id: 'all', label: 'All Assets', color: 'text-slate-400' },
    { id: 'lesson', label: 'Lessons', color: 'text-sky-400' },
    { id: 'course', label: 'Courses', color: 'text-indigo-400' },
    { id: 'branding', label: 'Branding', color: 'text-amber-400' },
    { id: 'library', label: 'General', color: 'text-emerald-400' },
];

export function MediaLibraryPicker({
    open, onOpenChange, onSelect, filterType, currentUrl, folder
}: MediaLibraryPickerProps) {
    const { profile } = useAuth();
    const isSuperAdmin = profile?.role === 'super_admin';

    // Strictly restrict rendering to Super Admins
    if (!isSuperAdmin) return null;

    const { isDark, accent } = useAdminTheme();
    const [assets, setAssets] = React.useState<MediaAsset[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [loadingMore, setLoadingMore] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [error, setError] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState<AssetType>(filterType ?? 'all');
    const [activeFolder, setActiveFolder] = React.useState<string>(folder ?? 'all');
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [uploadFile, setUploadFile] = React.useState<File | null>(null);
    const [storagePref, setStoragePref] = React.useState<'r2' | 'local'>('r2');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Always-fresh refs for use inside callbacks (avoids stale closure in useUpload.onSuccess)
    const activeTabRef        = React.useRef(activeTab);
    const activeFolderRef     = React.useRef(activeFolder);
    const debouncedSearchRef  = React.useRef(debouncedSearch);
    React.useEffect(() => { activeTabRef.current       = activeTab;       }, [activeTab]);
    React.useEffect(() => { activeFolderRef.current    = activeFolder;    }, [activeFolder]);
    React.useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);

    // Helper to get CSRF token from cookies
    const getCsrfToken = () => document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token='))
        ?.split('=')[1];

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const { upload, progress, isUploading, error: uploadError, reset: resetUpload, abort, uploadId } = useUpload({
        onSuccess: () => {
            toast.success('Upload complete');
            setUploadFile(null);
            setPage(1);
            // Read the latest tab/folder/search — callbacks capture refs, not stale closures
            const tab    = activeTabRef.current;
            const folder = activeFolderRef.current;
            const search = debouncedSearchRef.current;
            if (tab === 'cloudflare_stream') {
                loadStreamVideos(search);
            } else {
                loadAssets(tab, folder, 1, search, false);
            }
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
            if (uploadId) uploadStore.updateTask(uploadId, { isLocalVisible: false });
        };
    }, [uploadId, isUploading]);

    // Reset state and load assets whenever the sheet opens or the filter/folder props change
    React.useEffect(() => {
        if (!open) return;
        const isVideoMode = filterType === 'video';
        const newTab = isVideoMode ? 'cloudflare_stream' : (filterType ?? 'all');
        const newFolder = folder ?? 'all';
        
        setActiveTab(newTab);
        setActiveFolder(newFolder);
        setSearch('');
        setPage(1);
        
        if (newTab === 'cloudflare_stream') {
            loadStreamVideos('');
        } else {
            loadAssets(newTab, newFolder, 1, '', false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, filterType, folder]);

    // Trigger load on debounced search
    React.useEffect(() => {
        if (!open) return;
        setPage(1);
        if (activeTab === 'cloudflare_stream') {
            loadStreamVideos(debouncedSearch);
        } else {
            loadAssets(activeTab, activeFolder, 1, debouncedSearch, false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const [streamVideos, setStreamVideos] = React.useState<any[]>([]);
    async function loadStreamVideos(query: string = '') {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (query) params.set('search', query);
            const res = await fetch(`/api/media/stream-list?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load stream videos');
            const data = await res.json();
            setStreamVideos(data.videos || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadAssets(type: AssetType, targetFolder: string, targetPage: number, query: string, append: boolean) {
        if (append) setLoadingMore(true);
        else setLoading(true);

        setError(null);
        try {
            const params = new URLSearchParams({
                page: targetPage.toString(),
                limit: '24'
            });
            if (type !== 'all' && type !== 'cloudflare_stream') params.set('type', type);
            // Send folder prefix that the backend can filter with (e.g., "lesson" matches "lessons/*/...")
            if (targetFolder !== 'all') params.set('folder', targetFolder);
            if (query) params.set('search', query);

            // Force fresh data by adding cache-bust header
            const res = await fetch(`/api/media/library?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, max-age=0',
                    'Pragma': 'no-cache',
                    'X-Requested-Timestamp': Date.now().toString()
                },
                cache: 'no-store'
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
                throw new Error(errorData.details || errorData.error || 'Failed to load library');
            }
            const data = await res.json();
            
            if (append) {
                setAssets(prev => [...prev, ...data.assets]);
            } else {
                setAssets(data.assets);
            }
            
            setHasMore(data.pagination.currentPage < data.pagination.pages);
        } catch (err: any) {
            console.error('[Media Library] Load error:', err);
            setError(err.message || 'Could not load the media library. Please try again.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    function handleLoadMore() {
        if (loadingMore || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadAssets(activeTab, activeFolder, nextPage, debouncedSearch, true);
    }

    function handleTabChange(tab: AssetType) {
        setActiveTab(tab);
        setPage(1);
        if (tab === 'cloudflare_stream') {
            loadStreamVideos(debouncedSearch);
        } else {
            loadAssets(tab, activeFolder, 1, debouncedSearch, false);
        }
    }

    function handleFolderChange(folderId: string) {
        setActiveFolder(folderId);
        setPage(1);
        loadAssets(activeTab, folderId, 1, debouncedSearch, false);
    }

    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [isMultiSelect, setIsMultiSelect] = React.useState(false);

    async function handleSelection(asset: MediaAsset) {
        if (isMultiSelect) {
            setSelectedIds(prev => 
                prev.includes(asset.id) 
                    ? prev.filter(id => id !== asset.id) 
                    : [...prev, asset.id]
            );
        } else {
            onSelect(asset.file_url, asset.id);
            onOpenChange(false);
        }
    }

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return;
        if (!confirm(`Delete ${selectedIds.length} assets permanently?`)) return;
        
        setLoading(true);
        try {
            const csrfToken = getCsrfToken();
            const res = await fetch('/api/media/library/bulk-delete', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
                },
                body: JSON.stringify({ ids: selectedIds })
            });
            if (!res.ok) throw new Error('Bulk delete failed');
            
            setAssets(prev => prev.filter(a => !selectedIds.includes(a.id)));
            setSelectedIds([]);
            setIsMultiSelect(false);
            toast.success(`Deleted ${selectedIds.length} assets`);
        } catch (err) {
            toast.error('Failed to delete assets');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(asset: MediaAsset, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm(`Delete "${asset.original_name}"? This cannot be undone.`)) return;
        setDeletingId(asset.id);
        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(`/api/media/library/${asset.id}`, { 
                method: 'DELETE',
                headers: {
                    ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
                }
            });
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
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        } else if (isImage) {
            const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];
            if (!validImageTypes.includes(file.type)) {
                toast.error('Invalid image type. Please upload PNG, JPG, SVG, WEBP or GIF.');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }

        const maxSize = 2048 * 1024 * 1024; // 2GB limit
        const maxImageSize = 25 * 1024 * 1024; // 25MB for images

        if (isImage && file.size > maxImageSize) {
            toast.error('Image too large. Maximum size is 25MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (file.size > maxSize) {
            toast.error('File too large. Maximum size is 2GB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploadFile(file);

        const folderToSave = folder || (activeFolder !== 'all' ? activeFolder : 'library');
        const additionalData: Record<string, string> = {
            purpose: filterType === 'video' ? 'system_video' : 'library',
            storagePreference: storagePref,
            folder: folderToSave,
        };

        try {
            await upload(file, additionalData);
        } catch (err: any) {
            console.error('[Upload]', err);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const visibleTabs = filterType
        ? TABS.filter(tab => {
            if (tab.id === 'all') return true;
            if (filterType === 'video') return tab.id === 'video' || tab.id === 'cloudflare_stream';
            return tab.id === filterType;
        })
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
                            {filterType === 'video' ? <Film size={16} /> : <ImageIcon size={16} />}
                        </div>
                        <div className="text-left flex-1">
                            <h2 className={`text-lg font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                                {filterType === 'video' ? 'Video Stream Library' : 'Media Library'}
                            </h2>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>
                                {filterType === 'video' ? 'Upload and select Cloudflare Stream videos' : 'Select a previously uploaded asset'}
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

                    {/* Storage Preference Toggle — Hidden for Video (Stream only) */}
                    {filterType !== 'video' && (
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
                    )}

                    {/* Search — Hidden for Video during streamlined upload */}
                    {filterType !== 'video' && (
                        <div className="relative mt-4">
                            <Search size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.textMuted(isDark)}`} />
                            <Input
                                placeholder="Search by filename..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className={`rounded-full h-10 pl-10 pr-4 text-sm font-medium border-2 focus-visible:ring-${accent.name}-400/50 ${isDark ? 'bg-white/[0.04] text-white border-white/5' : 'bg-slate-50 border-slate-200'}`}
                            />
                        </div>
                    )}

                    {/* Type Tabs — Hidden for Video (Strictly Stream) */}
                    {filterType !== 'video' && (
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
                    )}

                    {/* Folder Tabs — Hidden for Video */}
                    {filterType !== 'video' && (
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                            {FOLDERS.map(f => {
                                const isActive = activeFolder === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => handleFolderChange(f.id)}
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
                    )}
                </SheetHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Bulk Selection Controls */}
                    <div className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${isMultiSelect ? (isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200') : 'border-transparent'}`}>
                        <div className="space-y-0.5">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>
                                {isMultiSelect ? `${selectedIds.length} items selected` : 'Library Assets'}
                            </p>
                            {isMultiSelect && (
                                <p className={`text-[9px] font-bold ${t.textMuted(isDark)} italic`}>
                                    Click items to select/deselect
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {isMultiSelect && selectedIds.length > 0 && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleBulkDelete}
                                    className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Trash2 size={12} className="mr-2" />
                                    Delete {selectedIds.length}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setIsMultiSelect(!isMultiSelect);
                                    setSelectedIds([]);
                                }}
                                className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-full border-2 transition-all ${isMultiSelect ? (isDark ? 'bg-white/10 border-white text-white' : 'bg-slate-900 border-slate-900 text-white') : ''}`}
                            >
                                {isMultiSelect ? 'Cancel' : 'Bulk Select'}
                            </Button>
                        </div>
                    </div>

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
                                onClick={() => activeTab === 'cloudflare_stream' ? loadStreamVideos(debouncedSearch) : loadAssets(activeTab, activeFolder, 1, debouncedSearch, false)}
                                className="rounded-full font-bold text-xs"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : activeTab === 'cloudflare_stream' ? (
                        streamVideos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                                    <Cloud size={24} className={t.textMuted(isDark)} />
                                </div>
                                <p className={`text-sm font-bold ${t.textMuted(isDark)}`}>
                                    {search ? 'No videos match your search.' : 'No Cloudflare Stream videos yet. Upload one to get started.'}
                                </p>
                            </div>
                        ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                {streamVideos.map(video => {
                                    const isSelected = video.uid === currentUrl?.split('/').pop();
                                    return (
                                        <div
                                            key={video.uid}
                                            className={`relative group/card text-left rounded-2xl border-2 overflow-hidden transition-all cursor-pointer
                                                ${isSelected
                                                    ? (isDark ? `border-${accent.name}-400 ring-2 ring-${accent.name}-400/20` : `border-${accent.name}-400 ring-2 ring-${accent.name}-400/10`)
                                                    : (isDark ? 'border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]' : 'border-slate-100 hover:border-slate-300 bg-slate-50 hover:bg-white')}`}
                                            onClick={() => {
                                                onSelect('cf-stream://' + video.uid, video.uid);
                                                onOpenChange(false);
                                            }}
                                        >
                                            <div className={`aspect-video relative flex items-center justify-center ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}>
                                                {video.thumbnail ? (
                                                    <img src={video.thumbnail} alt={video.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Film size={20} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                                                )}

                                                {isSelected && (
                                                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${accent.bg} text-slate-900`}>
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                )}

                                                <div className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-500 text-white shadow-sm`}>
                                                    <Cloud size={8} />
                                                    Stream
                                                </div>
                                            </div>

                                            <div className="p-2.5 space-y-0.5">
                                                <p className={`text-[11px] font-black truncate ${t.textPrimary(isDark)}`}>
                                                    {video.name}
                                                </p>
                                                <p className={`text-[9px] font-bold uppercase tracking-wider ${t.textMuted(isDark)}`}>
                                                    {video.readyToStream ? 'Ready' : 'Processing'} · {Math.floor(video.duration / 60)}m {Math.floor(video.duration % 60)}s
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        )
                    ) : assets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                                <ImageIcon size={24} className={t.textMuted(isDark)} />
                            </div>
                            <p className={`text-sm font-bold ${t.textMuted(isDark)}`}>
                                {search ? 'No assets match your search.' : 'No assets uploaded yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                {assets.map(asset => {
                                    const isSelected = asset.file_url === currentUrl;
                                    const isInBulk = selectedIds.includes(asset.id);
                                    const isDeleting = deletingId === asset.id;
                                    return (
                                        <div
                                            key={asset.id}
                                            className={`relative group/card text-left rounded-2xl border-2 overflow-hidden transition-all cursor-pointer
                                                ${(isSelected || isInBulk)
                                                    ? (isDark ? `border-${accent.name}-400 ring-2 ring-${accent.name}-400/20` : `border-${accent.name}-400 ring-2 ring-${accent.name}-400/10`)
                                                    : (isDark ? 'border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]' : 'border-slate-100 hover:border-slate-300 bg-slate-50 hover:bg-white')
                                                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            onClick={() => {
                                                if (isDeleting) return;
                                                handleSelection(asset);
                                            }}
                                        >
                                            {/* Preview area */}
                                            <div className={`aspect-video relative flex items-center justify-center ${isDark ? 'bg-white/[0.03]' : 'bg-slate-100'}`}>
                                                {asset.asset_type === 'image' ? (
                                                    <img
                                                        src={asset.file_url}
                                                        alt={asset.original_name}
                                                        className="w-full h-full object-cover"
                                                        onError={e => {
                                                            const el = e.target as HTMLImageElement;
                                                            el.style.display = 'none';
                                                            el.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : asset.asset_type === 'video' ? (
                                                    <VideoPreview src={asset.file_url} isDark={isDark} />
                                                ) : (
                                                    <AssetIcon
                                                        asset_type={asset.asset_type}
                                                        mime_type={asset.mime_type}
                                                        className={isDark ? 'text-slate-400' : 'text-slate-500'}
                                                    />
                                                )}

                                                {/* Selected check */}
                                                {(isSelected || isInBulk) && (
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

                            {hasMore && (
                                <div className="flex justify-center pt-2 pb-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={loadingMore}
                                        onClick={handleLoadMore}
                                        className={`rounded-full px-6 font-black uppercase tracking-widest text-[10px] ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200'}`}
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 size={12} className="animate-spin mr-2" />
                                                Loading...
                                            </>
                                        ) : (
                                            'Load More Assets'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

/** Video thumbnail with graceful fallback when the src can't be loaded */
function VideoPreview({ src, isDark }: { src: string; isDark: boolean }) {
    const [failed, setFailed] = React.useState(false);

    if (failed) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Film size={24} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
            </div>
        );
    }

    return (
        <div className="w-full h-full relative group/video">
            <video
                src={src}
                className="w-full h-full object-cover"
                preload="none"
                muted
                onError={() => setFailed(true)}
                onMouseOver={e => (e.target as HTMLVideoElement).play().catch(() => {})}
                onMouseOut={e => {
                    const v = e.target as HTMLVideoElement;
                    v.pause();
                    v.currentTime = 0;
                }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-transparent transition-all pointer-events-none">
                <Film size={20} className="text-white drop-shadow-lg" />
            </div>
        </div>
    );
}
