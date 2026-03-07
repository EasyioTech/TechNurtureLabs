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
import { Badge } from '@/components/ui/badge';
import { Course } from '../types';
import { useAdminTheme, t } from '../theme-context';
import { BookOpen, ExternalLink, Zap, Upload, ImageIcon, Loader2, X, Eye, Library } from 'lucide-react';
import { toast } from 'sonner';
import { MediaLibraryPicker } from './media-library-picker';

interface CourseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCourse: Partial<Course> | null;
    setEditingCourse: (course: Partial<Course> | null) => void;
    onSave: () => void;
    classes: any[];
    courseClassMappings: any[];
}

export function CourseDialog({
    open, onOpenChange, editingCourse, setEditingCourse, onSave, classes, courseClassMappings
}: CourseDialogProps) {
    const { isDark, accent } = useAdminTheme();
    const [showFullPreview, setShowFullPreview] = React.useState(false);
    const [libraryOpen, setLibraryOpen] = React.useState(false);
    const isEditing = !!editingCourse?.id;

    // Local state for selected classes to avoid immediate parent updates
    const [selectedClassIds, setSelectedClassIds] = React.useState<string[]>([]);

    React.useEffect(() => {
        if (open) {
            if (editingCourse?.id) {
                const currentMappings = courseClassMappings
                    .filter(m => m.course_id === editingCourse.id)
                    .map(m => m.class_id);
                setSelectedClassIds(currentMappings);
            } else {
                setSelectedClassIds([]);
            }
        }
    }, [open]); // Only run when dialog opens

    const handleToggleClass = (classId: string) => {
        const newIds = selectedClassIds.includes(classId)
            ? selectedClassIds.filter(id => id !== classId)
            : [...selectedClassIds, classId];
        setSelectedClassIds(newIds);
        setEditingCourse({ ...editingCourse, classIds: newIds } as any);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={`sm:max-w-[500px] rounded-[24px] border-0 shadow-2xl p-0 overflow-hidden ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>

                    {/* Header Area */}
                    <div className={`px-6 py-6 border-b ${t.border(isDark)}`}>
                        <DialogHeader className="mb-0">
                            <DialogTitle className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accent.bg} text-slate-900`}>
                                    <BookOpen size={20} />
                                </div>
                                <div className="text-left">
                                    <h2 className={`text-xl font-[1000] tracking-tight ${t.textPrimary(isDark)}`}>
                                        {isEditing ? 'Update Course' : 'New Course'}
                                    </h2>
                                    <p className={`text-[11px] font-bold uppercase tracking-widest mt-0.5 ${t.textMuted(isDark)}`}>
                                        {isEditing ? 'Modify course details' : 'Create a new course'}
                                    </p>
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        {/* Context Badges for Existing Courses */}
                        {isEditing && (
                            <div className="flex gap-2 mt-5">
                                <Badge className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                                    <BookOpen size={10} className="mr-1.5 inline" />
                                    {editingCourse?.lesson_count || editingCourse?.total_lessons || 0} MODULES
                                </Badge>
                                <Badge className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${isDark ? 'bg-violet-400/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                                    <Zap size={10} className="mr-1.5 inline" />
                                    {editingCourse?.total_xp || 0} TOTAL XP
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Form Content */}
                    <div className={`px-6 py-6 space-y-5 max-h-[60vh] overflow-y-auto ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>
                        <div className="space-y-2">
                            <Label htmlFor="title" className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Course Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Advanced Robotics Operations"
                                value={editingCourse?.title || ''}
                                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                                className={`rounded-full h-12 px-5 shadow-inner text-sm font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] text-white border-white/5 shadow-inner' : 'bg-slate-50 border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Define operational parameters and learning objectives..."
                                value={editingCourse?.description || ''}
                                onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                                className={`rounded-2xl min-h-[100px] p-4 shadow-inner text-sm font-medium border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 resize-none ${isDark ? 'bg-white/[0.08] text-white border-white/5' : 'bg-slate-50 border-slate-200'}`}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="thumbnail" className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Thumbnail Source</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Manual URL Input */}
                                <div className="relative group">
                                    <Input
                                        id="thumbnail"
                                        placeholder="Paste Image URL..."
                                        value={editingCourse?.thumbnail || ''}
                                        onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                                        className={`rounded-full h-12 pl-11 pr-5 shadow-inner text-sm font-bold border-2 transition-all focus-visible:ring-4 focus-visible:ring-${accent.name}-400/20 focus-visible:border-${accent.name}-400/30 ${isDark ? 'bg-white/[0.08] text-white border-white/5 shadow-inner' : 'bg-slate-50 border-slate-200'}`}
                                    />
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                                        <ExternalLink size={16} />
                                    </div>
                                </div>

                                {/* Upload Button with Integrated Preview */}
                                <div className="relative group/thumb">
                                    <input
                                        type="file"
                                        id="thumbnail-upload"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const formData = new FormData();
                                            formData.append('file', file);
                                            if (editingCourse?.id) {
                                                formData.append('contextType', 'course');
                                                formData.append('contextId', editingCourse.id);
                                            }

                                            const loadingId = toast.loading('Uploading thumbnail...');
                                            try {
                                                const res = await fetch('/api/upload', {
                                                    method: 'POST',
                                                    body: formData,
                                                });
                                                const data = await res.json();
                                                if (data.url) {
                                                    setEditingCourse({ ...editingCourse, thumbnail: data.url });
                                                    toast.success('Thumbnail uploaded successfully', { id: loadingId });
                                                } else {
                                                    throw new Error(data.error || 'Upload failed');
                                                }
                                            } catch (error) {
                                                console.error('Upload error:', error);
                                                toast.error('Failed to upload thumbnail', { id: loadingId });
                                            }
                                        }}
                                    />

                                    {editingCourse?.thumbnail ? (
                                        <div className={`relative h-12 w-full rounded-full overflow-hidden border-2 transition-all ${isDark ? `border-${accent.name}-400/30` : `border-${accent.name}-400/20`}`}>
                                            <img
                                                src={editingCourse.thumbnail}
                                                alt="Thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg backdrop-blur-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowFullPreview(true);
                                                    }}
                                                >
                                                    <Eye size={16} strokeWidth={2.5} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="w-9 h-9 rounded-full shadow-lg"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingCourse({ ...editingCourse, thumbnail: '' });
                                                    }}
                                                >
                                                    <X size={16} strokeWidth={2.5} />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={() => document.getElementById('thumbnail-upload')?.click()}
                                            className={`w-full h-12 rounded-full border-2 border-dashed flex items-center justify-center gap-2.5 font-bold transition-all hover:border-${accent.name}-400/50 hover:bg-${accent.name}-400/5 ${isDark ? `border-white/10 text-slate-300 hover:${accent.text} bg-transparent` : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-transparent'}`}
                                        >
                                            <Upload size={16} />
                                            UPLOAD IMAGE
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Browse Library for Thumbnail */}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setLibraryOpen(true)}
                                className={`w-full h-11 rounded-full border-2 flex items-center justify-center gap-2 font-bold text-[11px] uppercase tracking-wider transition-all bg-transparent
                                ${isDark
                                        ? `border-white/10 text-slate-400 hover:border-${accent.name}-400/30 hover:bg-${accent.name}-400/5 hover:${accent.text}`
                                        : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}
                            >
                                <Library size={15} /> Browse Image Library
                            </Button>
                        </div>

                        {/* Class Assignment Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Target Classes</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const allIds = classes.map(g => g.id);
                                        const newIds = selectedClassIds.length === allIds.length ? [] : allIds;
                                        setSelectedClassIds(newIds);
                                        setEditingCourse({ ...editingCourse, classIds: newIds } as any);
                                    }}
                                    className={`h-7 px-3 rounded-full text-[10px] font-black border-2 ${t.btnOutline(isDark)}`}
                                >
                                    {selectedClassIds.length === classes.length ? 'DESELECT ALL' : 'SELECT ALL'}
                                </Button>
                            </div>
                            <div className={`p-4 rounded-[24px] border-2 flex flex-wrap gap-2 ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                                {classes.map(cls => {
                                    const isSelected = selectedClassIds.includes(cls.id);
                                    return (
                                        <button
                                            key={cls.id}
                                            type="button"
                                            onClick={() => handleToggleClass(cls.id)}
                                            className={`px-4 py-2 rounded-full text-[11px] font-black tracking-tight transition-all border-2
                                            ${isSelected
                                                    ? (isDark ? `${accent.bg} text-slate-900 border-white shadow-lg` : `${accent.bg} text-slate-900 border-slate-900 shadow-lg`)
                                                    : (isDark ? 'bg-white/[0.05] text-slate-400 border-white/10 hover:bg-white/10 hover:text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')}`}
                                        >
                                            Class {cls.name}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className={`text-[10px] font-bold ${t.textMuted(isDark)} px-1`}>
                                This course will be visible to students in the selected classes. Use 'SELECT ALL' for courses applicable across the school.
                            </p>
                        </div>

                        <div className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-colors ${editingCourse?.published ? (isDark ? `border-${accent.name}-400/30 ${accent.softDark.split(' ')[0].replace('/10', '/5')}` : `border-${accent.name}-300/50 ${accent.softLight.split(' ')[0]}`) : t.border(isDark)}`}>
                            <div className="space-y-1">
                                <Label className={`text-sm font-black ${editingCourse?.published && isDark ? accent.text : t.textPrimary(isDark)}`}>PUBLISHED STATUS</Label>
                                <p className={`text-[11px] font-bold ${t.textMuted(isDark)}`}>Make this course visible to students.</p>
                            </div>
                            <Switch
                                checked={editingCourse?.published || false}
                                onCheckedChange={(val) => setEditingCourse({ ...editingCourse, published: val })}
                                className={`data-[state=checked]:${accent.bg}`}
                            />
                        </div>
                    </div>

                    {/* Footer Action Area */}
                    <div className={`px-6 py-5 border-t flex justify-end gap-3 ${isDark ? 'border-white/10 bg-[#0f1219]' : 'border-slate-100 bg-slate-50'}`}>
                        <Button variant="ghost" onClick={() => onOpenChange(false)}
                            className={`rounded-full h-11 px-6 font-bold text-sm bg-transparent ${isDark ? 'hover:bg-white/10 text-white hover:text-white' : 'hover:bg-slate-200 text-slate-700'}`}>
                            Cancel
                        </Button>
                        <Button onClick={onSave} disabled={!editingCourse?.title?.trim()}
                            className={`rounded-full h-11 px-8 font-black text-sm shadow-xl transition-all border-0 ${!editingCourse?.title?.trim() ? 'opacity-50 cursor-not-allowed' : ''} ${t.btnPrimary(isDark, accent)}`}
                            style={t.glowStyle(isDark, accent)}>
                            {isEditing ? 'Save Changes' : 'Create Course'}
                        </Button>
                    </div>

                    {/* Full Image Preview Overlay */}
                    {showFullPreview && editingCourse?.thumbnail && (
                        <div
                            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setShowFullPreview(false)}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-6 right-6 text-white/50 hover:text-white hover:bg-white/10 rounded-full w-12 h-12"
                                onClick={() => setShowFullPreview(false)}
                            >
                                <X size={32} />
                            </Button>
                            <div className="relative max-w-full max-h-full flex items-center justify-center">
                                <img
                                    src={editingCourse.thumbnail}
                                    alt="Full Preview"
                                    className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300"
                                />
                            </div>
                        </div>
                    )}

                </DialogContent>
            </Dialog>

            <MediaLibraryPicker
                open={libraryOpen}
                onOpenChange={setLibraryOpen}
                filterType="image"
                currentUrl={editingCourse?.thumbnail ?? undefined}
                onSelect={(url) => setEditingCourse({ ...editingCourse, thumbnail: url })}
            />
        </>
    );
}
