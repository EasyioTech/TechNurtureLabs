'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Play, FileText, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

type Lesson = {
  id: string;
  title: string;
  content_type: string;
};

export function LessonItem({ lesson }: { lesson: Lesson }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = lesson.content_type === 'video' ? Play : 
               lesson.content_type === 'mcq' ? HelpCircle : 
               FileText;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="p-4 flex items-center gap-4 hover:border-primary/50 transition-colors shadow-sm bg-white dark:bg-zinc-900">
        <div {...listeners} className="cursor-grab active:cursor-grabbing text-zinc-400">
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          lesson.content_type === 'video' ? 'bg-blue-100 text-blue-600' :
          lesson.content_type === 'mcq' ? 'bg-orange-100 text-orange-600' :
          'bg-purple-100 text-purple-600'
        }`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{lesson.title}</h4>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{lesson.content_type}</p>
        </div>
      </Card>
    </div>
  );
}
