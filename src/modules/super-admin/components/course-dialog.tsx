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
import { BookOpen, ExternalLink, Zap, Upload, ImageIcon, Loader2, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface CourseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCourse: Partial<Course> | null;
    setEditingCourse: (course: Partial<Course> | null) => void;
    onSave: () => void;
    grades: any[];
    courseGradeMappings: any[];
}

export function CourseDialog({
    open, onOpenChange, editingCourse, setEditingCourse, onSave, grades, courseGradeMappings
}: CourseDialogProps) {
    const { isDark } = useAdminTheme();
    const [showFullPreview, setShowFullPreview] = React.useState(false);
    const isEditing = !!editingCourse?.id;

    // Local state for selected grades to avoid immediate parent updates
    const [selectedGradeIds, setSelectedGradeIds] = React.useState<string[]>([]);

    React.useEffect(() => {
        if (open && editingCourse) {
            if (editingCourse.id) {
                const currentMappings = courseGradeMappings
                    .filter(m => m.course_id === editingCourse.id)
                    .map(m => m.grade_id);
                setSelectedGradeIds(currentMappings);
            } else {
                setSelectedGradeIds([]);
            }
        }
    }, [open, editingCourse, courseGradeMappings]);

    const handleToggleGrade = (gradeId: string) => {
        const newIds = selectedGradeIds.includes(gradeId)
            ? selectedGradeIds.filter(id => id !== gradeId)
            : [...selectedGradeIds, gradeId];
        setSelectedGradeIds(newIds);
        setEditingCourse({ ...editingCourse, gradeIds: newIds } as any);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[500px] rounded-[24px] border-0 shadow-2xl p-0 overflow-hidden ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>

                {/* Header Area */}
                <div className={`px-6 py-6 border-b ${t.border(isDark)}`}>
                    <DialogHeader className="mb-0">
                        <DialogTitle className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-lime-400 text-slate-900' : 'bg-slate-900 text-white'}`}>
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
                            className={`rounded-full h-12 px-5 shadow-inner text-sm font-bold border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] text-white border-white/5' : 'bg-slate-50 border-slate-200'}`}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Define operational parameters and learning objectives..."
                            value={editingCourse?.description || ''}
                            onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                            className={`rounded-2xl min-h-[100px] p-4 shadow-inner text-sm font-medium border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 resize-none ${isDark ? 'bg-white/[0.04] text-white border-white/5' : 'bg-slate-50 border-slate-200'}`}
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
                                    className={`rounded-full h-12 pl-11 pr-5 shadow-inner text-sm font-bold border-2 focus-visible:ring-lime-400/50 focus-visible:border-lime-400/50 ${isDark ? 'bg-white/[0.04] text-white border-white/5' : 'bg-slate-50 border-slate-200'}`}
                                />
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
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
                                    <div className={`relative h-12 w-full rounded-full overflow-hidden border-2 transition-all ${isDark ? 'border-lime-400/30' : 'border-slate-300'}`}>
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
                                        className={`w-full h-12 rounded-full border-2 border-dashed flex items-center justify-center gap-2.5 font-bold transition-all hover:border-lime-400/50 hover:bg-lime-400/5 ${isDark ? 'border-white/10 text-slate-300 hover:text-lime-400 bg-transparent' : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-transparent'}`}
                                    >
                                        <Upload size={16} />
                                        UPLOAD IMAGE
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Class Assignment Section */}
                    <div className="space-y-3">
                        <Label className={`text-xs font-black uppercase tracking-wider ${t.textSecondary(isDark)}`}>Assigned Classes / Grades</Label>
                        <div className={`p-4 rounded-[24px] border-2 flex flex-wrap gap-2 ${t.border(isDark)} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                            {grades.map(grade => {
                                const isSelected = selectedGradeIds.includes(grade.id);
                                return (
                                    <button
                                        key={grade.id}
                                        type="button"
                                        onClick={() => handleToggleGrade(grade.id)}
                                        className={`px-4 py-2 rounded-full text-[11px] font-black tracking-tight transition-all border-2
                                            ${isSelected
                                                ? (isDark ? 'bg-lime-400 text-slate-900 border-lime-400 shadow-lg shadow-lime-400/20' : 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10')
                                                : (isDark ? 'bg-transparent text-slate-400 border-white/10 hover:bg-white/5' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')}`}
                                    >
                                        {grade.name.toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>
                        <p className={`text-[10px] font-bold ${t.textMuted(isDark)} px-1`}>
                            This course will be automatically visible to all students in the selected classes.
                        </p>
                    </div>

                    <div className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-colors ${editingCourse?.published ? (isDark ? 'border-lime-400/30 bg-lime-400/5' : 'border-slate-300 bg-emerald-50') : t.border(isDark)}`}>
                        <div className="space-y-1">
                            <Label className={`text-sm font-black ${editingCourse?.published && isDark ? 'text-lime-400' : t.textPrimary(isDark)}`}>PUBLISHED STATUS</Label>
                            <p className={`text-[11px] font-bold ${t.textMuted(isDark)}`}>Make this course visible to students.</p>
                        </div>
                        <Switch
                            checked={editingCourse?.published || false}
                            onCheckedChange={(val) => setEditingCourse({ ...editingCourse, published: val })}
                            className="data-[state=checked]:bg-lime-400"
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
                        className={`rounded-full h-11 px-8 font-black text-sm shadow-xl transition-all border-0 ${!editingCourse?.title?.trim() ? 'opacity-50 cursor-not-allowed' : ''} ${t.btnPrimary(isDark)} ${isDark ? 'shadow-lime-400/20' : 'shadow-slate-900/20'}`}>
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
    );
}
