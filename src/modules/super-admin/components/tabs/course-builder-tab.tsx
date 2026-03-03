'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Edit, Trash2, BookOpen, Layers } from 'lucide-react';
import { SortableLessonItem } from '../lesson-item-sortable';
import { CourseDialog } from '../course-dialog';
import { LessonDialog } from '../lesson-dialog';
import { Course, Lesson } from '../../types';

interface CourseBuilderTabProps {
    courses: Course[];
    selectedCourse: Course | null;
    lessons: Lesson[];
    setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
    onSelectCourse: (course: Course) => void;
    onSaveCourse: () => void;
    onDeleteCourse: (id: string) => void;
    onSaveLesson: () => void;
    onDeleteLesson: (id: string) => void;
    onSaveLessonOrder: () => void;
    // Dialog state
    showCourseDialog: boolean;
    setShowCourseDialog: (v: boolean) => void;
    editingCourse: Partial<Course> | null;
    setEditingCourse: (c: Partial<Course> | null) => void;
    showLessonDialog: boolean;
    setShowLessonDialog: (v: boolean) => void;
    editingLesson: Partial<Lesson> | null;
    setEditingLesson: (l: Partial<Lesson> | null) => void;
}

export function CourseBuilderTab({
    courses, selectedCourse, lessons, setLessons,
    onSelectCourse, onSaveCourse, onDeleteCourse,
    onSaveLesson, onDeleteLesson, onSaveLessonOrder,
    showCourseDialog, setShowCourseDialog, editingCourse, setEditingCourse,
    showLessonDialog, setShowLessonDialog, editingLesson, setEditingLesson,
}: CourseBuilderTabProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLessons(items => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Course List */}
                <Card className="bg-white border-stone-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-slate-800 text-lg">Courses</CardTitle>
                            <Button
                                size="sm"
                                className="bg-sky-500 hover:bg-sky-600 text-white"
                                onClick={() => {
                                    setEditingCourse({ published: false });
                                    setShowCourseDialog(true);
                                }}
                            >
                                <Plus size={16} className="mr-1" />New
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                        {courses.map(course => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-3 rounded-xl cursor-pointer transition-all ${selectedCourse?.id === course.id
                                    ? 'bg-sky-50 border-2 border-sky-500'
                                    : 'bg-stone-50 hover:bg-stone-100 border-2 border-transparent'
                                    }`}
                                onClick={() => onSelectCourse(course)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                                        <BookOpen className="text-sky-600" size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 truncate">{course.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{course.lesson_count} lessons</span>
                                            <span>•</span>
                                            <span>{course.enrolled_count || 0} enrolled</span>
                                            <Badge className={course.published ? 'bg-emerald-100 text-emerald-600 border-0' : 'bg-stone-100 text-stone-500 border-0'}>
                                                {course.published ? 'Published' : 'Draft'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-slate-700"
                                            onClick={(e) => { e.stopPropagation(); setEditingCourse(course); setShowCourseDialog(true); }}>
                                            <Edit size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-red-500"
                                            onClick={(e) => { e.stopPropagation(); onDeleteCourse(course.id); }}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </CardContent>
                </Card>

                {/* Lesson Panel */}
                <Card className="lg:col-span-2 bg-white border-stone-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-slate-800 text-lg">
                                    {selectedCourse ? selectedCourse.title : 'Select a Course'}
                                </CardTitle>
                                {selectedCourse && (
                                    <CardDescription className="text-slate-500">Drag to reorder lessons</CardDescription>
                                )}
                            </div>
                            {selectedCourse && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="border-stone-200 text-slate-600 hover:bg-stone-50"
                                        onClick={() => { setEditingLesson({ content_type: 'video', xp_reward: 100, duration: 10 }); setShowLessonDialog(true); }}>
                                        <Plus size={16} className="mr-1" />Add Lesson
                                    </Button>
                                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={onSaveLessonOrder}>
                                        <Save size={16} className="mr-1" />Save Order
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedCourse ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {lessons.map((lesson, index) => (
                                            <SortableLessonItem
                                                key={lesson.id}
                                                lesson={lesson}
                                                index={index}
                                                onEdit={() => { setEditingLesson(lesson); setShowLessonDialog(true); }}
                                                onDelete={() => onDeleteLesson(lesson.id)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        ) : (
                            <div className="h-[400px] flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <Layers size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>Select a course to manage its curriculum</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <CourseDialog
                open={showCourseDialog}
                onOpenChange={setShowCourseDialog}
                editingCourse={editingCourse}
                setEditingCourse={setEditingCourse}
                onSave={onSaveCourse}
            />
            <LessonDialog
                open={showLessonDialog}
                onOpenChange={setShowLessonDialog}
                editingLesson={editingLesson}
                setEditingLesson={setEditingLesson}
                onSave={onSaveLesson}
            />
        </div>
    );
}
