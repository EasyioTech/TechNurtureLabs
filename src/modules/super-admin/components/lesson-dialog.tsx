'use client';

import React from 'react';
import {
    Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Lesson } from '../types';
import { useAdminTheme, t } from '../theme-context';
import {
    BookOpen, Play, FileText, MonitorPlay, HelpCircle,
    Zap, Clock, X, Upload, Link2, Library, FileDown, Loader2,
    Cloud, HardDrive, Image as ImageIcon, Film, Layers, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MediaLibraryPicker } from './media-library-picker';
import { EntityLibraryPicker } from './entity-library-picker';
import { cloneQuizAction } from '@/modules/super-admin/actions';
import { useUpload } from '@/hooks/use-upload';
import { UploadProgress } from '@/components/shared/upload-progress';
import { uploadStore } from '@/lib/upload-store';
import { cn } from '@/lib/utils';

interface LessonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingLesson: Partial<Lesson> | null;
    setEditingLesson: (lesson: Partial<Lesson> | null) => void;
    onSave: () => void;
}

export type ContentItem = { id: string; type: 'video' | 'pdf' | 'ppt' | 'image'; url: string; urls?: string[]; };

const BLOCK_TYPES = [
    { id: 'video' as const, label: 'Video',    icon: Film,        color: 'text-rose-500',    accept: 'video/*',          desc: 'MP4, YouTube, stream' },
    { id: 'pdf'   as const, label: 'Document', icon: FileText,    color: 'text-sky-500',     accept: '.pdf,.doc,.docx',  desc: 'PDF or Word file' },
    { id: 'image' as const, label: 'Images',   icon: ImageIcon,   color: 'text-emerald-500', accept: 'image/*',          desc: 'Photo or carousel' },
    { id: 'ppt'   as const, label: 'Slides',   icon: MonitorPlay, color: 'text-amber-500',   accept: '.ppt,.pptx,.key',  desc: 'PowerPoint or Keynote' },
];

// Per-type accent colors for block identity
const TYPE_ACCENT: Record<string, { border: string; lightBg: string; darkBg: string }> = {
    video: { border: '#f43f5e', lightBg: '#fff1f2', darkBg: 'rgba(244,63,94,0.07)' },
    pdf:   { border: '#0ea5e9', lightBg: '#f0f9ff', darkBg: 'rgba(14,165,233,0.07)' },
    image: { border: '#10b981', lightBg: '#ecfdf5', darkBg: 'rgba(16,185,129,0.07)' },
    ppt:   { border: '#f59e0b', lightBg: '#fffbeb', darkBg: 'rgba(245,158,11,0.07)' },
};

const LESSON_MODES = [
    { id: 'content' as const, label: 'Content', icon: Layers,     desc: 'Video, docs & images' },
    { id: 'quiz' as const,    label: 'Quiz',    icon: HelpCircle, desc: 'Interactive test' },
];

function genId() { return Math.random().toString(36).slice(2, 9); }

// ── URL type-match validation ──────────────────────────────────────────────
// Returns a warning string if the URL doesn't match the expected content type,
// or null if it looks correct (or is an uploaded/blank URL).
function validateBlockUrl(type: ContentItem['type'], url: string): string | null {
    if (!url) return null;
    // Uploaded files are always fine — they passed the accept filter at upload time
    if (
        url.startsWith('/api/') ||
        url.startsWith('cf-stream://') ||
        url.includes('r2.cloudflarestorage') ||
        url.includes('cloudflare') ||
        url.includes('amazonaws') ||
        url.includes('blob.core.windows')
    ) return null;

    if (type === 'video') {
        const ok = /youtube\.com|youtu\.be|vimeo\.com|dailymotion|\.mp4|\.mov|\.avi|\.mkv|\.webm|\.m4v/i.test(url);
        if (!ok) return 'URL doesn\'t look like a video — expected YouTube/Vimeo link or .mp4/.mov file';
    }
    if (type === 'pdf') {
        const ok = /\.pdf($|\?)|\.doc($|\?)|\.docx($|\?)/i.test(url);
        if (!ok) return 'URL doesn\'t look like a document — expected .pdf or .docx link';
    }
    if (type === 'image') {
        const ok = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)($|\?)/i.test(url);
        if (!ok) return 'URL doesn\'t look like an image — expected .jpg, .png, .webp, etc.';
    }
    if (type === 'ppt') {
        const ok = /\.(ppt|pptx|key|pdf)($|\?)/i.test(url);
        if (!ok) return 'URL doesn\'t look like a presentation — expected .pptx, .key, or .pdf link';
    }
    return null;
}

// Derive lesson mode from content_type
function getLessonMode(contentType?: string): 'content' | 'quiz' {
    if (contentType === 'quiz') return 'quiz';
    return 'content';
}

// Get all image URLs from a block (first + additional)
function getImageUrls(item: ContentItem): string[] {
    if (item.urls && item.urls.length > 0) return item.urls;
    return item.url ? [item.url] : [''];
}

// Parse content_items JSON from lesson
function parseContentItems(lesson: Partial<Lesson> | null): ContentItem[] {
    if (!lesson) return [];
    const raw = (lesson as any).content_items;
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
    }
    // Fall back: wrap single content_url as one block
    const mode = getLessonMode(lesson.content_type);
    if (mode === 'content' && lesson.content_url) {
        return [{ id: 'legacy', type: (lesson.content_type as ContentItem['type']) || 'video', url: lesson.content_url }];
    }
    return [];
}

// ── Auto XP helpers ────────────────────────────────────────────────────────
// XP per content block type (defaults; admin can always override)
const XP_PER_TYPE: Record<string, number> = { video: 20, ppt: 15, pdf: 15, image: 10 };

function autoCalcXp(items: ContentItem[], mode: 'content' | 'quiz'): number {
    if (mode === 'quiz') return 25;
    if (items.length === 0) return 0;
    const raw = items.reduce((sum, item) => sum + (XP_PER_TYPE[item.type] ?? 10), 0);
    return Math.min(100, raw);
}

export function LessonDialog({ open, onOpenChange, editingLesson, setEditingLesson, onSave }: LessonDialogProps) {
    const { isDark, accent } = useAdminTheme();
    const isEditing = !!editingLesson?.id;
    const router = useRouter();

    // ── Derived state ─────────────────────────────────────────────
    const lessonMode = getLessonMode(editingLesson?.content_type);

    // contentItems is derived from editingLesson — no separate state needed
    const contentItems = React.useMemo(
        () => parseContentItems(editingLesson),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [(editingLesson as any)?.content_items, editingLesson?.content_url, editingLesson?.content_type]
    );

    // Track whether admin has manually overridden the auto XP value during this dialog session
    const [isXpCustomized, setIsXpCustomized] = React.useState(false);

    // When dialog opens: recalculate XP from ALL content blocks so multi-type lessons show correct sum
    React.useEffect(() => {
        if (open) {
            setIsXpCustomized(false);
            const parsedItems = parseContentItems(editingLesson);
            const mode = getLessonMode(editingLesson?.content_type);
            const autoXp = autoCalcXp(parsedItems, mode);
            if (autoXp > 0) {
                setEditingLesson({ ...(editingLesson as any), xp_reward: autoXp });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // ── Upload state ──────────────────────────────────────────────
    const [showBlockPicker, setShowBlockPicker] = React.useState(false);
    const [activeUploadItemId, setActiveUploadItemId] = React.useState<string | null>(null);
    const [uploadFile, setUploadFile] = React.useState<File | null>(null);
    const [libraryOpen, setLibraryOpen] = React.useState(false);
    const [libraryTargetId, setLibraryTargetId] = React.useState<string | null>(null);
    const [importOpen, setImportOpen] = React.useState(false);
    
    const [storagePref, setStoragePref] = React.useState<'r2' | 'local'>('r2');
    const [streamProgress, setStreamProgress] = React.useState(0);
    const [isStreamUploading, setIsStreamUploading] = React.useState(false);

    // No onSuccess/onError callbacks — we await upload() directly to avoid stale closures
    const { upload, progress, isUploading, error: uploadError, reset: resetUpload, abort, uploadId } = useUpload();

    React.useEffect(() => {
        uploadStore.updateTask(uploadId, { isLocalVisible: isUploading && open });
        return () => { uploadStore.updateTask(uploadId, { isLocalVisible: false }); };
    }, [uploadId, isUploading, open]);

    // Reset picker when dialog closes or lesson switches
    React.useEffect(() => {
        if (!open) setShowBlockPicker(false);
    }, [open]);

    // ── Helpers: write content_items back into editingLesson ──────
    const syncItems = React.useCallback((items: ContentItem[]) => {
        // Pick DB-safe content_type from first item ('image' not in enum → use 'pdf')
        const firstType = items[0]?.type || 'video';
        const dbType: any = firstType === 'image' ? 'pdf' : firstType;
        // Auto-fill XP from content composition unless admin has manually set a value
        const autoXp = autoCalcXp(items, 'content');
        setEditingLesson({
            ...editingLesson,
            content_type: dbType,
            content_url: items[0]?.url || '',
            content_items: items.length > 0 ? JSON.stringify(items) : null,
            content_watched: false, // reset watched if items change
            ...(!isXpCustomized && { xp_reward: autoXp }),
        } as any);
    }, [editingLesson, setEditingLesson, isXpCustomized]);

    const addBlock = (type: ContentItem['type']) => {
        syncItems([...contentItems, { id: genId(), type, url: '' }]);
    };

    const removeBlock = (id: string) => {
        syncItems(contentItems.filter(i => i.id !== id));
    };

    const moveBlock = (id: string, dir: 'up' | 'down') => {
        const idx = contentItems.findIndex(i => i.id === id);
        if (dir === 'up' && idx === 0) return;
        if (dir === 'down' && idx === contentItems.length - 1) return;
        const next = [...contentItems];
        const swap = dir === 'up' ? idx - 1 : idx + 1;
        [next[idx], next[swap]] = [next[swap], next[idx]];
        syncItems(next);
    };

    const applyBlockUpdate = (id: string, key: 'type' | 'url', value: string) => {
        const next = contentItems.map(i => i.id === id ? { ...i, [key]: value } : i);
        syncItems(next as ContentItem[]);
    };

    const applyImageUrls = (id: string, newUrls: string[]) => {
        const next = contentItems.map(i =>
            i.id === id ? { ...i, url: newUrls[0] || '', urls: newUrls } : i
        );
        syncItems(next as ContentItem[]);
    };

    // ── Switch lesson mode ────────────────────────────────────────
    const switchMode = (mode: 'content' | 'quiz') => {
        if (mode === 'quiz') {
            setEditingLesson({
                ...editingLesson,
                content_type: 'quiz',
                content_url: '',
                content_items: null,
                ...(!isXpCustomized && { xp_reward: 25 }),
            } as any);
        } else {
            // Switch to content mode: preserve existing items and auto-recalculate XP
            const preserved = contentItems.length > 0 ? contentItems : [];
            const autoXp = autoCalcXp(preserved, 'content');
            setEditingLesson({
                ...editingLesson,
                content_type: 'video',
                content_url: preserved[0]?.url || '',
                content_items: preserved.length > 0 ? JSON.stringify(preserved) : null,
                ...(!isXpCustomized && { xp_reward: autoXp }),
            } as any);
        }
    };

    // ── File upload for a specific block ──────────────────────────
    const handleFileUpload = async (file: File, itemId: string) => {
        if (!file) return;
        if (file.size > 2048 * 1024 * 1024) { toast.error('Max 2 GB'); return; }
        setActiveUploadItemId(itemId);
        setUploadFile(file);

        try {
            const isVideoFile = file.type.startsWith('video/');

            if (isVideoFile) {
                // Videos always upload to Cloudflare Stream — no R2 path for video
                const res = await fetch('/api/media/stream-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name }),
                });
                if (!res.ok) {
                    throw new Error(
                        res.status === 503
                            ? 'Cloudflare Stream is not configured on this server. Contact your administrator.'
                            : 'Failed to initialise stream upload'
                    );
                }
                const { uploadUrl, uid } = await res.json();
                toast.info('Uploading to Cloudflare Stream…');
                setIsStreamUploading(true);
                setStreamProgress(0);
                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', uploadUrl, true);
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) setStreamProgress(Math.round((e.loaded / e.total) * 100));
                    };
                    xhr.onload = () =>
                        xhr.status >= 200 && xhr.status < 300
                            ? resolve()
                            : reject(new Error(`Cloudflare upload failed (${xhr.status})`));
                    xhr.onerror = () => reject(new Error('Cloudflare upload network error'));
                    const fd = new FormData();
                    fd.append('file', file);
                    xhr.send(fd);
                });
                applyBlockUpdate(itemId, 'url', `cf-stream://${uid}`);
                toast.success('Video uploaded to Cloudflare Stream!');
                return;
            }
            // Standard upload (non-video or CF Stream fallback)
            const result: any = await upload(file, { purpose: 'library', storagePreference: storagePref === 'local' ? 'local' : 'r2', folder: 'lesson' });
            if (result?.url) applyBlockUpdate(itemId, 'url', result.url);
            toast.success('File uploaded');
        } catch (err: any) {
            toast.error(err?.message || 'Upload failed');
        } finally {
            setIsStreamUploading(false);
            setStreamProgress(0);
            setActiveUploadItemId(null);
            setUploadFile(null);
        }
    };

    // ── Pre-save validation ───────────────────────────────────────
    const handleSave = () => {
        if (!editingLesson?.title?.trim()) {
            toast.error('Lesson title is required');
            return;
        }
        if (lessonMode === 'content' && contentItems.length > 0) {
            // Block saving if any content block has no URL at all
            const emptyBlocks = contentItems.filter(item => {
                if (item.type === 'image') {
                    return getImageUrls(item).every(u => !u.trim());
                }
                return !item.url.trim();
            });
            if (emptyBlocks.length > 0) {
                const labels = emptyBlocks.map(b => BLOCK_TYPES.find(bt => bt.id === b.type)?.label || b.type).join(', ');
                toast.error(`Missing content URL in: ${labels}. Please add a URL or upload a file, or remove the empty block.`);
                return;
            }
            // Warn (but don't block) if URLs look mismatched
            const mismatchBlocks = contentItems.filter(item => {
                if (item.type === 'image') return false; // multi-image validated individually
                return !!validateBlockUrl(item.type, item.url);
            });
            if (mismatchBlocks.length > 0) {
                const labels = mismatchBlocks.map(b => BLOCK_TYPES.find(bt => bt.id === b.type)?.label || b.type).join(', ');
                toast.warning(`Content type mismatch in: ${labels}. Double-check the URLs, then save again.`, {
                    action: { label: 'Save anyway', onClick: onSave },
                });
                return;
            }
        }
        onSave();
    };

    // ── Library filter type per block ─────────────────────────────
    const getLibraryFilter = (type: string): 'video' | 'document' | 'image' | undefined => {
        if (type === 'video') return 'video';
        if (type === 'image') return 'image';
        if (type === 'pdf' || type === 'ppt') return 'document';
        return undefined;
    };

    // ── Render ────────────────────────────────────────────────────
    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={cn(
                    'w-[95vw] max-w-[580px] rounded-2xl sm:rounded-3xl border-0 shadow-2xl p-0 overflow-hidden',
                    isDark ? 'bg-[#0f1219]' : 'bg-white'
                )}>
                    {/* ── Header ───────────────────────────────── */}
                    <div className={`px-6 py-4 border-b flex items-center gap-3 ${t.border(isDark)}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.bg} text-slate-900 flex-shrink-0`}>
                            <BookOpen size={17} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <DialogTitle className={`text-base font-[900] tracking-tight leading-none ${t.textPrimary(isDark)}`}>
                                {isEditing ? 'Update Lesson' : 'Create Lesson'}
                            </DialogTitle>
                            <DialogDescription className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${t.textMuted(isDark)}`}>
                                {isEditing ? 'Edit lesson details & content' : 'Add a new lesson to this course'}
                            </DialogDescription>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${isDark ? 'text-slate-500 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* ── Body ─────────────────────────────────── */}
                    <div
                        className="overflow-y-auto px-6 py-5 space-y-5"
                        style={{ maxHeight: 'calc(90vh - 130px)' }}
                    >
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Lesson Title *</Label>
                            <Input
                                placeholder="e.g. Introduction to Photosynthesis"
                                value={editingLesson?.title || ''}
                                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                                className={`rounded-xl h-11 px-4 text-sm font-semibold border-2 transition-all ${isDark ? 'bg-white/[0.06] text-white border-white/8 focus-visible:border-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 focus-visible:border-slate-400'}`}
                            />
                        </div>

                        {/* Lesson Type selector */}
                        <div className="space-y-2">
                            <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Lesson Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {LESSON_MODES.map((mode) => {
                                    const active = lessonMode === mode.id;
                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => switchMode(mode.id)}
                                            className={cn(
                                                'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-center transition-all cursor-pointer',
                                                active
                                                    ? isDark
                                                        ? `${accent.softDark.split(' ')[0]} border-${accent.name}-400/60`
                                                        : 'bg-indigo-50 border-indigo-300'
                                                    : isDark
                                                        ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                                                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                            )}
                                        >
                                            <mode.icon
                                                size={16}
                                                className={active
                                                    ? isDark ? accent.text : 'text-indigo-600'
                                                    : isDark ? 'text-slate-500' : 'text-slate-400'}
                                            />
                                            <span className={cn(
                                                'text-xs font-black leading-none',
                                                active ? isDark ? accent.text : 'text-indigo-700' : t.textPrimary(isDark)
                                            )}>{mode.label}</span>
                                            <span className={`text-[9px] font-medium leading-none ${t.textMuted(isDark)}`}>{mode.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── CONTENT MODE: multi-block builder ── */}
                        {lessonMode === 'content' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>
                                        Content Blocks
                                    </Label>
                                    <span className={`text-[9px] font-semibold ${t.textMuted(isDark)}`}>
                                        Shown to students in sequence
                                    </span>
                                </div>

                                {/* Empty state */}
                                {contentItems.length === 0 && (
                                    <div className={cn(
                                        'py-10 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2',
                                        isDark ? 'border-white/8 bg-white/[0.01]' : 'border-slate-200 bg-slate-50'
                                    )}>
                                        <Layers size={26} className={isDark ? 'text-slate-700' : 'text-slate-300'} />
                                        <p className={`text-xs font-bold ${t.textMuted(isDark)}`}>No content blocks yet</p>
                                        <p className={`text-[10px] ${t.textMuted(isDark)}`}>Click below to add video, docs, or images</p>
                                    </div>
                                )}

                                {/* Block list */}
                                <div className="space-y-2">
                                    {contentItems.map((item, idx) => {
                                        const bt = BLOCK_TYPES.find(b => b.id === item.type) || BLOCK_TYPES[0];
                                        const isStreamUploadingThis = isStreamUploading && activeUploadItemId === item.id;
                                        const isUploadingThis = (isUploading || isStreamUploading) && activeUploadItemId === item.id;
                                        const isUploaded = item.url.startsWith('/api/') || item.url.includes('r2.cloudflare') || item.url.startsWith('cf-stream://');
                                        const displayUrl = isUploaded
                                            ? item.url.startsWith('cf-stream://')
                                                ? `☁ Stream: ${item.url.replace('cf-stream://', '').slice(0, 16)}…`
                                                : '✓ Uploaded'
                                            : item.url;

                                        const typeAccent = TYPE_ACCENT[item.type] || TYPE_ACCENT.video;
                                        return (
                                            <div
                                                key={item.id}
                                                className={cn('rounded-2xl overflow-hidden', !isDark && 'shadow-sm')}
                                                style={{
                                                    border: `2px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                                                    borderLeftWidth: '4px',
                                                    borderLeftColor: typeAccent.border,
                                                }}
                                            >
                                                {/* Block header: clear type identity + compact type switcher */}
                                                <div
                                                    className="flex items-center gap-2.5 px-3 py-2.5 border-b"
                                                    style={{
                                                        backgroundColor: isDark ? typeAccent.darkBg : typeAccent.lightBg,
                                                        borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                                    }}
                                                >
                                                    {/* Step number */}
                                                    <span className={`text-[9px] font-black w-4 flex-shrink-0 ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
                                                        {idx + 1}
                                                    </span>

                                                    {/* Active type label */}
                                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                        <bt.icon size={13} className={bt.color} />
                                                        <span className={`text-[11px] font-black uppercase tracking-wide ${bt.color}`}>{bt.label}</span>
                                                    </div>

                                                    {/* Delete block */}
                                                    <button
                                                        onClick={() => removeBlock(item.id)}
                                                        className={cn(
                                                            'w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0',
                                                            isDark
                                                                ? 'hover:bg-rose-500/20 text-slate-600 hover:text-rose-400'
                                                                : 'hover:bg-rose-50 text-slate-300 hover:text-rose-500'
                                                        )}
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>

                                                {/* URL / upload row */}
                                                <div className="flex flex-col gap-2 p-3">
                                                    {item.type === 'image' ? (
                                                        /* ── Multi-image carousel builder ── */
                                                        <div className="flex flex-col gap-2">
                                                            {getImageUrls(item).map((imgUrl, imgIdx) => {
                                                                const isUploadingSlot = isUploading && activeUploadItemId === `${item.id}:${imgIdx}`;
                                                                const isUploadedSlot = imgUrl.startsWith('/api/') || imgUrl.includes('r2.cloudflare');
                                                                return (
                                                                    <div key={imgIdx} className="flex items-center gap-1.5">
                                                                        <div className="flex-1 relative">
                                                                            <Link2 size={11} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                                                                            <Input
                                                                                placeholder={`Image ${imgIdx + 1} URL…`}
                                                                                value={isUploadedSlot ? '✓ Uploaded' : imgUrl}
                                                                                readOnly={isUploadedSlot}
                                                                                onChange={(e) => {
                                                                                    const next = [...getImageUrls(item)];
                                                                                    next[imgIdx] = e.target.value;
                                                                                    applyImageUrls(item.id, next);
                                                                                }}
                                                                                className={cn(
                                                                                    'h-9 rounded-xl pl-8 pr-3 text-xs font-medium border-2',
                                                                                    isUploadedSlot && (isDark ? 'text-emerald-400' : 'text-emerald-600'),
                                                                                    isDark
                                                                                        ? 'bg-white/[0.04] text-white border-white/8 focus-visible:border-white/20'
                                                                                        : 'bg-slate-50 border-slate-200 focus-visible:border-slate-400'
                                                                                )}
                                                                            />
                                                                        </div>
                                                                        {/* Upload */}
                                                                        <label className={cn(
                                                                            'h-9 px-2 rounded-xl border-2 flex items-center gap-1 font-black text-[10px] uppercase tracking-wide cursor-pointer flex-shrink-0 transition-all select-none',
                                                                            isDark
                                                                                ? 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                                                                : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                                                                        )}>
                                                                            <input
                                                                                type="file"
                                                                                className="hidden"
                                                                                accept="image/*"
                                                                                onChange={async (e) => {
                                                                                    const f = e.target.files?.[0];
                                                                                    if (f) {
                                                                                        setActiveUploadItemId(`${item.id}:${imgIdx}`);
                                                                                        setUploadFile(f);
                                                                                        try {
                                                                                            const result: any = await upload(f, { purpose: 'library', storagePreference: storagePref, folder: 'lesson' });
                                                                                            if (result?.url) {
                                                                                                const next = [...getImageUrls(item)];
                                                                                                next[imgIdx] = result.url;
                                                                                                applyImageUrls(item.id, next);
                                                                                            }
                                                                                            toast.success('Image uploaded');
                                                                                        } catch { toast.error('Upload failed'); }
                                                                                        finally { setActiveUploadItemId(null); setUploadFile(null); }
                                                                                    }
                                                                                }}
                                                                            />
                                                                            {isUploadingSlot
                                                                                ? <><Loader2 size={10} className="animate-spin" /> {progress}%</>
                                                                                : <><Upload size={10} /> Upload</>
                                                                            }
                                                                        </label>
                                                                        {/* Library */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => { setLibraryTargetId(`${item.id}:${imgIdx}`); setLibraryOpen(true); }}
                                                                            className={cn(
                                                                                'h-9 px-2 rounded-xl border-2 flex items-center gap-1 font-black text-[10px] uppercase tracking-wide flex-shrink-0 transition-all',
                                                                                isDark
                                                                                    ? 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                                                                    : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                                                                            )}
                                                                        >
                                                                            <Library size={10} /> Lib
                                                                        </button>
                                                                        {getImageUrls(item).length > 1 && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const next = getImageUrls(item).filter((_, i) => i !== imgIdx);
                                                                                    applyImageUrls(item.id, next);
                                                                                }}
                                                                                className={cn(
                                                                                    'h-9 w-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                                                                    isDark
                                                                                        ? 'border-white/10 text-slate-600 hover:border-rose-500/30 hover:text-rose-400'
                                                                                        : 'border-slate-200 text-slate-300 hover:border-rose-200 hover:text-rose-500'
                                                                                )}
                                                                            >
                                                                                <X size={12} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            <button
                                                                onClick={() => applyImageUrls(item.id, [...getImageUrls(item), ''])}
                                                                className={cn(
                                                                    'h-8 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wide transition-all',
                                                                    isDark
                                                                        ? 'border-white/10 text-slate-600 hover:border-white/20 hover:text-slate-300'
                                                                        : 'border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
                                                                )}
                                                            >
                                                                <Plus size={11} /> Add Another Image
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        /* ── Single URL + upload (video, pdf, ppt) ── */
                                                        <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 relative">
                                                                <Link2 size={11} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                                                                <Input
                                                                    placeholder={`Paste ${bt.label.toLowerCase()} URL…`}
                                                                    value={displayUrl}
                                                                    readOnly={isUploaded}
                                                                    onChange={(e) => applyBlockUpdate(item.id, 'url', e.target.value)}
                                                                    className={cn(
                                                                        'h-9 rounded-xl pl-8 pr-3 text-xs font-medium border-2',
                                                                        isUploaded && (isDark ? 'text-emerald-400' : 'text-emerald-600'),
                                                                        !isUploaded && validateBlockUrl(item.type, item.url) && 'border-amber-400',
                                                                        isDark
                                                                            ? 'bg-white/[0.04] text-white border-white/8 focus-visible:border-white/20'
                                                                            : 'bg-slate-50 border-slate-200 focus-visible:border-slate-400'
                                                                    )}
                                                                />
                                                            </div>
                                                            <label className={cn(
                                                                'h-9 px-3 rounded-xl border-2 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wide cursor-pointer flex-shrink-0 transition-all select-none',
                                                                isUploadingThis
                                                                    ? isDark ? 'border-white/20 text-white' : 'border-slate-300 text-slate-600'
                                                                    : isDark
                                                                        ? 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                                                        : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                                                            )}>
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept={bt.accept}
                                                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, item.id); }}
                                                                />
                                                                {isUploadingThis
                                                                    ? <><Loader2 size={11} className="animate-spin" /> {isStreamUploadingThis ? streamProgress : progress}%</>
                                                                    : <><Upload size={11} /> Upload</>
                                                                }
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setLibraryTargetId(item.id); setLibraryOpen(true); }}
                                                                className={cn(
                                                                    'h-9 px-3 rounded-xl border-2 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wide flex-shrink-0 transition-all',
                                                                    isDark
                                                                        ? 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                                                        : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                                                                )}
                                                            >
                                                                <Library size={11} /> Lib
                                                            </button>
                                                        </div>
                                                        {/* Inline type-mismatch warning */}
                                                        {!isUploaded && item.url && validateBlockUrl(item.type, item.url) && (
                                                            <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1 pl-1">
                                                                <span>⚠</span> {validateBlockUrl(item.type, item.url)}
                                                            </p>
                                                        )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Upload progress */}
                                                {isUploadingThis && uploadFile && (
                                                    <div className="px-3 pb-3">
                                                        <UploadProgress
                                                            progress={isStreamUploadingThis ? streamProgress : progress}
                                                            fileName={uploadFile.name}
                                                            isUploading={isUploading || isStreamUploading}
                                                            error={uploadError}
                                                            onCancel={isStreamUploadingThis ? undefined : abort}
                                                            onReset={resetUpload}
                                                            isDark={isDark}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Add block — type picker */}
                                {!showBlockPicker ? (
                                    <button
                                        onClick={() => setShowBlockPicker(true)}
                                        className={cn(
                                            'w-full h-11 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide transition-all',
                                            isDark
                                                ? 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white hover:bg-white/[0.04]'
                                                : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                                        )}
                                    >
                                        <Plus size={14} /> Add Content Block
                                    </button>
                                ) : (
                                    <div className={cn(
                                        'rounded-2xl border-2 p-3.5 space-y-3',
                                        isDark ? 'border-white/8 bg-white/[0.02]' : 'border-indigo-100 bg-indigo-50/40'
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                                Choose content type
                                            </span>
                                            <button
                                                onClick={() => setShowBlockPicker(false)}
                                                className={cn(
                                                    'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                                                    isDark ? 'text-slate-600 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                                )}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {BLOCK_TYPES.map((bt2) => {
                                                const accent2 = TYPE_ACCENT[bt2.id];
                                                return (
                                                    <button
                                                        key={bt2.id}
                                                        onClick={() => { addBlock(bt2.id); setShowBlockPicker(false); }}
                                                        className={cn(
                                                            'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all group',
                                                            isDark
                                                                ? 'border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]'
                                                                : 'border-slate-100 bg-white hover:shadow-md hover:border-slate-200'
                                                        )}
                                                        style={!isDark ? { borderLeftColor: accent2.border, borderLeftWidth: '3px' } : {}}
                                                    >
                                                        <div
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                            style={{ backgroundColor: isDark ? accent2.darkBg : accent2.lightBg }}
                                                        >
                                                            <bt2.icon size={16} className={bt2.color} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`text-xs font-black leading-none mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{bt2.label}</p>
                                                            <p className={`text-[9px] font-medium leading-none ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{bt2.desc}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Storage — Stream-only for video blocks, R2/Local for everything else */}
                                {contentItems.some(i => i.type === 'video') ? (
                                    <div className={cn(
                                        'px-4 py-3 rounded-xl border-2',
                                        isDark ? 'border-indigo-500/20 bg-indigo-500/[0.04]' : 'border-indigo-100 bg-indigo-50/60'
                                    )}>
                                        <div className={cn('flex items-center gap-3')}>
                                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', isDark ? 'bg-indigo-400/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600')}>
                                                <Zap size={15} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={cn('text-[10px] font-black uppercase tracking-tight', isDark ? 'text-indigo-300' : 'text-indigo-800')}>Cloudflare Stream — Videos Only</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={cn(
                                        'flex flex-col gap-2.5 px-4 py-3 rounded-xl border-2',
                                        isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${t.textPrimary(isDark)}`}>Storage Preferences</span>
                                                <p className={`text-[9px] font-bold ${t.textMuted(isDark)}`}>For PDFs, images, and other assets</p>
                                            </div>
                                            <div className={`h-8 px-1 rounded-lg flex gap-0.5 border shadow-sm ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                                                {[
                                                    { id: 'r2', label: 'Cloud', icon: Cloud },
                                                    { id: 'local', label: 'Server', icon: HardDrive }
                                                ].map((opt) => {
                                                    const active = storagePref === opt.id;
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => setStoragePref(opt.id as 'r2' | 'local')}
                                                            className={cn(
                                                                'flex items-center gap-1.5 px-3 rounded-md text-[9px] font-black uppercase tracking-wide transition-all',
                                                                active
                                                                    ? isDark ? 'bg-white/10 text-white shadow-inner' : 'bg-slate-100 text-slate-900 shadow-sm'
                                                                    : isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
                                                            )}
                                                        >
                                                            <opt.icon size={10} /> {opt.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── QUIZ MODE ─────────────────────────── */}
                        {lessonMode === 'quiz' && (
                            <div className={cn(
                                'p-6 rounded-2xl border-2 border-dashed flex flex-col items-center text-center gap-3',
                                isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50'
                            )}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <HelpCircle size={24} />
                                </div>
                                <div>
                                    <p className={`text-sm font-black uppercase tracking-wide ${t.textPrimary(isDark)}`}>Quiz Builder</p>
                                    <p className={`text-[10px] font-medium mt-1 max-w-[280px] ${t.textMuted(isDark)}`}>
                                        {editingLesson?.id
                                            ? 'Open the quiz builder to add & manage questions.'
                                            : 'Save this lesson first, then use the quiz builder to add questions.'}
                                    </p>
                                </div>
                                {editingLesson?.id && (
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        <Button
                                            type="button"
                                            onClick={() => router.push(`/admin/quiz/${editingLesson.id}`)}
                                            className={`rounded-full px-5 font-black text-[10px] h-9 gap-2 ${accent.bg} text-slate-900 ${accent.bgHover}`}
                                        >
                                            <MonitorPlay size={12} /> Open Quiz Builder
                                        </Button>
                                        <Button
                                            type="button" variant="outline" size="sm"
                                            onClick={() => setImportOpen(true)}
                                            className="rounded-full h-9 border-2 font-bold px-3 text-[10px]"
                                        >
                                            <FileDown size={11} className="mr-1" /> Import Quiz
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Description</Label>
                            <Textarea
                                placeholder="What will students learn in this lesson?"
                                value={editingLesson?.description || ''}
                                onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                                className={`rounded-xl min-h-[80px] p-3 text-sm font-medium border-2 transition-all resize-none ${isDark ? 'bg-white/[0.06] text-white border-white/8 focus-visible:border-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 focus-visible:border-slate-400'}`}
                            />
                        </div>

                        {/* XP + Duration */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>XP Reward</Label>
                                    {!isXpCustomized && (editingLesson?.xp_reward ?? 0) > 0 && (
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-600'}`}>Auto</span>
                                    )}
                                    {isXpCustomized && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsXpCustomized(false);
                                                const autoXp = autoCalcXp(contentItems, lessonMode);
                                                setEditingLesson({ ...editingLesson, xp_reward: autoXp });
                                            }}
                                            className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-slate-400 hover:text-violet-300' : 'bg-slate-100 text-slate-400 hover:text-violet-600'}`}
                                        >
                                            Reset Auto
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Zap size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} />
                                    <Input
                                        type="number" min="0"
                                        value={editingLesson?.xp_reward || 0}
                                        onChange={(e) => {
                                            setIsXpCustomized(true);
                                            setEditingLesson({ ...editingLesson, xp_reward: Number(e.target.value) });
                                        }}
                                        className={`h-10 rounded-xl pl-8 pr-4 text-sm font-bold border-2 ${isDark ? 'bg-white/[0.06] text-violet-400 border-white/8' : 'bg-slate-50 text-violet-600 border-slate-200'}`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Duration (min)</Label>
                                <div className="relative">
                                    <Clock size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-sky-400' : 'text-sky-500'}`} />
                                    <Input
                                        type="number" min="1"
                                        value={editingLesson?.duration || editingLesson?.duration_minutes || 0}
                                        onChange={(e) => setEditingLesson({ ...editingLesson, duration: Number(e.target.value), duration_minutes: Number(e.target.value) })}
                                        className={`h-10 rounded-xl pl-8 pr-4 text-sm font-bold border-2 ${isDark ? 'bg-white/[0.06] text-sky-400 border-white/8' : 'bg-slate-50 text-sky-600 border-slate-200'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Published toggle */}
                        <div className={cn(
                            'flex items-center justify-between p-4 rounded-2xl border-2 transition-colors',
                            (editingLesson?.is_published ?? true)
                                ? isDark
                                    ? `border-${accent.name}-400/30 bg-${accent.name}-400/5`
                                    : 'border-indigo-200 bg-indigo-50/50'
                                : t.border(isDark)
                        )}>
                            <div>
                                <Label className={`text-sm font-black ${(editingLesson?.is_published ?? true) && isDark ? accent.text : t.textPrimary(isDark)}`}>
                                    Publish Lesson
                                </Label>
                                <p className={`text-[10px] font-medium mt-0.5 ${t.textMuted(isDark)}`}>
                                    Make this lesson visible to students.
                                </p>
                            </div>
                            <Switch
                                checked={editingLesson?.is_published ?? true}
                                onCheckedChange={(val) => setEditingLesson({ ...editingLesson, is_published: val })}
                            />
                        </div>
                    </div>

                    {/* ── Footer ───────────────────────────────── */}
                    <div className={`px-6 py-4 border-t flex items-center justify-between gap-3 ${t.border(isDark)}`}>
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className={`rounded-full px-6 font-black text-xs ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500'}`}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className={`rounded-full px-8 font-black text-xs h-11 ${accent.bg} text-slate-900 ${accent.bgHover} shadow-lg`}
                        >
                            {isEditing ? 'Save Changes' : 'Create Lesson'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Media Library picker */}
            <MediaLibraryPicker
                open={libraryOpen}
                onOpenChange={setLibraryOpen}
                filterType={(() => {
                    if (!libraryTargetId) return undefined;
                    // Multi-image slot: "blockId:imgIdx"
                    if (libraryTargetId.includes(':')) return 'image';
                    const targetItem = contentItems.find(i => i.id === libraryTargetId);
                    return targetItem ? getLibraryFilter(targetItem.type) : undefined;
                })()}
                onSelect={(url) => {
                    if (libraryTargetId) {
                        if (libraryTargetId.includes(':')) {
                            // Multi-image slot
                            const [blockId, imgIdxStr] = libraryTargetId.split(':');
                            const imgIdx = parseInt(imgIdxStr, 10);
                            const block = contentItems.find(i => i.id === blockId);
                            if (block) {
                                const updated = [...getImageUrls(block)];
                                updated[imgIdx] = url;
                                applyImageUrls(blockId, updated);
                            }
                        } else {
                            applyBlockUpdate(libraryTargetId, 'url', url);
                        }
                        setLibraryTargetId(null);
                    }
                    setLibraryOpen(false);
                }}
            />

            {/* Quiz import picker */}
            {lessonMode === 'quiz' && editingLesson?.id && (
                <EntityLibraryPicker
                    open={importOpen}
                    onOpenChange={setImportOpen}
                    entityType="quiz"
                    onSelect={async (sourceId) => {
                        try {
                            // Find the destination course ID from the lesson itself
                            const destCourseId = editingLesson.course_id;
                            
                            await cloneQuizAction(sourceId, editingLesson.id!, destCourseId);
                            toast.success('Quiz imported!');
                            if (onSave) onSave(); // Refresh data
                        } catch (err: any) {
                            console.error(`[LessonDialog] Import failed:`, err);
                            toast.error(`Failed to import quiz: ${err.message || 'Unknown error'}`);
                        }
                        setImportOpen(false);
                    }}
                />
            )}
        </>
    );
}
