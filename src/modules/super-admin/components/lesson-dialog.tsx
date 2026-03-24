'use client';

import React from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Lesson } from '../types';
import { useAdminTheme, t } from '../theme-context';
import {
    BookOpen, Play, FileText, MonitorPlay, HelpCircle, ExternalLink,
    Zap, Clock, X, Upload, Link2, Library, FileDown, Trophy, Loader2,
    Cloud, HardDrive, Image as ImageIcon, Eye, Star, CheckCircle2,
    FileImage, Film, Layers
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

const CONTENT_TYPES = [
    { id: 'video',      label: 'Video',       icon: Film,        desc: 'MP4, YouTube, Vimeo',     color: 'text-rose-500',   bg: 'bg-rose-50',    border: 'border-rose-200' },
    { id: 'pdf',        label: 'Document',    icon: FileText,    desc: 'PDF, Word, Text',          color: 'text-sky-500',    bg: 'bg-sky-50',     border: 'border-sky-200' },
    { id: 'image',      label: 'Image',       icon: ImageIcon,   desc: 'JPG, PNG, WebP, GIF',      color: 'text-emerald-500',bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'ppt',        label: 'Slides',      icon: MonitorPlay, desc: 'PPT, PPTX, Keynote',       color: 'text-amber-500',  bg: 'bg-amber-50',   border: 'border-amber-200' },
    { id: 'assignment', label: 'Mission',     icon: Trophy,      desc: 'Document submission',      color: 'text-violet-500', bg: 'bg-violet-50',  border: 'border-violet-200' },
    { id: 'quiz',       label: 'Quiz',        icon: HelpCircle,  desc: 'Interactive assessment',   color: 'text-indigo-500', bg: 'bg-indigo-50',  border: 'border-indigo-200' },
];

export function LessonDialog({
    open, onOpenChange, editingLesson, setEditingLesson, onSave
}: LessonDialogProps) {
    const { isDark, accent } = useAdminTheme();
    const isEditing = !!editingLesson?.id;
    const router = useRouter();
    const [libraryOpen, setLibraryOpen] = React.useState(false);
    const [importOpen, setImportOpen] = React.useState(false);
    const [uploadFile, setUploadFile] = React.useState<File | null>(null);
    const [storagePref, setStoragePref] = React.useState<'r2' | 'local'>('r2');
    const [validationError, setValidationError] = React.useState<string | null>(null);
    const [isDraggingOver, setIsDraggingOver] = React.useState(false);

    const { upload, progress, isUploading, error: uploadError, reset: resetUpload, abort, uploadId } = useUpload({
        onSuccess: (data) => {
            setEditingLesson({ ...editingLesson, content_url: data.url, asset_id: data.assetId ?? null });
            toast.success('File uploaded successfully');
            setUploadFile(null);
        },
        onError: (err) => {
            toast.error(err || 'Failed to upload file');
        }
    });

    React.useEffect(() => {
        if (isUploading && open) {
            uploadStore.updateTask(uploadId, { isLocalVisible: true });
        } else {
            uploadStore.updateTask(uploadId, { isLocalVisible: false });
        }
        return () => { uploadStore.updateTask(uploadId, { isLocalVisible: false }); };
    }, [uploadId, isUploading, open]);

    const libraryFilterType = React.useMemo(() => {
        if (editingLesson?.content_type === 'video') return 'video' as const;
        if (editingLesson?.content_type === 'pdf' || editingLesson?.content_type === 'ppt') return 'document' as const;
        if (editingLesson?.content_type === 'image') return 'image' as const;
        return undefined;
    }, [editingLesson?.content_type]);

    const validateUrl = (url: string, type: string) => {
        if (!url) return null;
        if (url.startsWith('http://') && !url.includes('localhost'))
            return 'Insecure link (HTTP). Use HTTPS.';
        try {
            const parsed = new URL(url);
            const ext = parsed.pathname.split('.').pop()?.toLowerCase();
            if (type === 'video') {
                const ok = ['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')
                    || url.includes('youtube.com') || url.includes('youtu.be')
                    || url.includes('vimeo.com')
                    || url.includes('r2.cloudflarestorage.com')
                    || url.startsWith('/api/media/');
                if (!ok) return 'Provide a valid Video URL (MP4, YouTube, Vimeo).';
            } else if (type === 'pdf') {
                const ok = ['pdf', 'doc', 'docx', 'txt'].includes(ext || '') || url.includes('docs.google.com');
                if (!ok) return 'Provide a valid Document URL (PDF, Word, Google Docs).';
            } else if (type === 'ppt') {
                const ok = ['ppt', 'pptx', 'key'].includes(ext || '') || url.includes('docs.google.com/presentation');
                if (!ok) return 'Provide a valid Slides URL (PPTX, Google Slides).';
            } else if (type === 'image') {
                const ok = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext || '')
                    || url.includes('r2.cloudflarestorage.com') || url.startsWith('/api/media/');
                if (!ok) return 'Provide a valid Image URL (JPG, PNG, WebP, GIF).';
            }
        } catch {
            if (!url.startsWith('/') && !url.startsWith('./'))
                return 'Invalid URL. Include http:// or https://';
        }
        return null;
    };

    React.useEffect(() => {
        if (editingLesson?.content_url && editingLesson?.content_type) {
            setValidationError(validateUrl(editingLesson.content_url, editingLesson.content_type));
        } else {
            setValidationError(null);
        }
    }, [editingLesson?.content_url, editingLesson?.content_type]);

    const acceptMap: Record<string, string> = {
        video: 'video/*',
        pdf: '.pdf,.doc,.docx,.txt',
        ppt: '.ppt,.pptx,.key',
        image: 'image/*',
    };

    const handleFileChosen = async (file: File) => {
        if (!file) return;
        const maxSize = 2048 * 1024 * 1024;
        if (file.size > maxSize) { toast.error('File too large. Max 2 GB.'); return; }

        if (file.type.startsWith('video/')) {
            setUploadFile(file);
            try {
                const res = await fetch('/api/media/stream-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name }),
                });
                if (!res.ok) {
                    if (res.status === 503) {
                        toast.info('Cloudflare Stream not configured — using standard upload.');
                        await upload(file, { purpose: 'library', storagePreference: storagePref, folder: 'lesson' });
                        return;
                    }
                    const err = await res.json().catch(() => ({ error: 'Stream upload unavailable' }));
                    throw new Error(err.error || 'Failed to create stream upload');
                }
                const { uploadUrl, uid } = await res.json();
                toast.info('Uploading to Cloudflare Stream…');
                const formData = new FormData();
                formData.append('file', file);
                const cfRes = await fetch(uploadUrl, { method: 'POST', body: formData });
                if (!cfRes.ok) throw new Error('Failed to upload to Cloudflare Stream');
                setEditingLesson({ ...editingLesson, content_url: `cf-stream://${uid}`, asset_id: null });
                toast.success('Video uploaded to Cloudflare Stream!');
                setUploadFile(null);
            } catch (err: any) {
                toast.error(err?.message || 'Video upload failed');
                setUploadFile(null);
            }
            return;
        }

        setUploadFile(file);
        const additionalData: Record<string, string> = {
            purpose: 'library', storagePreference: storagePref, folder: 'lesson'
        };
        if (editingLesson?.id) {
            additionalData.contextType = 'lesson';
            additionalData.contextId = editingLesson.id;
        }
        try { await upload(file, additionalData); } catch (error) { console.error('Upload error:', error); }
    };

    const selectedType = CONTENT_TYPES.find(c => c.id === editingLesson?.content_type);
    const hasContent = !!editingLesson?.content_url;
    const isQuiz = editingLesson?.content_type === 'quiz';
    const isAssignment = editingLesson?.content_type === 'assignment';

    // ─────────────────────────────────────────────────────────────
    // Live Preview helpers
    // ─────────────────────────────────────────────────────────────
    const PreviewContentArea = () => {
        const url = editingLesson?.content_url;
        const type = editingLesson?.content_type;

        if (!url && !type) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                        <Eye size={28} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                    </div>
                    <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                        Preview will appear here
                    </p>
                </div>
            );
        }

        if (type === 'video') {
            const isCf = url?.startsWith('cf-stream://');
            return (
                <div className="w-full aspect-video bg-slate-950 flex items-center justify-center relative overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
                    <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Play size={22} className="text-white ml-1" fill="white" />
                        </div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                            {isCf ? 'Cloudflare Stream' : 'Video Lesson'}
                        </span>
                    </div>
                    {url && !url.startsWith('cf-stream://') && (
                        <div className="absolute bottom-3 left-3 right-3">
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-white/40 rounded-full w-1/3" />
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (type === 'image' && url) {
            return (
                <div className="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Preview" className="w-full h-full object-contain" />
                </div>
            );
        }

        if (type === 'pdf') {
            return (
                <div className="w-full aspect-video bg-sky-50 rounded-xl flex flex-col items-center justify-center gap-3 border border-sky-100">
                    <div className="w-12 h-14 bg-sky-600 rounded-lg flex items-center justify-center shadow-lg">
                        <FileText size={20} className="text-white" />
                    </div>
                    <p className="text-xs font-black text-sky-600 uppercase tracking-widest">PDF Document</p>
                    {url && <p className="text-[9px] text-sky-400 font-bold truncate max-w-[200px]">{url.split('/').pop()}</p>}
                </div>
            );
        }

        if (type === 'ppt') {
            return (
                <div className="w-full aspect-video bg-amber-50 rounded-xl flex flex-col items-center justify-center gap-3 border border-amber-100">
                    <div className="w-12 h-14 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                        <Layers size={20} className="text-white" />
                    </div>
                    <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Presentation</p>
                </div>
            );
        }

        if (type === 'quiz') {
            return (
                <div className="w-full aspect-video bg-indigo-50 rounded-xl flex flex-col items-center justify-center gap-3 border border-indigo-100">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <HelpCircle size={26} className="text-white" />
                    </div>
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Interactive Quiz</p>
                </div>
            );
        }

        if (type === 'assignment') {
            return (
                <div className="w-full aspect-video bg-violet-50 rounded-xl flex flex-col items-center justify-center gap-3 border border-violet-100">
                    <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Trophy size={26} className="text-white" />
                    </div>
                    <p className="text-xs font-black text-violet-600 uppercase tracking-widest">Assignment</p>
                </div>
            );
        }

        return (
            <div className="w-full aspect-video bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                <FileImage size={32} className="text-slate-300" />
            </div>
        );
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={cn(
                    "w-[95vw] max-w-[580px] xl:max-w-[960px] rounded-2xl sm:rounded-3xl border-0 shadow-2xl p-0 overflow-hidden",
                    isDark ? 'bg-[#0f1219]' : 'bg-white'
                )}>

                    {/* ── Header ──────────────────────────────────────── */}
                    <div className={`px-5 sm:px-7 py-4 sm:py-5 border-b flex items-center gap-3 ${t.border(isDark)}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.bg} text-slate-900 flex-shrink-0`}>
                            <BookOpen size={17} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className={`text-base sm:text-lg font-[900] tracking-tight leading-none ${t.textPrimary(isDark)}`}>
                                {isEditing ? 'Update Lesson' : 'Create Lesson'}
                            </h2>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${t.textMuted(isDark)}`}>
                                {isEditing ? 'Edit lesson details & content' : 'Add a new lesson to this course'}
                            </p>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'text-slate-500 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* ── Body: two-column only at xl (1280px+) ───────── */}
                    <div className="flex flex-col xl:flex-row" style={{ maxHeight: 'calc(90vh - 130px)', overflow: 'hidden' }}>

                        {/* ── LEFT: Form ─────────────────────────────── */}
                        <div className={`flex-1 min-w-0 overflow-y-auto px-5 sm:px-7 py-5 sm:py-6 space-y-5 ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>

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

                            {/* Content Type */}
                            <div className="space-y-2">
                                <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Content Type</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CONTENT_TYPES.map((type) => {
                                        const isSelected = editingLesson?.content_type === type.id;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => setEditingLesson({ ...editingLesson, content_type: type.id })}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border-2 transition-all text-left",
                                                    isSelected
                                                        ? isDark
                                                            ? `${accent.softDark.split(' ')[0]} border-${accent.name}-400/60 shadow-lg`
                                                            : `${type.bg} ${type.border} shadow-sm`
                                                        : isDark
                                                            ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                                                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                                )}
                                            >
                                                <div className={cn(
                                                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                                                    isSelected
                                                        ? isDark ? `${accent.bg} text-slate-900` : `${type.bg} ${type.color}`
                                                        : isDark ? 'bg-white/10 text-slate-400' : 'bg-white text-slate-400 border border-slate-200'
                                                )}>
                                                    <type.icon size={15} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={cn('text-xs font-black tracking-tight leading-none truncate', isSelected ? (isDark ? accent.text : type.color) : t.textPrimary(isDark))}>
                                                        {type.label}
                                                    </p>
                                                    <p className={cn('text-[9px] font-medium mt-0.5 leading-none truncate', t.textMuted(isDark))}>{type.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Description</Label>
                                <Textarea
                                    placeholder="What will students learn in this lesson?"
                                    value={editingLesson?.description || ''}
                                    onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                                    className={`rounded-xl min-h-[90px] p-3 text-sm font-medium border-2 transition-all resize-none ${isDark ? 'bg-white/[0.06] text-white border-white/8 focus-visible:border-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 focus-visible:border-slate-400'}`}
                                />
                            </div>

                            {/* ── Content section (not for quiz/assignment) ── */}
                            {!isQuiz && !isAssignment && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Lesson Content</Label>
                                        {hasContent && (
                                            <button
                                                type="button"
                                                onClick={() => window.open(editingLesson!.content_url!, '_blank')}
                                                className={`text-[10px] font-bold flex items-center gap-1 hover:underline ${isDark ? accent.text : 'text-slate-500'}`}
                                            >
                                                Open <ExternalLink size={10} />
                                            </button>
                                        )}
                                    </div>

                                    {/* ─ Drag-drop upload zone ─ */}
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                                        onDragLeave={() => setIsDraggingOver(false)}
                                        onDrop={async (e) => {
                                            e.preventDefault();
                                            setIsDraggingOver(false);
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) await handleFileChosen(file);
                                        }}
                                        className={cn(
                                            'relative rounded-2xl border-2 border-dashed transition-all p-5 text-center cursor-pointer',
                                            isDraggingOver
                                                ? isDark ? `border-${accent.name}-400/60 bg-${accent.name}-400/10` : `border-indigo-400 bg-indigo-50`
                                                : isDark ? 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]' : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50'
                                        )}
                                        onClick={() => document.getElementById('lesson-file-upload-dialog')?.click()}
                                    >
                                        <input
                                            type="file"
                                            id="lesson-file-upload-dialog"
                                            className="hidden"
                                            accept={editingLesson?.content_type ? (acceptMap[editingLesson.content_type] || '*') : '*'}
                                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChosen(f); }}
                                        />
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-2 py-2">
                                                <Loader2 size={24} className={`animate-spin ${isDark ? accent.text : 'text-indigo-500'}`} />
                                                <p className={`text-xs font-bold ${t.textMuted(isDark)}`}>Uploading…</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 py-1">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-white border border-slate-200'} shadow-sm`}>
                                                    {selectedType ? <selectedType.icon size={18} className={isDark ? accent.text : selectedType.color} /> : <Upload size={18} className="text-slate-400" />}
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-black ${t.textPrimary(isDark)}`}>
                                                        Drop file here or <span className={isDark ? accent.text : 'text-indigo-600'}>browse</span>
                                                    </p>
                                                    <p className={`text-[9px] font-medium mt-0.5 ${t.textMuted(isDark)}`}>
                                                        {selectedType ? selectedType.desc : 'Select content type first'} · Max 2 GB
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload progress */}
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

                                    {/* Quick link row + Library + Storage */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        {/* URL input */}
                                        <div className="flex-1 relative group">
                                            <Link2 size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                            <Input
                                                placeholder="Or paste URL…"
                                                value={editingLesson?.content_url && !editingLesson.content_url.startsWith('/api/media/') && !editingLesson.content_url.includes('r2.cloudflarestorage.com') ? editingLesson.content_url : ''}
                                                onChange={(e) => setEditingLesson({ ...editingLesson, content_url: e.target.value })}
                                                className={cn(
                                                    'h-10 rounded-xl pl-9 pr-4 text-xs font-medium border-2 transition-all',
                                                    validationError ? 'border-rose-400/60' : isDark ? 'bg-white/[0.04] text-white border-white/8 focus-visible:border-white/20' : 'bg-slate-50 border-slate-200 focus-visible:border-slate-400'
                                                )}
                                            />
                                        </div>

                                        {/* Browse library */}
                                        <Button
                                            type="button"
                                            onClick={() => setLibraryOpen(true)}
                                            className={`h-10 rounded-xl border-2 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider transition-all bg-transparent flex-shrink-0 px-3 ${isDark ? `border-white/10 text-slate-400 hover:border-${accent.name}-400/40 hover:bg-${accent.name}-400/5 hover:${accent.text}` : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <Library size={13} /> Media
                                        </Button>

                                        {/* Storage toggle */}
                                        <div className={`h-10 px-1 rounded-xl flex gap-0.5 border-2 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'} flex-shrink-0`}>
                                            {[{ id: 'r2', label: 'Cloud', icon: Cloud }, { id: 'local', label: 'Server', icon: HardDrive }].map(opt => {
                                                const isActive = storagePref === opt.id;
                                                return (
                                                    <button key={opt.id} type="button"
                                                        onClick={() => setStoragePref(opt.id as 'r2' | 'local')}
                                                        className={cn(
                                                            'flex items-center gap-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all',
                                                            isActive ? isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-sm border border-slate-200' : isDark ? 'text-slate-600 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                                                        )}>
                                                        <opt.icon size={10} />{opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {validationError && (
                                        <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1.5 px-1">
                                            <span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />{validationError}
                                        </p>
                                    )}

                                    {/* Current content pill */}
                                    {hasContent && (
                                        <div className={cn(
                                            'flex items-center gap-3 p-3 rounded-xl border-2 group/pill',
                                            isDark ? `border-${accent.name}-400/20 bg-white/[0.02]` : 'border-emerald-100 bg-emerald-50/50'
                                        )}>
                                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm', isDark ? 'bg-white/5' : 'bg-white border border-slate-100')}>
                                                {selectedType
                                                    ? <selectedType.icon size={16} className={isDark ? 'text-white' : selectedType.color} />
                                                    : <CheckCircle2 size={16} className="text-emerald-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[11px] font-black truncate ${t.textPrimary(isDark)}`}>
                                                    {editingLesson!.content_url!.startsWith('cf-stream://')
                                                        ? `Cloudflare Stream: ${editingLesson!.content_url!.replace('cf-stream://', '').slice(0, 12)}…`
                                                        : editingLesson!.content_url!.split('/').pop()?.split('?')[0] || 'Content linked'}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>
                                                        {selectedType?.label || 'Content'} linked
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button type="button"
                                                    onClick={() => window.open(editingLesson!.content_url!, '_blank')}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'hover:bg-white/10 text-slate-500' : 'hover:bg-white text-slate-400 hover:text-slate-700'}`}>
                                                    <ExternalLink size={14} />
                                                </button>
                                                <button type="button"
                                                    onClick={() => setEditingLesson({ ...editingLesson, content_url: '' })}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'hover:bg-rose-500/20 text-rose-500/40 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-300 hover:text-rose-500'}`}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quiz placeholder */}
                            {isQuiz && (
                                <div className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <HelpCircle size={24} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black uppercase tracking-wide ${t.textPrimary(isDark)}`}>Quiz Questions</p>
                                        <p className={`text-[10px] font-medium mt-1 ${t.textMuted(isDark)}`}>
                                            Questions are managed in the Quiz Builder after saving.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Assignment placeholder */}
                            {isAssignment && (
                                <div className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black uppercase tracking-wide ${t.textPrimary(isDark)}`}>Assignment Mission</p>
                                        <p className={`text-[10px] font-medium mt-1 ${t.textMuted(isDark)}`}>
                                            Students submit a document. Managed in the full lesson editor.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* XP + Duration */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>XP Reward</Label>
                                    <div className="relative">
                                        <Zap size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} />
                                        <Input
                                            type="number" min="0"
                                            value={editingLesson?.xp_reward || 0}
                                            onChange={(e) => setEditingLesson({ ...editingLesson, xp_reward: Number(e.target.value) })}
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
                            <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-colors ${(editingLesson?.is_published ?? true) ? (isDark ? `border-${accent.name}-400/30 ${accent.softDark.split(' ')[0].replace('/10', '/5')}` : `border-${accent.name}-200 ${accent.softLight.split(' ')[0]}`) : t.border(isDark)}`}>
                                <div>
                                    <Label className={`text-sm font-black ${(editingLesson?.is_published ?? true) && isDark ? accent.text : t.textPrimary(isDark)}`}>Publish Lesson</Label>
                                    <p className={`text-[10px] font-medium mt-0.5 ${t.textMuted(isDark)}`}>Make this lesson visible to students.</p>
                                </div>
                                <Switch
                                    checked={editingLesson?.is_published ?? true}
                                    onCheckedChange={(val) => setEditingLesson({ ...editingLesson, is_published: val })}
                                    className={`data-[state=checked]:${accent.bg}`}
                                />
                            </div>

                            {/* Quiz builder launcher */}
                            {isQuiz && editingLesson && (
                                <div className="space-y-3 pt-2 border-t border-dashed border-white/5">
                                    <div className="flex items-center justify-between">
                                        <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? accent.text : 'text-slate-700'}`}>Quiz Management</h4>
                                        <Button type="button" variant="outline" size="sm"
                                            onClick={() => setImportOpen(true)}
                                            className="rounded-full h-7 border-2 font-bold px-3 text-[9px]">
                                            <FileDown size={11} className="mr-1" /> Import Quiz
                                        </Button>
                                    </div>
                                    <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 ${isDark ? `${accent.softDark.split(' ')[0].replace('/10', '/5')} border-${accent.name}-400/20` : 'bg-slate-50 border-slate-200'}`}>
                                        <div>
                                            <p className={`text-sm font-black uppercase tracking-tight ${isDark ? accent.text : 'text-slate-900'}`}>Quiz Builder</p>
                                            <p className={`text-[10px] font-medium mt-0.5 ${t.textMuted(isDark)}`}>
                                                {editingLesson.id ? 'Add & manage questions' : 'Save lesson first to build quiz'}
                                            </p>
                                        </div>
                                        <Button type="button" disabled={!editingLesson.id}
                                            onClick={() => router.push(`/admin/quiz/${editingLesson.id}`)}
                                            className={`rounded-full px-5 font-black text-[10px] h-10 gap-2 shrink-0 ${accent.bg} text-slate-900 ${accent.bgHover} shadow-lg`}
                                            style={t.glowStyle(isDark, accent)}>
                                            <MonitorPlay size={13} strokeWidth={3} />
                                            {editingLesson.id ? 'Build Quiz' : 'Save First'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── RIGHT: Live Preview (xl+ only) ──────────── */}
                        <div className={cn(
                            'hidden xl:flex xl:flex-col xl:w-[360px] xl:min-w-[360px] flex-shrink-0 border-l overflow-y-auto',
                            isDark ? 'border-white/8 bg-[#0a0d14]' : 'border-slate-100 bg-slate-50/60'
                        )}>
                            {/* Preview header */}
                            <div className={`px-5 py-4 border-b flex items-center gap-2 ${t.border(isDark)}`}>
                                <Eye size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted(isDark)}`}>Student Preview</span>
                                <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-200 text-slate-400'} uppercase tracking-widest`}>
                                    Live
                                </span>
                            </div>

                            <div className="p-4 sm:p-5 space-y-4">
                                {/* Simulated lesson header bar */}
                                <div className={`flex items-center gap-2 p-2.5 rounded-xl ${isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-white border border-slate-100 shadow-sm'}`}>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                                        <div className={`w-2 h-2 rounded-sm ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`h-1.5 rounded-full w-16 mb-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                        <p className={`text-[10px] font-black truncate ${t.textPrimary(isDark)}`}>
                                            {editingLesson?.title || 'Lesson Title'}
                                        </p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                        +{editingLesson?.xp_reward || 0} XP
                                    </div>
                                </div>

                                {/* Content preview */}
                                <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                                    <PreviewContentArea />
                                </div>

                                {/* Lesson info card */}
                                <div className={`rounded-2xl p-4 space-y-3 ${isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-white border border-slate-100 shadow-sm'}`}>
                                    {/* Type badge */}
                                    {selectedType && (
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1 h-3.5 rounded-full ${isDark ? 'bg-indigo-500' : 'bg-indigo-600'}`} />
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                {selectedType.label} Module
                                            </span>
                                        </div>
                                    )}
                                    <h3 className={`text-base font-black uppercase tracking-tight leading-tight ${t.textPrimary(isDark)}`}>
                                        {editingLesson?.title || <span className={`${t.textMuted(isDark)}`}>Lesson Title</span>}
                                    </h3>
                                    {editingLesson?.description && (
                                        <p className={`text-xs font-medium leading-relaxed line-clamp-3 ${t.textMuted(isDark)}`}>
                                            {editingLesson.description}
                                        </p>
                                    )}

                                    {/* Stats row */}
                                    <div className={`flex items-center gap-3 pt-3 border-t ${t.border(isDark)}`}>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                                                <Star size={11} className="text-amber-500 fill-amber-500" />
                                            </div>
                                            <span className={`text-[10px] font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                +{editingLesson?.xp_reward || 0} XP
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-sky-500/10' : 'bg-sky-50'}`}>
                                                <Clock size={11} className="text-sky-500" />
                                            </div>
                                            <span className={`text-[10px] font-black ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                                                {editingLesson?.duration || editingLesson?.duration_minutes || 0} min
                                            </span>
                                        </div>
                                        <div className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase ${(editingLesson?.is_published ?? true) ? isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50' : isDark ? 'text-slate-500 bg-white/5' : 'text-slate-400 bg-slate-100'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${(editingLesson?.is_published ?? true) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                            {(editingLesson?.is_published ?? true) ? 'Published' : 'Draft'}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile note */}
                                <p className={`text-[9px] font-bold text-center uppercase tracking-widest ${t.textMuted(isDark)}`}>
                                    Optimised for mobile & desktop
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Footer ──────────────────────────────────────── */}
                    <div className={`px-5 sm:px-7 py-4 border-t flex items-center justify-between gap-3 flex-shrink-0 ${isDark ? 'border-white/8 bg-[#0f1219]' : 'border-slate-100 bg-white'}`}>
                        <Button variant="ghost" onClick={() => onOpenChange(false)}
                            className={`rounded-xl h-10 px-5 font-bold text-sm bg-transparent ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                            Cancel
                        </Button>
                        <Button
                            onClick={onSave}
                            disabled={!editingLesson?.title?.trim() || !!validationError}
                            className={`rounded-xl h-10 px-7 font-black text-sm shadow-lg transition-all ${(!editingLesson?.title?.trim() || !!validationError) ? 'opacity-50 cursor-not-allowed' : ''} ${t.btnPrimary(isDark, accent)}`}
                            style={t.glowStyle(isDark, accent)}>
                            {isEditing ? 'Save Changes' : 'Create Lesson'}
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>

            <MediaLibraryPicker
                open={libraryOpen}
                onOpenChange={setLibraryOpen}
                filterType={libraryFilterType}
                folder="lesson"
                currentUrl={editingLesson?.content_url}
                onSelect={(url, assetId) => setEditingLesson({ ...editingLesson, content_url: url, asset_id: assetId })}
            />

            <EntityLibraryPicker
                open={importOpen}
                onOpenChange={setImportOpen}
                type="quiz"
                onSelect={async (quizId) => {
                    if (!editingLesson?.id) { toast.error("Save the lesson first before importing a quiz."); return; }
                    try {
                        const loadingId = toast.loading("Importing quiz…");
                        await cloneQuizAction(quizId, editingLesson.id, editingLesson.course_id!);
                        toast.success("Quiz imported", { id: loadingId });
                    } catch (error) {
                        console.error(error);
                        toast.error("Failed to import quiz");
                    }
                }}
            />
        </>
    );
}
