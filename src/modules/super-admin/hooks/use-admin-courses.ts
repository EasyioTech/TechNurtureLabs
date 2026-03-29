'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
    fetchAdminCourses,
    saveCourseAdmin,
    deleteCourseAdmin,
    fetchCourseLessons,
    saveLessonAdmin,
    deleteLessonAdmin,
    saveLessonOrderAdmin,
    cloneLessonAction,
    cloneQuizAction,
    deleteQuizAdmin,
} from '../actions';
import { Course, Lesson } from '../types';

function isUnauthorized(err: unknown) {
    return (err as any)?.message === 'UNAUTHORIZED';
}
function handleUnauthorized() {
    window.location.href = '/admin-portal/login';
}

export function useAdminCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [coursesPage, setCoursesPage] = useState(0);
    const [totalCoursesPages, setTotalCoursesPages] = useState(0);
    const [courseClassMappings] = useState<any[]>([]);

    // Dialog state
    const [showCourseDialog, setShowCourseDialog] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
    const [showLessonDialog, setShowLessonDialog] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);

    async function loadCourses(page = 0) {
        try {
            const res = await fetchAdminCourses(page, 50);
            setCourses(res.data as any);
            setCoursesPage(page);
            setTotalCoursesPages(res.pages);
        } catch (err) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error('Failed to load courses');
        }
    }

    async function selectCourse(course: Course) {
        setSelectedCourse(course);
        try {
            const data = await fetchCourseLessons(course.id);
            setLessons(data as any || []);
        } catch (err) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error('Failed to load lessons');
        }
    }

    async function saveCourse() {
        if (!editingCourse?.title) { toast.error('Course title is required'); return; }
        try {
            await saveCourseAdmin(editingCourse);
            toast.success(editingCourse.id ? 'Course updated' : 'Course created');
        } catch (err: any) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error(err?.message || 'Failed to save course'); return;
        }
        setShowCourseDialog(false);
        setEditingCourse(null);
        await loadCourses(coursesPage);
    }

    async function deleteCourse(id: string) {
        try {
            await deleteCourseAdmin(id);
            toast.success('Course deleted');
            if (selectedCourse?.id === id) { setSelectedCourse(null); setLessons([]); }
            await loadCourses(coursesPage);
        } catch (err) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error('Failed to delete course');
        }
    }

    async function saveLesson() {
        if (!editingLesson?.title || !selectedCourse) { toast.error('Lesson title is required'); return; }
        const courseSnapshot = selectedCourse;
        try {
            await saveLessonAdmin({
                ...editingLesson,
                course_id: editingLesson.course_id || courseSnapshot.id,
                sequence_index: editingLesson.sequence_index ?? lessons.length,
            });
            toast.success(editingLesson.id ? 'Lesson updated' : 'Lesson created');
        } catch (err: any) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error(err?.message || 'Failed to save lesson'); return;
        }
        setShowLessonDialog(false);
        setEditingLesson(null);
        await selectCourse(courseSnapshot);
    }

    async function deleteLesson(id: string) {
        try {
            await deleteLessonAdmin(id);
            toast.success('Lesson deleted');
            if (selectedCourse) await selectCourse(selectedCourse);
        } catch (err) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error('Failed to delete lesson');
        }
    }

    async function saveLessonOrder(customLessons?: Lesson[], silent = false) {
        if (!selectedCourse) return;
        const targetLessons = customLessons || lessons;
        const updates = targetLessons.map((lesson, index) => ({
            id: lesson.id, sequence_order: index + 1,
        }));
        if (updates.length === 0) return;
        try {
            await saveLessonOrderAdmin(updates);
            if (!silent) toast.success('Order saved');
        } catch (err: any) {
            if (!silent) toast.error('Failed to save order: ' + (err.message || 'Unknown error'));
        }
    }

    async function deleteQuiz(quizId: string) {
        try {
            await deleteQuizAdmin(quizId);
            toast.success('Quiz deleted');
            if (selectedCourse) await selectCourse(selectedCourse);
        } catch (err) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error('Failed to delete quiz');
        }
    }

    async function cloneLesson(lessonId: string, targetCourseId: string) {
        try {
            await cloneLessonAction(lessonId, targetCourseId);
            toast.success('Lesson cloned successfully');
            if (selectedCourse?.id === targetCourseId) await selectCourse(selectedCourse);
        } catch (err) {
            if (isUnauthorized(err)) { handleUnauthorized(); return; }
            toast.error('Failed to clone lesson');
        }
    }

    async function cloneQuiz(quizId: string, targetCourseId: string) {
        try {
            await cloneQuizAction(quizId, null, targetCourseId);
            toast.success('Quiz cloned successfully');
            if (selectedCourse?.id === targetCourseId) await selectCourse(selectedCourse!);
        } catch (err: any) {
            toast.error('Failed to clone quiz: ' + (err.message || 'Unknown error'));
        }
    }

    return {
        courses, selectedCourse, lessons, setLessons, courseClassMappings,
        coursesPage, setCoursesPage, totalCoursesPages,
        showCourseDialog, setShowCourseDialog, editingCourse, setEditingCourse,
        showLessonDialog, setShowLessonDialog, editingLesson, setEditingLesson,
        loadCourses, selectCourse, saveCourse, deleteCourse,
        saveLesson, deleteLesson, saveLessonOrder, deleteQuiz,
        cloneLesson, cloneQuiz,
    };
}
