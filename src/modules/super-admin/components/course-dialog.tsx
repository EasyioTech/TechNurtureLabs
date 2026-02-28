'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course } from '../types';

interface CourseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCourse: Partial<Course> | null;
    setEditingCourse: (course: Partial<Course> | null) => void;
    onSave: () => void;
}

export function CourseDialog({
    open,
    onOpenChange,
    editingCourse,
    setEditingCourse,
    onSave
}: CourseDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl border-stone-200">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {editingCourse?.id ? 'Edit Course' : 'Create New Course'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Course Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Master React in 30 Days"
                            value={editingCourse?.title || ''}
                            onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                            className="rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what students will learn..."
                            value={editingCourse?.description || ''}
                            onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                            className="rounded-xl min-h-[100px]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="grade">Grade Level</Label>
                            <Select
                                value={editingCourse?.all_grades ? 'all' : (editingCourse?.grade?.toString() || '1')}
                                onValueChange={(val) => setEditingCourse({
                                    ...editingCourse,
                                    all_grades: val === 'all',
                                    grade: val === 'all' ? null : parseInt(val)
                                })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select grade" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="all">All Grades</SelectItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                        <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="thumbnail">Thumbnail URL</Label>
                            <Input
                                id="thumbnail"
                                placeholder="https://..."
                                value={editingCourse?.thumbnail || ''}
                                onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Published</Label>
                            <p className="text-xs text-slate-500">Make this course visible to students</p>
                        </div>
                        <Switch
                            checked={editingCourse?.published || false}
                            onCheckedChange={(val) => setEditingCourse({ ...editingCourse, published: val })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        className="rounded-xl"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-8"
                        onClick={onSave}
                    >
                        Save Course
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
