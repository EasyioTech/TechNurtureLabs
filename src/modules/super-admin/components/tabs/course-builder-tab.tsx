'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Edit, Trash2, BookOpen, Layers, AlertOctagon } from 'lucide-react';
import { SortableLessonItem } from '../lesson-item-sortable';
import { CourseDialog } from '../course-dialog';
import { LessonDialog } from '../lesson-dialog';
import { Course, Lesson } from '../../types';
import { useAdminTheme, t } from '../../theme-context';
import {
    AlertDialog,
    AlertDialogContent,
} from '@/components/ui/alert-dialog';

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
    showCourseDialog: boolean;
    setShowCourseDialog: (v: boolean) => void;
    editingCourse: Partial<Course> | null;
    setEditingCourse: (c: Partial<Course> | null) => void;
    showLessonDialog: boolean;
    setShowLessonDialog: (v: boolean) => void;
    editingLesson: Partial<Lesson> | null;
    setEditingLesson: (l: Partial<Lesson> | null) => void;
    grades: any[];
    courseGradeMappings: any[];
}

export function CourseBuilderTab({
    courses, selectedCourse, lessons, setLessons,
    onSelectCourse, onSaveCourse, onDeleteCourse,
    onSaveLesson, onDeleteLesson, onSaveLessonOrder,
    showCourseDialog, setShowCourseDialog, editingCourse, setEditingCourse,
    showLessonDialog, setShowLessonDialog, editingLesson, setEditingLesson,
    grades, courseGradeMappings,
}: CourseBuilderTabProps) {
    const { isDark, accent } = useAdminTheme();
    const [itemToDelete, setItemToDelete] = useState<{ type: 'course' | 'lesson', id: string, name: string } | null>(null);

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

    const confirmDelete = () => {
        if (!itemToDelete) return;
        if (itemToDelete.type === 'course') {
            onDeleteCourse(itemToDelete.id);
        } else {
            onDeleteLesson(itemToDelete.id);
        }
        setItemToDelete(null);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Course List */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[24px] border overflow-hidden transition-all duration-500 shadow-xl shadow-black/5 flex flex-col h-[700px] ${t.card(isDark)}`}>
                    <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${t.border(isDark)}`}>
                        <h3 className={`font-black text-sm tracking-tight ${t.textPrimary(isDark)}`}>All Courses</h3>
                        <Button size="sm"
                            className={`rounded-full text-[10px] font-black h-8 px-4 border-0 ${t.btnPrimary(isDark, accent)}`}
                            onClick={() => { setEditingCourse({ published: false }); setShowCourseDialog(true); }}>
                            <Plus size={14} className="mr-1.5" />Create Course
                        </Button>
                    </div>

                    {courses.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className={`w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'} border-2 border-dashed ${t.border(isDark)}`}>
                                <BookOpen size={28} className={isDark ? 'text-slate-700' : 'text-slate-300'} />
                            </div>
                            <p className={`text-sm font-black tracking-tight ${t.textPrimary(isDark)}`}>No Courses Yet</p>
                            <p className={`text-[12px] mt-1 font-medium ${t.textMuted(isDark)}`}>Create your first course to begin building your curriculum.</p>
                        </div>
                    ) : (
                        <div className="p-3 space-y-2 overflow-y-auto flex-1">
                            {courses.map((course, i) => {
                                const isSelected = selectedCourse?.id === course.id;
                                return (
                                    <motion.div
                                        key={course.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className={`w-full text-left p-4 rounded-2xl cursor-pointer transition-all duration-300 group
                                            ${isSelected
                                                ? isDark ? `${accent.softDark.split(' ')[0]} ring-1 ring-${accent.name}-400/20 shadow-lg shadow-black/20` : `${accent.bg} text-white shadow-xl shadow-black/10`
                                                : isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50 border-transparent hover:border-slate-200 border'}`}
                                        onClick={() => onSelectCourse(course)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform overflow-hidden
                                                ${isSelected
                                                    ? isDark ? `${accent.bg} text-slate-900` : 'bg-white text-slate-900 ring-2 ring-white/20'
                                                    : isDark ? 'bg-white/[0.05] text-slate-500 border border-white/5' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                                {course.thumbnail || course.thumbnail_url ? (
                                                    <img src={course.thumbnail || course.thumbnail_url || ''} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <BookOpen size={18} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-black text-sm tracking-tight truncate ${isSelected ? (isDark ? accent.text : 'text-white') : t.textPrimary(isDark)}`}>{course.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className={`text-[10px] font-bold ${isSelected ? (isDark ? 'text-white/60' : 'text-white/70') : t.textMuted(isDark)}`}>
                                                        {course.lesson_count} LESSONS • {course.enrolled_count || 0} ENROLLED
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={`text-[9px] font-black px-2 py-0.5 rounded-md ${course.published || course.is_published ? (isSelected && !isDark ? 'bg-emerald-400/20 text-emerald-200' : t.live(isDark)) : (isSelected && !isDark ? 'bg-white/10 text-white/60' : t.draft(isDark))}`}>
                                                {(course.published || course.is_published) ? 'LIVE' : 'DRAFT'}
                                            </Badge>
                                        </div>
                                        {isSelected && (
                                            <div className="flex gap-2 mt-4 ml-14">
                                                <Button variant="ghost" size="sm" className={`h-7 px-3 text-[10px] font-black rounded-lg transition-colors ${isDark ? `${accent.text} hover:bg-white/[0.1]` : (isSelected && !isDark ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100')}`}
                                                    onClick={(e) => { e.stopPropagation(); setEditingCourse(course); setShowCourseDialog(true); }}>
                                                    <Edit size={12} className="mr-1.5" />EDIT
                                                </Button>
                                                <Button variant="ghost" size="sm" className={`h-7 px-3 text-[10px] font-black rounded-lg ${isSelected && !isDark ? 'text-rose-300 hover:bg-rose-500/20' : 'text-rose-500 hover:bg-rose-500/10'}`}
                                                    onClick={(e) => { e.stopPropagation(); setItemToDelete({ type: 'course', id: course.id, name: course.title }); }}>
                                                    <Trash2 size={12} className="mr-1.5" />DELETE
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Lesson Panel */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`lg:col-span-2 rounded-[24px] border overflow-hidden transition-all duration-500 shadow-xl shadow-black/5 flex flex-col h-[700px] ${t.card(isDark)}`}>
                    <div className={`flex items-center justify-between px-6 py-5 border-b flex-shrink-0 ${t.border(isDark)}`}>
                        <div>
                            <h3 className={`font-black text-lg tracking-tight ${t.textPrimary(isDark)}`}>
                                {selectedCourse ? selectedCourse.title : 'Course Lessons'}
                            </h3>
                            {selectedCourse && <p className={`text-[12px] font-medium mt-0.5 ${t.textMuted(isDark)}`}>{lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} in this course</p>}
                        </div>
                        {selectedCourse && (
                            <div className="flex gap-3">
                                <Button variant="outline" size="sm" className={`rounded-full h-9 px-5 text-[11px] font-black border-2 ${t.btnOutline(isDark)}`}
                                    onClick={() => { setEditingLesson({ content_type: 'video', xp_reward: 10, duration: 10, is_published: true }); setShowLessonDialog(true); }}>
                                    <Plus size={14} className="mr-1.5" />Add Lesson
                                </Button>
                                {lessons.length > 1 && (
                                    <Button size="sm" className={`rounded-full h-9 px-5 text-[11px] font-black shadow-lg border-0 ${t.btnPrimary(isDark, accent)}`} style={t.glowStyle(isDark, accent)} onClick={onSaveLessonOrder}>
                                        <Save size={14} className="mr-1.5" />Save Order
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        {selectedCourse ? (
                            lessons.length > 0 ? (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-3">{lessons.map((lesson, index) => (
                                            <SortableLessonItem key={lesson.id} lesson={lesson} index={index}
                                                onEdit={() => { setEditingLesson(lesson); setShowLessonDialog(true); }}
                                                onDelete={() => setItemToDelete({ type: 'lesson', id: lesson.id, name: lesson.title })} />
                                        ))}</div>
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <div className={`w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'} border-2 border-dashed ${t.border(isDark)}`}>
                                            <Layers size={28} className={isDark ? 'text-slate-700' : 'text-slate-200'} />
                                        </div>
                                        <p className={`text-sm font-black tracking-tight ${t.textPrimary(isDark)}`}>No Lessons Yet</p>
                                        <p className={`text-[12px] mt-1 font-medium ${t.textMuted(isDark)}`}>Add your first lesson, video, or document to this course.</p>
                                        <Button variant="outline" size="sm" className={`mt-6 rounded-full h-9 px-5 text-[11px] font-black border-2 ${t.btnOutline(isDark)}`}
                                            onClick={() => { setEditingLesson({ content_type: 'video', xp_reward: 10, duration: 10, is_published: true }); setShowLessonDialog(true); }}>
                                            <Plus size={14} className="mr-1.5" />Add First Lesson
                                        </Button>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className={`w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'} border-2 border-dashed ${t.border(isDark)}`}>
                                        <Layers size={28} className={isDark ? 'text-slate-700' : 'text-slate-200'} />
                                    </div>
                                    <p className={`text-sm font-black tracking-tight ${t.textPrimary(isDark)}`}>No Course Selected</p>
                                    <p className={`text-[12px] mt-1 font-medium ${t.textMuted(isDark)}`}>Select a course from the list on the left to view and manage its content.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <CourseDialog open={showCourseDialog} onOpenChange={setShowCourseDialog} editingCourse={editingCourse} setEditingCourse={setEditingCourse} onSave={onSaveCourse} grades={grades} courseGradeMappings={courseGradeMappings} />
            <LessonDialog open={showLessonDialog} onOpenChange={setShowLessonDialog} editingLesson={editingLesson} setEditingLesson={setEditingLesson} onSave={onSaveLesson} />

            {/* Global Delete Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent className={`w-[90vw] max-w-[420px] rounded-[24px] border-0 shadow-2xl p-0 overflow-hidden ${isDark ? 'bg-[#0f1219]' : 'bg-white'}`}>
                    <div className="p-8 pb-6 flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${isDark ? 'bg-rose-500/10 text-rose-500 shadow-rose-500/10' : 'bg-rose-50 text-rose-500 shadow-rose-500/10'}`}>
                            <AlertOctagon size={32} />
                        </div>
                        <h2 className={`text-xl font-[1000] tracking-tight mb-3 ${t.textPrimary(isDark)}`}>
                            Confirm Deletion
                        </h2>
                        <p className={`text-sm font-medium leading-relaxed ${t.textMuted(isDark)}`}>
                            Are you sure you want to delete the {itemToDelete?.type} <span className={isDark ? 'text-white font-bold' : 'text-slate-900 font-bold'}>"{itemToDelete?.name}"</span>?
                            <br /><br />
                            This action cannot be undone.
                        </p>
                    </div>
                    <div className={`px-8 py-5 flex items-center gap-3 border-t ${isDark ? 'border-white/10 bg-[#0f1219]' : 'border-slate-100 bg-slate-50'}`}>
                        <Button variant="ghost" onClick={() => setItemToDelete(null)}
                            className={`flex-1 rounded-full h-11 font-bold text-sm bg-transparent border-0 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white hover:text-white' : 'hover:bg-slate-200 text-slate-700 bg-slate-100'}`}>
                            Cancel
                        </Button>
                        <Button onClick={confirmDelete}
                            className={`flex-1 rounded-full h-11 font-black text-sm shadow-xl transition-all border-0
                                ${isDark ? 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500 shadow-rose-500/20' : 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500 shadow-rose-500/20'}`}>
                            Delete
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
