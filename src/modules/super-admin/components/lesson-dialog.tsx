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
    setEditingLesson: (lesson: Partial<Lesson> | null) => void;
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

    const [isXpCustomized, setIsXpCustomized] = React.useState(false);
    const [showBlockPicker, setShowBlockPicker] = React.useState(false);
    const [activeUploadItemId, setActiveUploadItemId] = React.useState<string | null>(null);
    const [uploadFile, setUploadFile] = React.useState<File | null>(null);
    const [libraryOpen, setLibraryOpen] = React.useState(false);
    const [libraryTargetId, setLibraryTargetId] = React.useState<string | null>(null);
    const [importOpen, setImportOpen] = React.useState(false);
    const [streamProgress, setStreamProgress] = React.useState(0);
    const [isStreamUploading, setIsStreamUploading] = React.useState(false);

    const { upload, progress, isUploading, error: uploadError, reset: resetUpload, abort, uploadId } = useUpload();
    const [isDirty, setIsDirty] = React.useState(false);
    const initialDataRef = React.useRef<string>('');

    React.useEffect(() => {
        if (open && editingLesson) {
            initialDataRef.current = JSON.stringify(editingLesson);
            setIsDirty(false);

            // Recalculate auto XP on open if not customized
            const parsedItems = parseContentItems(editingLesson);
            const mode = getLessonMode(editingLesson?.content_type);
            const autoXp = autoCalcXp(parsedItems, mode);
            if (autoXp > 0 && !isXpCustomized) {
                setEditingLesson({ ...editingLesson, xp_reward: autoXp });
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
        setEditingLesson({
            ...editingLesson,
            content_type: dbType,
            content_url: items[0]?.url || '',
            content_items: items.length > 0 ? JSON.stringify(items) : null,
            ...(!isXpCustomized && { xp_reward: autoXp }),
        });
    }, [editingLesson, setEditingLesson, isXpCustomized]);


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

        try {
            if (isVideoFile) {
                const res = await fetch('/api/media/stream-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name }),
                });
                if (!res.ok) throw new Error('Failed to initialise stream upload');
                const { uploadUrl, uid } = await res.json();
                setIsStreamUploading(true);
                setStreamProgress(0);
                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', uploadUrl, true);
                    xhr.upload.onprogress = (e) => e.lengthComputable && setStreamProgress(Math.round((e.loaded / e.total) * 100));
                    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Cloudflare upload failed'));
                    xhr.onerror = () => reject(new Error('Network error'));
                    const fd = new FormData(); fd.append('file', file);
                    xhr.send(fd);
                });
                applyBlockUpdate(itemId, 'url', `cf-stream://${uid}`);
                toast.success('Video uploaded!');
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
        if (!editingLesson?.title?.trim()) { toast.error('Lesson title is required'); return; }
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

                    <div className="overflow-y-auto px-6 py-5 lg:py-6" style={{ maxHeight: 'calc(90vh - 130px)' }}>
                        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
                            {/* Left Column: Basic Details & Settings */}
                            <div className="lg:col-span-5 space-y-5">
                                <div className="space-y-1.5">
                                    <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Lesson Title *</Label>
                                    <Input placeholder="Lesson title..." value={editingLesson?.title || ''} onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })} className={`rounded-xl h-11 border-2 font-semibold ${isDark ? 'bg-white/[0.06] border-white/8 text-white' : 'bg-slate-50 border-slate-200'}`} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Description</Label>
                                    <Textarea placeholder="What will they learn?" value={editingLesson?.description || ''} onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })} className={`rounded-xl min-h-[100px] border-2 font-medium resize-none ${isDark ? 'bg-white/[0.06] border-white/8 text-white' : 'bg-slate-50 border-slate-200'}`} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>XP Reward</Label>
                                        <div className="relative">
                                            <Zap size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500" />
                                            <Input type="number" value={editingLesson?.xp_reward || 0} onChange={(e) => { setIsXpCustomized(true); setEditingLesson({ ...editingLesson, xp_reward: Number(e.target.value) }); }} className={`h-10 rounded-xl pl-8 border-2 font-bold ${isDark ? 'bg-white/[0.06] border-white/8 text-violet-400' : 'bg-slate-50 border-slate-200 text-violet-600'}`} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className={`text-[10px] font-black uppercase tracking-widest ${t.textSecondary(isDark)}`}>Duration (min)</Label>
                                        <div className="relative">
                                            <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" />
                                            <Input type="number" value={editingLesson?.duration || editingLesson?.duration_minutes || 0} onChange={(e) => setEditingLesson({ ...editingLesson, duration: Number(e.target.value), duration_minutes: Number(e.target.value) })} className={`h-10 rounded-xl pl-8 border-2 font-bold ${isDark ? 'bg-white/[0.06] border-white/8 text-sky-400' : 'bg-slate-50 border-slate-200 text-sky-600'}`} />
                                        </div>
                                    </div>
                                </div>

                                <div className={cn('flex items-center justify-between p-4 rounded-2xl border-2 transition-colors', (editingLesson?.is_published ?? true) ? (isDark ? `border-${accent.name}-400/30 bg-${accent.name}-400/5` : 'border-indigo-200 bg-indigo-50/50') : t.border(isDark))}>
                                    <div>
                                        <Label className={`text-sm font-black ${(editingLesson?.is_published ?? true) && isDark ? accent.text : t.textPrimary(isDark)}`}>Publish Lesson</Label>
                                        <p className={`text-[10px] font-medium ${t.textMuted(isDark)}`}>Visible to students.</p>
                                    </div>
                                    <Switch checked={editingLesson?.is_published ?? true} onCheckedChange={(val) => setEditingLesson({ ...editingLesson, is_published: val })} />
                                </div>
                            </div>

                            {/* Right Column: Interaction & Content Builder */}
                            <div className="lg:col-span-7 space-y-5">
                                <LessonModeSelector
                                    contentType={editingLesson?.content_type}
                                    onModeChange={(mode) => mode === 'quiz'
                                        ? setEditingLesson({ ...editingLesson, content_type: 'quiz', content_url: '', content_items: null, ...(!isXpCustomized && { xp_reward: 25 }) } as any)
                                        : syncItems(contentItems)
                                    }
                                />

                                <div className={cn(
                                    "p-1 rounded-2xl border-2 min-h-[400px]",
                                    isDark ? "border-white/5 bg-black/20" : "border-slate-100 bg-slate-50/30"
                                )}>
                                    {lessonMode === 'content' && (
                                        <div className="p-4">
                                            <ContentBlockList
                                                contentItems={contentItems} isDark={isDark} isUploading={isUploading} isStreamUploading={isStreamUploading}
                                                activeUploadItemId={activeUploadItemId} progress={progress} streamProgress={streamProgress}
                                                uploadFile={uploadFile} uploadError={uploadError} showBlockPicker={showBlockPicker}
                                                setShowBlockPicker={setShowBlockPicker} onAddBlock={addBlock} onRemoveBlock={removeBlock}
                                                onUpdateBlock={applyBlockUpdate} onImageSync={applyImageUrls} onFileUpload={handleFileUpload}
                                                onLibraryRequest={(id) => { setLibraryTargetId(id); setLibraryOpen(true); }}
                                                abort={abort} resetUpload={resetUpload} upload={upload}
                                            />
                                        </div>
                                    )}

                                    {lessonMode === 'quiz' && (
                                        <div className="flex flex-col items-center justify-center min-h-[390px] text-center p-8">
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
                            </div>
                        </div>
                    </div>

                    <div className={`px-6 py-4 border-t flex items-center justify-between gap-3 ${t.border(isDark)}`}>
                        <Button variant="ghost" onClick={() => handleClose()} className="rounded-full px-6 font-black text-xs text-slate-500">Cancel</Button>
                        <Button onClick={handleSave} className={`rounded-full px-8 h-11 font-black text-xs ${accent.bg} text-slate-900 shadow-lg`}>{isEditing ? 'Save Changes' : 'Create Lesson'}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <MediaLibraryPicker
                key={libraryTargetId}
                open={libraryOpen} onOpenChange={setLibraryOpen}
                filterType={libraryTargetId ? (() => {
                    const block = contentItems.find(i => i.id === libraryTargetId?.split(':')[0]);
                    return block?.type === 'pdf' ? 'document' : block?.type === 'ppt' ? 'document' : block?.type as 'video' | 'image' | 'document' | undefined;
                })() : undefined}
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

            {lessonMode === 'quiz' && editingLesson?.id && (
                <EntityLibraryPicker
                    open={importOpen} onOpenChange={setImportOpen} entityType="quiz"
                    onSelect={async (sourceId) => {
                        try { await cloneQuizAction(sourceId, editingLesson.id!, editingLesson.course_id!); toast.success('Quiz imported!'); onSave(); }
                        catch (err: any) { toast.error(`Import failed: ${err.message}`); }
                        setImportOpen(false);
                    }}
                />
            )}
        </>
    );
}
