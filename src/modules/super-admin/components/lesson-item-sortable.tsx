'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Play, MonitorPlay, FileText, HelpCircle, Edit, Trash2, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lesson } from '../types';
import { useAdminTheme, t } from '../theme-context';

interface SortableLessonItemProps {
    lesson: Lesson;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
}

const CONTENT_TYPES = [
    { id: 'video', label: 'Video', icon: Play },
    { id: 'ppt', label: 'Slides', icon: MonitorPlay },
    { id: 'pdf', label: 'Document', icon: FileText },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
];

export function SortableLessonItem({ lesson, index, onEdit, onDelete }: SortableLessonItemProps) {
    const { isDark, accent } = useAdminTheme();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
    };

    const typeConfig = CONTENT_TYPES.find(t => t.id === lesson.content_type) || CONTENT_TYPES[0];
    const Icon = typeConfig.icon;

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 group
                ${isDragging ? (isDark ? `bg-white/[0.08] border-${accent.name}-400/50` : `bg-slate-100 border-${accent.name}-400/30`) : (t.card(isDark) + ' ' + t.cardHover(isDark))}`}>

                <div {...listeners} className={`cursor-grab active:cursor-grabbing p-1 rounded-lg transition-colors
                    ${isDark ? `text-slate-600 ${accent.hoverText} hover:bg-white/[0.05]` : 'text-slate-300 hover:text-slate-900 hover:bg-slate-100'}`}>
                    <GripVertical size={20} />
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-[1000] flex-shrink-0 shadow-inner
                    ${isDark ? 'bg-white/[0.05] text-white/40' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                    {String(index + 1).padStart(2, '0')}
                </div>

                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-transform shadow-lg shadow-black/5
                    ${isDark ? `${accent.softDark.split(' ').slice(0, 2).join(' ')}` : 'bg-slate-900 text-white'}`}>
                    <Icon size={18} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className={`font-black text-sm tracking-tight truncate ${t.textPrimary(isDark)}`}>{lesson.title}</p>
                        <Badge className={`text-[8px] font-black px-1.5 py-0 rounded-md ${lesson.is_published ?? true ? t.live(isDark) : t.draft(isDark)}`}>
                            {lesson.is_published ?? true ? 'LIVE' : 'DRAFT'}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                        <Badge className={`text-[9px] font-black px-1.5 h-4 tracking-tighter ${isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                            {typeConfig.label.toUpperCase()}
                        </Badge>
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${t.textMuted(isDark)}`}>
                            <Clock size={10} />{lesson.duration || lesson.duration_minutes || 0}m
                        </span>
                        <span className={`text-[10px] font-black flex items-center gap-1 ${isDark ? 'text-violet-400/80' : 'text-violet-600/80'}`}>
                            <Zap size={10} fill="currentColor" />{lesson.xp_reward} XP
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className={`w-9 h-9 rounded-full opacity-0 group-hover:opacity-100 transition-all ${isDark ? `text-slate-600 ${accent.hoverText} hover:bg-white/[0.06]` : 'text-slate-300 hover:text-slate-900 hover:bg-slate-100'}`} onClick={onEdit}>
                        <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className={`w-9 h-9 rounded-full opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'text-slate-600 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-300 hover:text-rose-600 hover:bg-rose-100'}`} onClick={onDelete}>
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
