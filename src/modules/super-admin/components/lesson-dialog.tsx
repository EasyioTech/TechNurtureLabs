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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lesson } from '../types';

interface LessonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingLesson: Partial<Lesson> | null;
    setEditingLesson: (lesson: Partial<Lesson> | null) => void;
    onSave: () => void;
}

export function LessonDialog({
    open,
    onOpenChange,
    editingLesson,
    setEditingLesson,
    onSave
}: LessonDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl border-stone-200">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {editingLesson?.id ? 'Edit Lesson' : 'Add New Lesson'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="l-title">Lesson Title</Label>
                        <Input
                            id="l-title"
                            placeholder="e.g. Introduction to Variables"
                            value={editingLesson?.title || ''}
                            onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                            className="rounded-xl"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Content Type</Label>
                            <Select
                                value={editingLesson?.content_type || 'video'}
                                onValueChange={(val) => setEditingLesson({ ...editingLesson, content_type: val })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="reading">Reading</SelectItem>
                                    <SelectItem value="quiz">Interactive Quiz</SelectItem>
                                    <SelectItem value="project">Project Work</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="xp">XP Reward</Label>
                            <Input
                                id="xp"
                                type="number"
                                value={editingLesson?.xp_reward || 0}
                                onChange={(e) => setEditingLesson({ ...editingLesson, xp_reward: parseInt(e.target.value) })}
                                className="rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="url">Content URL / Link</Label>
                        <Input
                            id="url"
                            placeholder="https://youtube.com/..."
                            value={editingLesson?.content_url || ''}
                            onChange={(e) => setEditingLesson({ ...editingLesson, content_url: e.target.value })}
                            className="rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="duration">Estimated Duration (mins)</Label>
                        <Input
                            id="duration"
                            type="number"
                            value={editingLesson?.duration || 0}
                            onChange={(e) => setEditingLesson({ ...editingLesson, duration: parseInt(e.target.value) })}
                            className="rounded-xl"
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
                        Save Lesson
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
