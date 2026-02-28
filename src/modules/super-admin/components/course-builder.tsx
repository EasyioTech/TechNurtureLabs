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
import { fetchCourseLessons, saveLessonOrderAdmin } from '@/modules/super-admin/actions';
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
      try {
        const data = await fetchCourseLessons(courseId);
        if (data) setLessons(data as any);
      } catch (e) {
        console.error(e);
      }
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

    try {
      await saveLessonOrderAdmin(updates);
      toast.success('Order saved successfully');
    } catch (error) {
      toast.error('Failed to save order');
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
