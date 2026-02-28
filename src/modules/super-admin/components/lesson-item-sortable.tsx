'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Video, Youtube, Presentation, ListChecks, FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Lesson {
    id: string;
    title: string;
    content_type: string;
    duration: number;
    xp_reward: number;
}

interface SortableLessonItemProps {
    lesson: Lesson;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
}

export function SortableLessonItem({ lesson, index, onEdit, onDelete }: SortableLessonItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    const Icon = lesson.content_type === 'video' ? Video :
        lesson.content_type === 'youtube' ? Youtube :
            lesson.content_type === 'ppt' ? Presentation :
                lesson.content_type === 'mcq' ? ListChecks :
                    FileText;

    const iconBg = lesson.content_type === 'video' ? 'bg-blue-100 text-blue-600' :
        lesson.content_type === 'youtube' ? 'bg-red-100 text-red-600' :
            lesson.content_type === 'ppt' ? 'bg-amber-100 text-amber-600' :
                lesson.content_type === 'mcq' ? 'bg-orange-100 text-orange-600' :
                    'bg-purple-100 text-purple-600';

    const typeLabel = lesson.content_type === 'youtube' ? 'YouTube' :
        lesson.content_type === 'ppt' ? 'Slides' :
            lesson.content_type.toUpperCase();

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition-colors flex items-center gap-4">
                <div {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
                    <GripVertical size={20} />
                </div>

                <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
                    {index + 1}
                </div>

                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                    <Icon size={20} />
                </div>

                <div className="flex-1">
                    <p className="font-semibold text-slate-800">{lesson.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{typeLabel}</span>
                        <span>•</span>
                        <span>{lesson.duration} min</span>
                        <span>•</span>
                        <span className="text-amber-600">{lesson.xp_reward} XP</span>
                    </div>
                </div>

                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-slate-700" onClick={onEdit}>
                        <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-red-500" onClick={onDelete}>
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
