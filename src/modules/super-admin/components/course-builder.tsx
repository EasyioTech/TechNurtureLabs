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
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { fetchCourseLessons, saveLessonOrderAdmin, cloneLessonAction } from '@/modules/super-admin/actions';
import { LessonItem } from './lesson-item';
import { Button } from '@/components/ui/button';
import { Plus, Save, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { EntityLibraryPicker } from './entity-library-picker';
import { useAdminTheme } from '../theme-context';

type Lesson = {
  id: string;
  title: string;
  sequence_index: number;
  content_type: string;
};

export function CourseBuilder({ courseId }: { courseId: string }) {
  const { isDark, accent } = useAdminTheme();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const refreshLessons = async () => {
    setLoading(true);
    try {
      const data = await fetchCourseLessons(courseId);
      if (data) setLessons(data as any);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load curriculum');
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshLessons();
  }, [courseId]);

  const handleImportLesson = async (lessonId: string) => {
    try {
      await cloneLessonAction(lessonId, courseId);
      toast.success('Chapter imported successfully');
      refreshLessons();
    } catch (error) {
      console.error(error);
      toast.error('Failed to import chapter');
    }
  };

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
        <h2 className="text-2xl font-[1000] tracking-tight">Course Curriculum</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="rounded-full h-9 border-2 font-bold px-4">
            <FileDown className="w-4 h-4 mr-2" /> Import Existing
          </Button>
          <Button variant="outline" size="sm" className="rounded-full h-9 border-2 font-bold px-4">
            <Plus className="w-4 h-4 mr-2" /> Add Lesson
          </Button>
          <Button size="sm" onClick={saveOrder} className={`rounded-full h-9 font-black px-5 ${accent.bg} text-slate-900 border-0 ${accent.bgHover}`}>
            <Save className="w-4 h-4 mr-2" /> Save Order
          </Button>
        </div>
      </div>

      <EntityLibraryPicker
        open={importOpen}
        onOpenChange={setImportOpen}
        type="lesson"
        onSelect={handleImportLesson}
      />

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
