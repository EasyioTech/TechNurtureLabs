'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { supabase } from '@/lib/supabase';
import { LessonItem } from './lesson-item';
import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

type Lesson = {
  id: string;
  title: string;
  sequence_index: number;
  content_type: string;
};

export function CourseBuilder({ courseId }: { courseId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function fetchLessons() {
      const { data } = await supabase
        .from('lessons')
        .select('id, title, sequence_index, content_type')
        .eq('course_id', courseId)
        .order('sequence_index', { ascending: true });
      
      if (data) setLessons(data);
      setLoading(false);
    }
    fetchLessons();
  }, [courseId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLessons((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveOrder = async () => {
    const updates = lessons.map((lesson, index) => ({
      id: lesson.id,
      sequence_index: index,
    }));

    const { error } = await supabase.from('lessons').upsert(
      updates.map(u => ({ ...u, course_id: courseId, title: lessons.find(l => l.id === u.id)?.title || '' }))
    );

    if (error) {
      toast.error('Failed to save order');
    } else {
      toast.success('Order saved successfully');
    }
  };

  if (loading) return <div>Loading Builder...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Curriculum</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Lesson
          </Button>
          <Button size="sm" onClick={saveOrder}>
            <Save className="w-4 h-4 mr-2" /> Save Order
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={lessons.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <LessonItem key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
