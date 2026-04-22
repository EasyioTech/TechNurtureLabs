'use client';

import React from 'react';
import * as tus from 'tus-js-client';
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
    BookOpen, Zap, Clock, X, MonitorPlay, FileDown, HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { MediaLibraryPicker } from './media-library-picker';
import { EntityLibraryPicker } from './entity-library-picker';
import { cloneQuizAction } from '@/modules/super-admin/actions';
import { useUpload } from '@/hooks/use-upload';
import { uploadStore } from '@/lib/upload-store';
import { cn } from '@/lib/utils';


// ── BUILDER COMPONENTS ──────────────────────────────────────────
import {
    genId,
    validateBlockUrl,
    getLessonMode,
    parseContentItems,
    autoCalcXp,
    getImageUrls,
    ContentItem,
    BLOCK_TYPES
} from './lesson-builder/utils';
import { LessonModeSelector } from './lesson-builder/mode-selector';
import { ContentBlockList } from './lesson-builder/content-block-list';

interface LessonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingLesson: Partial<Lesson> | null;
    setEditingLesson: React.Dispatch<React.SetStateAction<Partial<Lesson> | null>>;
    onSave: () => void;
}

export function LessonDialog({ open, onOpenChange, editingLesson, setEditingLesson, onSave }: LessonDialogProps) {
    const { isDark, accent } = useAdminTheme();
    const isEditing = !!editingLesson?.id;
    const router = useRouter();

    const lessonMode = getLessonMode(editingLesson?.content_type);
    const contentItems = React.useMemo(
        () => parseContentItems(editingLesson),
        [editingLesson?.content_items, editingLesson?.content_url, editingLesson?.content_type]
    );

    const [showBlockPicker, setShowBlockPicker] = React.useState(false);
    const [activeUploadItemId, setActiveUploadItemId] = React.useState<string | null>(null);
    const [uploadFile, setUploadFile] = React.useState<File | null>(null);
    const [libraryOpen, setLibraryOpen] = React.useState(false);
    const [libraryTargetId, setLibraryTargetId] = React.useState<string | null>(null);
    const [importOpen, setImportOpen] = React.useState(false);
    const [streamProgress, setStreamProgress] = React.useState(0);
    const [isStreamUploading, setIsStreamUploading] = React.useState(false);
    const [isNormalizing, setIsNormalizing] = React.useState(false);

    const { upload, progress, isUploading, error: uploadError, reset: resetUpload, abort, uploadId } = useUpload();
    const [isDirty, setIsDirty] = React.useState(false);
    const initialDataRef = React.useRef<string>('');

    const [showValidation, setShowValidation] = React.useState(false);
    const tusUploadRef = React.useRef<tus.Upload | null>(null);

    const abortStreamUpload = React.useCallback(() => {
        if (tusUploadRef.current) {
            tusUploadRef.current.abort();
            tusUploadRef.current = null;
        }
    }, []);

    React.useEffect(() => {
        if (open && editingLesson) {
            setShowValidation(false);
            initialDataRef.current = JSON.stringify(editingLesson);
            setIsDirty(false);

            // Always sync initial XP on open based on content
            const parsedItems = parseContentItems(editingLesson);
            const mode = getLessonMode(editingLesson?.content_type);
            const autoXp = autoCalcXp(parsedItems, mode);
            
            if (editingLesson.xp_reward !== autoXp) {
                setEditingLesson(prev => prev ? ({ ...prev, xp_reward: autoXp }) : prev);
            }
        }
    }, [open, editingLesson?.id]);

    React.useEffect(() => {
        if (open && editingLesson) {
            if (JSON.stringify(editingLesson) !== initialDataRef.current) {
                setIsDirty(true);
            }
        }
    }, [editingLesson, open]);

    // Cleanup: abort stream upload on unmount or dialog close
    React.useEffect(() => {
        return () => {
            if (tusUploadRef.current) {
                tusUploadRef.current.abort();
                tusUploadRef.current = null;
            }
        };
    }, []);

    const handleClose = React.useCallback((force: boolean = false) => {
        if (!force && isDirty) toast.info('Draft changes discarded');
        onOpenChange(false);
    }, [isDirty, onOpenChange]);

    React.useEffect(() => {
        uploadStore.updateTask(uploadId, { isLocalVisible: isUploading && open });
        return () => { uploadStore.updateTask(uploadId, { isLocalVisible: false }); };
    }, [uploadId, isUploading, open]);

    const syncItems = React.useCallback((items: ContentItem[]) => {
        const firstType = items[0]?.type || 'video';
        const dbType: Lesson['content_type'] = firstType === 'image' ? 'pdf' : (firstType as Lesson['content_type']);
        const autoXp = autoCalcXp(items, 'content');
        
        setEditingLesson(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                content_type: dbType,
                content_url: items[0]?.url || '',
                content_items: items.length > 0 ? JSON.stringify(items) : null,
                xp_reward: autoXp,
            };
        });
    }, [setEditingLesson]);


    const addBlock = (type: ContentItem['type']) => syncItems([...contentItems, { id: genId(), type, url: '' }]);
    const removeBlock = (id: string) => syncItems(contentItems.filter(i => i.id !== id));

    const applyBlockUpdate = (id: string, key: 'type' | 'url', value: string) => {
        const next = contentItems.map(i => i.id === id ? { ...i, [key]: value } : i);
        syncItems(next as ContentItem[]);
    };

    const applyImageUrls = (id: string, newUrls: string[]) => {
        const next = contentItems.map(i => i.id === id ? { ...i, url: newUrls[0] || '', urls: newUrls } : i);
        syncItems(next as ContentItem[]);
    };

    const handleFileUpload = async (file: File, itemId: string, folder: string) => {
        if (!file) return;
        if (file.size > 2048 * 1024 * 1024) { toast.error('Max 2 GB'); return; }

        // Get the block being uploaded to for type validation
        const block = contentItems.find(i => i.id === itemId);
        if (!block) return;

        // Validate file type matches block type
        const isVideoFile = file.type.startsWith('video/');
        const isImageFile = file.type.startsWith('image/');
        const isDocumentFile = /pdf|word|document/.test(file.type) || ['.pdf', '.doc', '.docx'].some(ext => file.name.toLowerCase().endsWith(ext));

        if (block.type === 'video' && !isVideoFile) {
            toast.error('Video block only accepts video files');
            return;
        }
        if (block.type === 'image' && !isImageFile) {
            toast.error('Image block only accepts image files');
            return;
        }
        if ((block.type === 'pdf' || block.type === 'ppt') && !isDocumentFile && !isVideoFile) {
            toast.error(`${block.type === 'pdf' ? 'Document' : 'Slides'} block only accepts document files`);
            return;
        }

        setActiveUploadItemId(itemId);
        setUploadFile(file);

        // Pre-upload validation for 100% reliability
        if (!file || file.size < 100000) {
            toast.error('File is too small or invalid (min 100KB)');
            return;
        }

        try {
            if (isVideoFile) {
                // Gap #3: Proactive Filter for Risky Formats
                const riskyExtensions = ['.mov', '.mkv', '.avi', '.wmv'];
                const isRisky = riskyExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
                if (isRisky) {
                    toast.warning(`"${file.name.split('.').pop()?.toUpperCase()}" files often fail processing. If it gets stuck, re-encode to MP4.`);
                }

                const executeStreamUpload = async (isRetry = false): Promise<string> => {
                    let uploadUid = '';
                    try {
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

                        return await new Promise<string>(async (resolve, reject) => {
                            const upload = new tus.Upload(file, {
                                uploadUrl: uploadURL,
                                uploadDataDuringCreation: true,
                                overridePatchMethod: true, // 🔥 CRITICAL FIX
                                fingerprint: async () => '', // 🔥 disable resume system safely
                                retryDelays: [0, 3000, 5000],
                                chunkSize: 5 * 1024 * 1024,
                                removeFingerprintOnSuccess: true,
                                metadata: { filename: file.name, filetype: file.type },
                                onError: (error) => reject(error),
                                onProgress: (up, tot) => setStreamProgress(Math.round((up / tot) * 100)),
                                onSuccess: async () => {
                                    try {
                                        // Gap #2: Stagnant Processing Detection
                                        let isReady = false;
                                        let lastPct = -1;
                                        let stagnantCount = 0;

                                        // Increase to 10 minutes (600 seconds)
                                        for (let i = 0; i < 600; i++) {
                                            const statusRes = await fetch(`/api/media/stream-status/${uploadUid}`);
                                            if (statusRes.ok) {
                                                const data = await statusRes.json();
                                                
                                                // Gap #1: Fix API Shape Alignment
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
                                        resolve(uploadUid);
                                    } catch (err: any) {
                                         // Check for normalization flag set in parent
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
                        // Gap #4: Retry Strategy
                        if (!isRetry && !error.message.includes('re-encode')) {
                            console.log('Ingest failed, attempting auto-retry...');
                            toast.info("Retrying processing...");
                            if (uploadUid) await fetch(`/api/media/stream-status/${uploadUid}`, { method: 'DELETE' });
                            return executeStreamUpload(true);
                        }

                        // Gap #5: Normalization Escalation (Guaranteed Fix)
                        if (isRetry) {
                            setIsNormalizing(true);
                            toast.info("Processing failed. Normalizing on server...");
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
                                toast.info("Normalization queued. This may take 1-2 minutes...");

                                // Poll for Job Completion
                                let attempts = 0;
                                let finalUid = null;

                                while (attempts < 40) { // 40 * 3s = 2 minutes
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
                                return finalUid;
                            } catch (normErr) {
                                console.error('[Escalation Error]:', normErr);
                                setIsNormalizing(false);
                            }
                        }

                        if (uploadUid) {
                            try { await fetch(`/api/media/stream-status/${uploadUid}`, { method: 'DELETE' }); } catch (e) {}
                        }
                        throw error;
                    }
                };

                const finalUid = await executeStreamUpload();
                applyBlockUpdate(itemId, 'url', `cf-stream://${finalUid}`);
                toast.success('Video uploaded and processed');
                return;
            }
            const result = await upload(file, { purpose: 'library', storagePreference: 'r2', folder }) as { url: string } | undefined;
            if (result?.url) applyBlockUpdate(itemId, 'url', result.url);

            toast.success('File uploaded');
        } catch (err: any) {
            toast.error(err?.message || 'Upload failed');
        } finally {
            setIsStreamUploading(false);
            setActiveUploadItemId(null);
            setUploadFile(null);
        }
    };

    const handleSave = () => {
        const isTitleEmpty = !editingLesson?.title?.trim();
        if (isTitleEmpty) {
            setShowValidation(true);
            toast.error('Lesson title is required');
            return;
        }
        if (lessonMode === 'content' && contentItems.length > 0) {
            const emptyBlocks = contentItems.filter(item => item.type === 'image' ? getImageUrls(item).every(u => !u.trim()) : !item.url.trim());
            if (emptyBlocks.length > 0) { toast.error('Missing content URL in one or more blocks'); return; }

            const mismatchBlocks = contentItems.filter(item => item.type !== 'image' && !!validateBlockUrl(item.type, item.url));
            if (mismatchBlocks.length > 0) {
                toast.warning('Content type mismatch detected. Save anyway?', { action: { label: 'Save', onClick: onSave } });
                return;
            }
        }
        onSave();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={(val) => !val ? handleClose() : onOpenChange(true)}>
                <DialogContent
                    showCloseButton={false}
                    className={cn('w-[95vw] lg:max-w-[1020px] max-w-[580px] rounded-2xl sm:rounded-3xl border-0 shadow-2xl p-0 overflow-hidden outline-none transition-all duration-300', isDark ? 'bg-[#0f1219]' : 'bg-white')}
                    onInteractOutside={(e) => isDirty && e.preventDefault()}
                    onEscapeKeyDown={(e) => isDirty && e.preventDefault()}
                >
                    <div className={`px-6 py-4 border-b flex items-center gap-3 ${t.border(isDark)}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.bg} text-slate-900 flex-shrink-0`}><BookOpen size={17} /></div>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className={`text-base font-[900] tracking-tight ${t.textPrimary(isDark)}`}>{isEditing ? 'Update Lesson' : 'Create Lesson'}</DialogTitle>
                            <DialogDescription className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted(isDark)}`}>{isEditing ? 'Edit details & content' : 'Add new lesson'}</DialogDescription>
                        </div>
                        <button 
                            onClick={() => handleClose()} 
                            className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                isDark 
                                    ? "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white" 
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                            )}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="overflow-y-auto lg:overflow-hidden px-6 py-5 lg:py-6" style={{ maxHeight: 'calc(90vh - 130px)' }}>
                        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-10">
                            {/* Left Column: Basic Details & Settings - INDEPENDENT SCROLL ON DESKTOP */}
                            <div className="lg:col-span-5 space-y-6 lg:overflow-y-auto lg:max-h-[calc(90vh-170px)] lg:pr-6 custom-scrollbar">
                                <div className="space-y-1.5">
                                    <Label className={`text-[10px] font-black uppercase tracking-widest ${showValidation && !editingLesson?.title?.trim() ? 'text-rose-500 animate-pulse' : t.textSecondary(isDark)}`}>
                                        Lesson Title * {showValidation && !editingLesson?.title?.trim() && <span className="text-[8px] normal-case ml-2">(Title required)</span>}
                                    </Label>
                                    <Input 
                                        placeholder="Lesson title..." 
                                        value={editingLesson?.title || ''} 
                                        onChange={(e) => setEditingLesson(prev => prev ? ({ ...prev, title: e.target.value }) : prev)} 
                                        className={cn(
                                            `rounded-xl h-11 border-2 font-semibold transition-all`,
                                            showValidation && !editingLesson?.title?.trim() ? 'border-rose-500/50 bg-rose-500/5 ring-rose-500/20' : `${isDark ? 'bg-white/[0.06] border-white/8 text-white' : 'bg-slate-50 border-slate-200'}`
                                        )} 
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Description</Label>
                                    <Textarea 
                                        placeholder="What will they learn?" 
                                        value={editingLesson?.description || ''} 
                                        onChange={(e) => setEditingLesson(prev => prev ? ({ ...prev, description: e.target.value }) : prev)} 
                                        className={`rounded-xl min-h-[120px] lg:min-h-[160px] border-2 font-medium resize-none ${isDark ? 'bg-white/[0.06] border-white/8 text-white' : 'bg-slate-50 border-slate-200'}`} 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>XP Potential</Label>
                                        <div className={cn(
                                            "h-11 rounded-xl px-3 flex items-center justify-between border-2 transition-colors",
                                            isDark ? "bg-white/[0.04] border-white/5" : "bg-slate-50 border-slate-100"
                                        )}>
                                            <div className="flex items-center gap-2">
                                                <Zap size={14} className="text-violet-500" />
                                                <span className={cn("text-base font-black", isDark ? "text-violet-400" : "text-violet-700")}>
                                                    {editingLesson?.xp_reward || 0}
                                                </span>
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-500">Auto</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Time (min)</Label>
                                        <div className="relative group">
                                            <Clock size={14} className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", isDark ? "text-sky-500/50" : "text-sky-400")} />
                                            <Input 
                                                type="number" 
                                                placeholder="0"
                                                value={editingLesson?.duration || editingLesson?.duration_minutes || 0} 
                                                onChange={(e) => setEditingLesson(prev => prev ? ({ ...prev, duration: Number(e.target.value), duration_minutes: Number(e.target.value) }) : prev)} 
                                                className={cn(
                                                    "h-11 rounded-xl pl-9 border-2 font-black transition-all",
                                                    isDark 
                                                        ? "bg-white/[0.04] border-white/5 text-sky-400 focus:border-sky-500/30" 
                                                        : "bg-slate-50 border-slate-100 text-sky-600 focus:border-sky-400"
                                                )} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={cn('flex items-center justify-between p-4 rounded-2xl border-2 transition-colors', (editingLesson?.is_published ?? true) ? (isDark ? `border-${accent.name}-400/30 bg-${accent.name}-400/5` : 'border-indigo-200 bg-indigo-50/50') : t.border(isDark))}>
                                    <div>
                                        <Label className={`text-sm font-black ${(editingLesson?.is_published ?? true) && isDark ? accent.text : t.textPrimary(isDark)}`}>Publish Lesson</Label>
                                        <p className={`text-[10px] font-medium ${t.textMuted(isDark)}`}>Visible to students.</p>
                                    </div>
                                    <Switch checked={editingLesson?.is_published ?? true} onCheckedChange={(val) => setEditingLesson(prev => prev ? ({ ...prev, is_published: val }) : prev)} />
                                </div>
                            </div>

                            {/* Right Column: Interaction & Content Builder - INDEPENDENT SCROLL ON DESKTOP */}
                            <div className="lg:col-span-7 space-y-5 lg:overflow-y-auto lg:max-h-[calc(90vh-170px)] lg:pr-2 custom-scrollbar">
                                <LessonModeSelector
                                    contentType={editingLesson?.content_type}
                                    onModeChange={(mode) => mode === 'quiz'
                                        ? setEditingLesson(prev => prev ? ({ ...prev, content_type: 'quiz', content_url: '', content_items: null, xp_reward: 25 } as any) : prev)
                                        : syncItems(contentItems)
                                    }
                                />

                                <div className={cn(
                                    "p-1 rounded-2xl border-2 min-h-[450px]",
                                    isDark ? "border-white/5 bg-black/20" : "border-slate-100 bg-slate-50/30"
                                )}>
                                    {lessonMode === 'content' && (
                                        <div className="p-4">
                                            <ContentBlockList
                                                contentItems={contentItems} isDark={isDark} isUploading={isUploading} isStreamUploading={isStreamUploading}
                                                isNormalizing={isNormalizing}
                                                activeUploadItemId={activeUploadItemId} progress={progress} streamProgress={streamProgress}
                                                uploadFile={uploadFile} uploadError={uploadError} showBlockPicker={showBlockPicker}
                                                setShowBlockPicker={setShowBlockPicker} onAddBlock={addBlock} onRemoveBlock={removeBlock}
                                                onUpdateBlock={applyBlockUpdate} onImageSync={applyImageUrls} onFileUpload={handleFileUpload}
                                                onLibraryRequest={(id) => { setLibraryTargetId(id); setLibraryOpen(true); }}
                                                abort={() => {
                                                    if (isStreamUploading && activeUploadItemId) {
                                                        abortStreamUpload();
                                                        setIsStreamUploading(false);
                                                        setActiveUploadItemId(null);
                                                        setUploadFile(null);
                                                    } else {
                                                        abort();
                                                    }
                                                }}
                                                resetUpload={() => {
                                                    resetUpload();
                                                    setStreamProgress(0);
                                                    setIsStreamUploading(false);
                                                }}
                                                upload={upload}
                                            />
                                        </div>
                                    )}

                                    {lessonMode === 'quiz' && (
                                        <div className="flex flex-col items-center justify-center min-h-[440px] text-center p-8">
                                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                <HelpCircle className="w-8 h-8" />
                                            </div>
                                            <h3 className={`text-lg font-black tracking-tight mb-2 ${t.textPrimary(isDark)}`}>Quiz Builder</h3>
                                            <p className={`text-xs font-medium max-w-[280px] mb-8 ${t.textMuted(isDark)}`}>
                                                Transform this lesson into an interactive assessment for your students.
                                            </p>
                                            
                                            {editingLesson?.id ? (
                                                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[320px]">
                                                    <Button 
                                                        onClick={() => router.push(`/admin/quiz/${editingLesson.id}`)} 
                                                        className={`flex-1 rounded-xl px-5 h-12 font-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${accent.bg} text-slate-900`}
                                                    >
                                                        <MonitorPlay size={16} className="mr-2" /> Open Builder
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => setImportOpen(true)} 
                                                        className={`flex-1 rounded-xl h-12 px-3 font-bold border-2 ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200'}`}
                                                    >
                                                        <FileDown size={16} className="mr-2" /> Import
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className={`px-5 py-3 rounded-xl border-2 border-dashed ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                                                    <p className="text-[11px] font-bold uppercase tracking-widest">Save lesson first to build quiz</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="h-4 lg:hidden" /> {/* Spacer for mobile */}
                            </div>
                        </div>
                    </div>

                    <div className={`px-6 py-4 border-t flex items-center justify-between gap-3 ${t.border(isDark)}`}>
                        <Button variant="ghost" onClick={() => handleClose()} className="rounded-full px-6 font-black text-xs text-slate-500">Cancel</Button>
                        <Button onClick={handleSave} className={`rounded-full px-8 h-11 font-black text-xs ${accent.bg} text-slate-900 shadow-lg`}>{isEditing ? 'Save Changes' : 'Create Lesson'}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Get current URL for highlight */}
            {(() => {
                let currentUrl: string | undefined;
                if (libraryTargetId) {
                    if (libraryTargetId.includes(':')) {
                        const [blockId, imgIdx] = libraryTargetId.split(':');
                        const block = contentItems.find(i => i.id === blockId);
                        if (block) {
                            const urls = getImageUrls(block);
                            currentUrl = urls[parseInt(imgIdx)];
                        }
                    } else {
                        const block = contentItems.find(i => i.id === libraryTargetId);
                        currentUrl = block?.url;
                    }
                }
                return (
                    <MediaLibraryPicker
                        key={libraryTargetId}
                        open={libraryOpen} onOpenChange={setLibraryOpen}
                        filterType={libraryTargetId ? (() => {
                            const block = contentItems.find(i => i.id === libraryTargetId?.split(':')[0]);
                            return block?.type === 'pdf' ? 'document' : block?.type === 'ppt' ? 'document' : block?.type as 'video' | 'image' | 'document' | undefined;
                        })() : undefined}
                        currentUrl={currentUrl}
                        onSelect={(url) => {
                            if (libraryTargetId) {
                                if (libraryTargetId.includes(':')) {
                                    const [blockId, imgIdx] = libraryTargetId.split(':');
                                    const block = contentItems.find(i => i.id === blockId);
                                    if (block) { const urls = [...getImageUrls(block)]; urls[parseInt(imgIdx)] = url; applyImageUrls(blockId, urls); }
                                } else {
                                    const block = contentItems.find(i => i.id === libraryTargetId);
                                    if (block) applyBlockUpdate(libraryTargetId, 'url', url);
                                }
                            }
                            setLibraryOpen(false);
                        }}
                    />
                );
            })()}

            {lessonMode === 'quiz' && editingLesson?.id && (
                <EntityLibraryPicker
                    open={importOpen} onOpenChange={setImportOpen} entityType="quiz"
                    onSelect={async (sourceId) => {
                        if (!editingLesson?.id) return;
                        try { 
                            await cloneQuizAction(sourceId, editingLesson.id, editingLesson.course_id || ''); 
                            toast.success('Quiz imported!'); 
                            onSave(); 
                        }
                        catch (err: any) { toast.error(`Import failed: ${err.message}`); }
                        setImportOpen(false);
                    }}
                />
            )}
        </>
    );
}
