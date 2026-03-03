'use client';

import React from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Lesson } from '../types';
import { useAdminTheme, t } from '../theme-context';
import { BookOpen, Play, FileText, MonitorPlay, HelpCircle, ExternalLink, Zap, Clock, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { QuizEditor } from './quiz-editor';

interface LessonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingLesson: Partial<Lesson> | null;
    setEditingLesson: (lesson: Partial<Lesson> | null) => void;
    onSave: () => void;
}

const CONTENT_TYPES = [
    { id: 'video', label: 'Video', icon: Play, desc: 'MP4, YouTube, Vimeo' },
    { id: 'ppt', label: 'Presentation', icon: MonitorPlay, desc: 'Slides & Decks' },
    { id: 'pdf', label: 'Document', icon: FileText, desc: 'PDF, Word, Text' },
    { id: 'quiz', label: 'Assessment', icon: HelpCircle, desc: 'Interactive Quiz' },
];

export function LessonDialog({
    open, onOpenChange, editingLesson, setEditingLesson, onSave
}: LessonDialogProps) {
    const { isDark } = useAdminTheme();
    const isEditing = !!editingLesson?.id;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[600px] rounded-[24px] border-0 shadow-2xl p-0 overflow-hidden ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>

                {/* Header Area */}
                <div className={`px-6 py-6 border-b ${t.border(isDark)}`}>
                    <DialogHeader className="mb-0">
                        <DialogTitle className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-lime-400 text-slate-900' : 'bg-slate-900 text-white'}`}>
                                <BookOpen size={20} />
                            </div>
                            <div className="text-left">
                                <h2 className={`text-xl font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                                    {isEditing ? 'Update Lesson' : 'New Lesson'}
                                </h2>
                                <p className={`text-[11px] font-bold uppercase tracking-widest mt-0.5 ${t.textMuted(isDark)}`}>
                                    {isEditing ? 'Modify lesson details' : 'Add a new lesson'}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                {/* Form Content */}
                <div className={`px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>

                    <div className="space-y-2">
                        <Label htmlFor="lesson-title" className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Lesson Title *</Label>
                        <Input
                            id="lesson-title"
                            placeholder="e.g. Introduction to Neural Networks"
                            value={editingLesson?.title || ''}
                            onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                            className={`rounded-full h-12 px-5 shadow-inner text-sm font-bold border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] text-white border-white/5' : 'bg-slate-50 border-slate-200'}`}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Content Type</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {CONTENT_TYPES.map((type) => {
                                const isSelected = editingLesson?.content_type === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setEditingLesson({ ...editingLesson, content_type: type.id })}
                                        className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer border-2 transition-all text-left
                                            ${isSelected
                                                ? (isDark ? 'bg-lime-400/10 border-lime-400/50 shadow-[0_0_15px_rgba(163,230,53,0.15)]' : 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/10')
                                                : (isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300')}`}
                                    >
                                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                                            ${isSelected ? (isDark ? 'bg-lime-400 text-slate-900' : 'bg-white text-slate-900') : (isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500')}`}>
                                            <type.icon size={16} />
                                        </div>
                                        <div>
                                            <p className={`text-[13px] font-black tracking-tight ${isSelected ? (isDark ? 'text-lime-400' : 'text-white') : t.textPrimary(isDark)}`}>{type.label}</p>
                                            <p className={`text-[10px] font-bold mt-0.5 ${isSelected ? (isDark ? 'text-white/60' : 'text-white/70') : t.textMuted(isDark)}`}>{type.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lesson-desc" className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Description</Label>
                        <Textarea
                            id="lesson-desc"
                            placeholder="Briefly describe the key takeaways..."
                            value={editingLesson?.description || ''}
                            onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                            className={`rounded-2xl min-h-[80px] p-4 shadow-inner text-sm font-medium border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 resize-none ${isDark ? 'bg-white/[0.04] text-white border-white/5' : 'bg-slate-50 border-slate-200'}`}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="content-url" className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Content Source</Label>
                            {editingLesson?.content_url && (
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => window.open(editingLesson.content_url, '_blank')}
                                        className={`text-[10px] font-bold flex items-center gap-1 hover:underline ${isDark ? 'text-lime-400' : 'text-slate-500'}`}
                                    >
                                        Verify <ExternalLink size={10} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* manual URL input */}
                            <Input
                                id="content-url"
                                placeholder="Paste source URL or upload file..."
                                value={editingLesson?.content_url || ''}
                                onChange={(e) => setEditingLesson({ ...editingLesson, content_url: e.target.value })}
                                className={`rounded-full h-12 px-5 shadow-inner text-sm font-medium border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] text-white border-white/5' : 'bg-slate-50 border-slate-200'}`}
                            />

                            {/* file upload button (hidden for quiz) */}
                            {editingLesson?.content_type !== 'quiz' && (
                                <div className="relative group/content-upload">
                                    <input
                                        type="file"
                                        id="lesson-file-upload"
                                        className="hidden"
                                        accept={
                                            editingLesson?.content_type === 'video' ? 'video/*' :
                                                editingLesson?.content_type === 'pdf' ? '.pdf,.doc,.docx,.txt' :
                                                    editingLesson?.content_type === 'ppt' ? '.ppt,.pptx,.key' : '*'
                                        }
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const formData = new FormData();
                                            formData.append('file', file);

                                            const loadingId = toast.loading(`Uploading ${editingLesson?.content_type || 'file'}...`);
                                            try {
                                                const res = await fetch('/api/upload', {
                                                    method: 'POST',
                                                    body: formData,
                                                });
                                                const data = await res.json();
                                                if (data.url) {
                                                    setEditingLesson({ ...editingLesson, content_url: data.url });
                                                    toast.success('File uploaded successfully', { id: loadingId });
                                                } else {
                                                    throw new Error(data.error || 'Upload failed');
                                                }
                                            } catch (error) {
                                                console.error('Upload error:', error);
                                                toast.error('Failed to upload file', { id: loadingId });
                                            }
                                        }}
                                    />

                                    {editingLesson?.content_url && editingLesson.content_url.includes('/uploads/') ? (
                                        <div className={`relative h-12 w-full rounded-full flex items-center px-5 border-2 transition-all ${isDark ? 'border-lime-400/30 bg-lime-400/5' : 'border-slate-300 bg-slate-50'}`}>
                                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                                                    <FileText size={14} className={isDark ? 'text-lime-400' : 'text-slate-900'} />
                                                </div>
                                                <span className={`text-[11px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {editingLesson.content_url.split('/').pop()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 rounded-full hover:bg-red-500/20 hover:text-red-500"
                                                    onClick={() => setEditingLesson({ ...editingLesson, content_url: '' })}
                                                >
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={() => document.getElementById('lesson-file-upload')?.click()}
                                            className={`w-full h-12 rounded-full border-2 border-dashed flex items-center justify-center gap-2.5 font-bold transition-all hover:border-lime-400/50 hover:bg-lime-400/5 ${isDark ? 'border-white/10 text-slate-300 hover:text-lime-400 bg-transparent' : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-transparent'}`}
                                        >
                                            <Upload size={16} />
                                            UPLOAD {editingLesson?.content_type?.toUpperCase() || 'FILE'}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>XP Reward</Label>
                            <div className="relative">
                                <Zap size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-violet-400' : 'text-violet-500'}`} />
                                <Input
                                    type="number"
                                    min="0"
                                    value={editingLesson?.xp_reward || 0}
                                    onChange={(e) => setEditingLesson({ ...editingLesson, xp_reward: Number(e.target.value) })}
                                    className={`rounded-full h-12 pl-10 pr-5 shadow-inner text-sm font-bold border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] text-violet-400 border-white/5' : 'bg-slate-50 text-violet-600 border-slate-200'}`}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Duration (Mins)</Label>
                            <div className="relative">
                                <Clock size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-sky-400' : 'text-sky-500'}`} />
                                <Input
                                    type="number"
                                    min="1"
                                    value={editingLesson?.duration || editingLesson?.duration_minutes || 0}
                                    onChange={(e) => setEditingLesson({ ...editingLesson, duration: Number(e.target.value), duration_minutes: Number(e.target.value) })}
                                    className={`rounded-full h-12 pl-10 pr-5 shadow-inner text-sm font-bold border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] text-sky-400 border-white/5' : 'bg-slate-50 text-sky-600 border-slate-200'}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-colors ${(editingLesson?.is_published ?? true) ? (isDark ? 'border-lime-400/30 bg-lime-400/5' : 'border-slate-300 bg-emerald-50') : t.border(isDark)}`}>
                        <div className="space-y-1">
                            <Label className={`text-sm font-black ${((editingLesson?.is_published ?? true) && isDark) ? 'text-lime-400' : t.textPrimary(isDark)}`}>PUBLISHED STATUS</Label>
                            <p className={`text-[11px] font-bold ${t.textMuted(isDark)}`}>Make this lesson active and visible.</p>
                        </div>
                        <Switch
                            checked={editingLesson?.is_published ?? true}
                            onCheckedChange={(val) => setEditingLesson({ ...editingLesson, is_published: val })}
                            className="data-[state=checked]:bg-lime-400"
                        />
                    </div>

                    {/* Integrated Quiz Engine */}
                    {editingLesson?.content_type === 'quiz' && editingLesson.id && editingLesson.course_id && (
                        <div className="mt-8 space-y-4 pt-4 border-t-2 border-dashed border-white/5">
                            <QuizEditor
                                lessonId={editingLesson.id}
                                courseId={editingLesson.course_id}
                                isDark={isDark}
                            />
                        </div>
                    )}
                </div>

                {/* Footer Action Area */}
                <div className={`px-6 py-5 border-t flex justify-end gap-3 ${isDark ? 'border-white/10 bg-[#0f1219]' : 'border-slate-100 bg-slate-50'}`}>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}
                        className={`rounded-full h-11 px-6 font-bold text-sm bg-transparent ${isDark ? 'hover:bg-white/10 text-white hover:text-white' : 'hover:bg-slate-200 text-slate-700'}`}>
                        Cancel
                    </Button>
                    <Button onClick={onSave} disabled={!editingLesson?.title?.trim()}
                        className={`rounded-full h-11 px-8 font-black text-sm shadow-xl transition-all ${!editingLesson?.title?.trim() ? 'opacity-50 cursor-not-allowed' : ''} ${t.btnPrimary(isDark)} ${isDark ? 'shadow-lime-400/20 text-slate-900 bg-lime-400 hover:bg-lime-500' : 'shadow-slate-900/20 bg-slate-900 text-white hover:bg-slate-800'}`}>
                        {isEditing ? 'Save Changes' : 'Create Lesson'}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
