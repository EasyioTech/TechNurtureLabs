'use client';

import React from 'react';
import * as tus from 'tus-js-client';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAdminTheme, t } from '../theme-context';
import {
    Cloud, ImageIcon, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpload } from '@/hooks/use-upload';
import { UploadProgress } from '@/components/shared/upload-progress';
import { uploadStore } from '@/lib/upload-store';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

// Modular Components
import { LibraryHeader } from './media-library-picker/library-header';
import { AssetGrid } from './media-library-picker/asset-grid';
import { AssetType, MediaAsset, MediaLibraryPickerProps } from './media-library-picker/types';

// ─── Utilities ──────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (isNaN(i) || i < 0) return '0 B';
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

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
    const [activeTab, setActiveTab] = React.useState<AssetType>(
        filterType === 'video' ? 'cloudflare_stream' : filterType === 'document' ? 'document' : 'image'
    );
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [uploadFile, setUploadFile] = React.useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Selected items for bulk operations
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [isMultiSelect, setIsMultiSelect] = React.useState(false);

    // Stream video upload state
    const [isStreamUploading, setIsStreamUploading] = React.useState(false);
    const [streamProgress, setStreamProgress] = React.useState(0);
    const [isNormalizing, setIsNormalizing] = React.useState(false);
    const tusUploadRef = React.useRef<tus.Upload | null>(null);

    // Strictly fresh refs for use inside callbacks
    const activeTabRef        = React.useRef(activeTab);
    const debouncedSearchRef  = React.useRef(debouncedSearch);
    React.useEffect(() => { activeTabRef.current       = activeTab;       }, [activeTab]);
    React.useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);

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
            const tab = activeTabRef.current;
            const search = debouncedSearchRef.current;
            if (tab === 'cloudflare_stream') {
                loadStreamVideos(1, search, false);
            } else {
                loadAssets(tab, 'all', 1, search, false);
            }
        },
        onError: (err) => { toast.error(err || 'Failed to upload file'); }
    });

    React.useEffect(() => {
        if (isUploading) uploadStore.updateTask(uploadId, { isLocalVisible: true });
        return () => { if (uploadId) uploadStore.updateTask(uploadId, { isLocalVisible: false }); };
    }, [uploadId, isUploading]);

    // Cleanup stream upload on unmount
    React.useEffect(() => {
        return () => {
            if (tusUploadRef.current) {
                tusUploadRef.current.abort();
                tusUploadRef.current = null;
            }
        };
    }, []);

    React.useEffect(() => {
        if (!open) return;
        let newTab: AssetType = 'image';
        if (filterType === 'document') newTab = 'document';
        else if (filterType === 'video') newTab = 'cloudflare_stream';

        setActiveTab(newTab);
        setSearch('');
        setPage(1);
        setAssets([]); // Clear assets when switching to ensure clean state
        setError(null);

        if (newTab === 'cloudflare_stream') {
            loadStreamVideos(1, '', false);
        } else {
            loadAssets(newTab, 'all', 1, '', false);
        }
    }, [open, filterType]);

    React.useEffect(() => {
        if (!open) return;

        // Only load if tab has changed or search changed
        setPage(1);
        setAssets([]); // Clear before loading new tab data
        setError(null);

        if (activeTab === 'cloudflare_stream') {
            loadStreamVideos(1, debouncedSearch, false);
        } else {
            loadAssets(activeTab, 'all', 1, debouncedSearch, false);
        }
    }, [debouncedSearch, activeTab, open]);


    async function loadAssets(type: AssetType, targetFolder: string, targetPage: number, query: string, append: boolean) {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);
        try {
            const limit = '30';
            const params = new URLSearchParams({ page: targetPage.toString(), limit });
            if (type !== 'all' && type !== 'cloudflare_stream') params.set('type', type);
            if (targetFolder !== 'all') params.set('folder', targetFolder);
            if (query) params.set('search', query);

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
            const transformed = (data.assets || []).map((asset: any) => ({
                ...asset,
                thumbnail: asset.metadata?.thumbnail || asset.thumbnail || null,
                preview: asset.metadata?.preview || asset.preview || null,
            }));
            if (append) setAssets(prev => [...prev, ...transformed]);
            else setAssets(transformed);
            setHasMore(data.pagination.currentPage < data.pagination.pages);
        } catch (err: any) {
            console.error('[Media Library] Load error:', err);
            setError(err.message || 'Could not load library.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    async function loadStreamVideos(targetPage: number = 1, query: string = '', append: boolean = false) {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);
        try {
            const limit = 30;
            const params = new URLSearchParams({ limit: limit.toString() });
            if (query) params.set('search', query);

            const res = await fetch(`/api/media/stream-list?${params.toString()}`, {
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
                throw new Error(errorData.details || errorData.error || 'Failed to load stream videos');
            }
            const data = await res.json();
            const videos = data.videos || [];

            // Transform stream videos to asset format for compatibility
            const transformedAssets = videos.map((video: any) => {
                // Calculate file_size: use actual size if available, otherwise approximate from duration
                const durationSeconds = video.duration || 0;
                const approximateSize = Math.round((durationSeconds / 60) * 1024 * 1024);
                const fileSize = video.size || approximateSize;

                return {
                    id: video.uid || video.id,
                    file_name: video.name || video.filename || 'Untitled Video',
                    original_name: video.name || video.filename || 'Untitled Video',
                    file_url: `cf-stream://${video.uid || video.id}`,
                    file_path: `stream/${video.uid || video.id}`,
                    mime_type: 'video/mp4',
                    file_size: fileSize,
                    storage_type: 'cloudflare_stream',
                    asset_type: 'video',
                    created_at: video.created || new Date().toISOString(),
                    thumbnail: video.thumbnail || null,
                    preview: video.preview || null,
                };
            });
            if (append) setAssets(prev => [...prev, ...transformedAssets]);
            else setAssets(transformedAssets);
            
            // For Cloudflare Stream, if we got exactly the limit, there might be more.
            // Since we don't have true pagination offset yet in the helper, we just check length.
            setHasMore(videos.length === limit);
        } catch (err: any) {
            console.error('[Stream Videos] Load error:', err);
            setError(err.message || 'Could not load stream videos.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    function handleLoadMore() {
        if (loadingMore || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        if (activeTab === 'cloudflare_stream') {
            loadStreamVideos(nextPage, debouncedSearch, true);
        } else {
            loadAssets(activeTab, 'all', nextPage, debouncedSearch, true);
        }
    }

    function handleSelection(asset: MediaAsset) {
        if (isMultiSelect) {
            setSelectedIds(prev => 
                prev.includes(asset.id) ? prev.filter(id => id !== asset.id) : [...prev, asset.id]
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
        } catch {
            toast.error('Failed to delete assets');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(asset: MediaAsset, e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm(`Delete "${asset.original_name}"?`)) return;
        setDeletingId(asset.id);
        try {
            const csrfToken = getCsrfToken();
            const res = await fetch(`/api/media/library/${asset.id}`, { 
                method: 'DELETE',
                headers: { ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) }
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
        const isVideo = filterType === 'video';
        const isImage = filterType === 'image';

        if (isImage) {
            const valid = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'].includes(file.type);
            if (!valid) return toast.error('Upload valid image formats');
        }

        const maxSize = 2 * 1024 * 1024 * 1024;
        if (file.size > maxSize) return toast.error('File size limit is 2GB');

        setUploadFile(file);

        try {
            if (isVideo) {
                await executeStreamUpload(file);
            } else {
                const additionalData = {
                    purpose: 'library',
                    storagePreference: 'r2',
                    folder: 'library',
                };
                await upload(file, additionalData);
            }
        } catch (err) {
            console.error('[Upload]', err);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function executeStreamUpload(file: File, isRetry = false): Promise<void> {
        let uploadUid = '';
        try {
            // Warn for risky formats
            const riskyExtensions = ['.mov', '.mkv', '.avi', '.wmv'];
            const isRisky = riskyExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
            if (isRisky) {
                toast.warning(`"${file.name.split('.').pop()?.toUpperCase()}" files often fail processing. If it gets stuck, re-encode to MP4.`);
            }

            const initRes = await fetch('/api/media/stream-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
            });

            if (!initRes.ok) throw new Error('Failed to initialize upload');
            const { uploadURL, uid } = await initRes.json();
            uploadUid = uid;

            setIsStreamUploading(true);
            setStreamProgress(0);

            return await new Promise<void>(async (resolve, reject) => {
                const upload = new tus.Upload(file, {
                    uploadUrl: uploadURL,
                    uploadDataDuringCreation: true,
                    overridePatchMethod: true,
                    fingerprint: async () => '',
                    retryDelays: [0, 3000, 5000],
                    chunkSize: 5 * 1024 * 1024,
                    removeFingerprintOnSuccess: true,
                    metadata: { filename: file.name, filetype: file.type },
                    onError: (error) => reject(error),
                    onProgress: (up, tot) => setStreamProgress(Math.round((up / tot) * 100)),
                    onSuccess: async () => {
                        try {
                            let isReady = false;
                            let lastPct = -1;
                            let stagnantCount = 0;

                            for (let i = 0; i < 600; i++) {
                                const statusRes = await fetch(`/api/media/stream-status/${uploadUid}`);
                                if (statusRes.ok) {
                                    const data = await statusRes.json();
                                    const state = data.status?.state || data.state;
                                    const ready = data.readyToStream;
                                    const pct = parseFloat(data.status?.pctComplete || '0');

                                    if (ready) {
                                        isReady = true;
                                        break;
                                    }

                                    if (state === 'error') {
                                        throw new Error('Cloudflare encoding failed. Incompatible format or VFR.');
                                    }

                                    if (pct === lastPct && pct < 100) stagnantCount++;
                                    else { stagnantCount = 0; lastPct = pct; }

                                    if (stagnantCount > 12) {
                                        throw new Error('Processing stalled. File likely requires re-encoding.');
                                    }
                                }
                                await new Promise(r => setTimeout(r, 3000));
                            }

                            if (!isReady) throw new Error('Processing timeout');

                            // Reload stream videos
                            setIsStreamUploading(false);
                            setStreamProgress(0);
                            toast.success('Video uploaded and processed');
                            setUploadFile(null);
                            setPage(1);
                            loadStreamVideos(1, debouncedSearchRef.current, false);
                            resolve();
                        } catch (err: any) {
                            if (err.message?.includes('Repairing')) {
                                setIsNormalizing(true);
                            }
                            reject(err);
                        }
                    },
                });

                tusUploadRef.current = upload;
                upload.start();
            });
        } catch (error: any) {
            // Retry strategy
            if (!isRetry && !error.message.includes('re-encode')) {
                console.log('Ingest failed, attempting auto-retry...');
                toast.info('Retrying processing...');
                if (uploadUid) await fetch(`/api/media/stream-status/${uploadUid}`, { method: 'DELETE' });
                return executeStreamUpload(file, true);
            }

            // Normalization escalation
            if (isRetry) {
                setIsNormalizing(true);
                toast.info('Processing failed. Normalizing on server...');
                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const normRes = await fetch('/api/media/normalize', {
                        method: 'POST',
                        body: formData
                    });

                    if (!normRes.ok) {
                        const error = await normRes.json();
                        throw new Error(error.error || 'Normalization pipeline failed');
                    }

                    const { jobId } = await normRes.json();
                    toast.info('Normalization queued. This may take 1-2 minutes...');

                    let attempts = 0;
                    let finalUid = null;

                    while (attempts < 40) {
                        const jobRes = await fetch(`/api/media/jobs/${jobId}`);
                        if (jobRes.ok) {
                            const jobData = await jobRes.json();
                            if (jobData.state === 'completed' && jobData.result?.uid) {
                                finalUid = jobData.result.uid;
                                break;
                            }
                            if (jobData.state === 'failed') {
                                throw new Error(`Normalization failed: ${jobData.failedReason || 'Unknown error'}`);
                            }
                        }
                        await new Promise(r => setTimeout(r, 3000));
                        attempts++;
                    }

                    if (!finalUid) throw new Error('Normalization timed out');

                    setIsNormalizing(false);
                    setIsStreamUploading(false);
                    setStreamProgress(0);
                    toast.success('Video uploaded and processed');
                    setUploadFile(null);
                    setPage(1);
                    loadStreamVideos(1, debouncedSearchRef.current, false);
                } catch (normErr) {
                    console.error('[Escalation Error]:', normErr);
                    setIsNormalizing(false);
                    setIsStreamUploading(false);
                    throw normErr;
                }
            }

            if (uploadUid) {
                try { await fetch(`/api/media/stream-status/${uploadUid}`, { method: 'DELETE' }); } catch (e) {}
            }
            setIsStreamUploading(false);
            setStreamProgress(0);
            throw error;
        }
    }

    const [isSyncing, setIsSyncing] = React.useState(false);

    async function handleSync() {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            const csrfToken = getCsrfToken();
            const res = await fetch('/api/media/sync', { 
                method: 'POST',
                headers: { ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}) }
            });
            if (!res.ok) throw new Error('Sync failed');
            const data = await res.json();
            toast.success(data.message || 'Library synchronized with storage');
            
            // Reload current tab
            setPage(1);
            if (activeTab === 'cloudflare_stream') {
                loadStreamVideos(1, debouncedSearch, false);
            } else {
                loadAssets(activeTab, 'all', 1, debouncedSearch, false);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to sync library');
        } finally {
            setIsSyncing(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className={`w-full sm:max-w-[560px] p-0 flex flex-col border-0 ${isDark ? 'bg-[#0a0d13]' : 'bg-white'}`}
            >
                <LibraryHeader
                    isUploading={isUploading}
                    onUploadClick={() => fileInputRef.current?.click()}
                    search={search}
                    onSearchChange={setSearch}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    filterType={filterType}
                    onSync={handleSync}
                    isSyncing={isSyncing}
                    onClose={() => onOpenChange(false)}
                />
                
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleUpload}
                    accept={filterType === 'video' ? 'video/*' : filterType === 'image' ? 'image/*' : undefined}
                />

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {uploadFile && (
                        <UploadProgress
                            progress={isStreamUploading ? streamProgress : progress}
                            fileName={uploadFile.name}
                            isUploading={isStreamUploading || isUploading}
                            error={uploadError}
                            onCancel={() => {
                                if (isStreamUploading && tusUploadRef.current) {
                                    tusUploadRef.current.abort();
                                    tusUploadRef.current = null;
                                    setIsStreamUploading(false);
                                    setStreamProgress(0);
                                    setUploadFile(null);
                                } else {
                                    abort();
                                }
                            }}
                            onReset={() => {
                                resetUpload();
                                setStreamProgress(0);
                                setIsStreamUploading(false);
                                setUploadFile(null);
                            }}
                            isDark={isDark}
                        />
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <Loader2 size={28} className={`animate-spin ${isDark ? 'text-slate-400' : 'text-slate-500'}`} strokeWidth={2} />
                            <p className={`text-sm font-bold ${t.textMuted(isDark)}`}>Loading library...</p>
                        </div>
                    ) : error ? (
                        <div className={`flex flex-col items-center justify-center h-48 gap-3 rounded-2xl border-2 ${isDark ? 'border-rose-500/20 bg-rose-500/5' : 'border-rose-200 bg-rose-50'}`}>
                            <AlertCircle size={28} className="text-rose-500" strokeWidth={2} />
                            <p className={`text-sm font-bold text-center ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{error}</p>
                            <Button
                                size="sm" variant="outline"
                                onClick={() => loadAssets(activeTab, 'all', 1, debouncedSearch, false)}
                                className="rounded-full font-bold text-xs"
                            >
                                Retry
                            </Button>
                        </div>
                    ) : assets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <ImageIcon size={24} className={isDark ? 'text-slate-500' : 'text-slate-400'} strokeWidth={1.5} />
                            </div>
                            <p className={`text-sm font-bold ${t.textMuted(isDark)}`}>
                                {search ? 'No assets match your search.' : 'No assets uploaded yet.'}
                            </p>
                        </div>
                    ) : (
                        <AssetGrid 
                            assets={assets}
                            loadingMore={loadingMore}
                            hasMore={hasMore}
                            onLoadMore={handleLoadMore}
                            currentUrl={currentUrl}
                            onSelect={handleSelection}
                            onDelete={handleDelete}
                            deletingId={deletingId}
                            isMultiSelect={isMultiSelect}
                            setIsMultiSelect={setIsMultiSelect}
                            selectedIds={selectedIds}
                            onBulkDelete={handleBulkDelete}
                            formatBytes={formatBytes}
                            activeTab={activeTab}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
