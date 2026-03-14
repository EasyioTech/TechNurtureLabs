'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLessonData, completeLessonAndReward, updateTimeSpent, getCourseDetailsData } from '@/modules/student/actions';
import { Lesson } from '@/modules/student/types';
import { toast } from 'sonner';

export function useLessonData(lessonId: string) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'quiz'>('overview');
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lessonComplete && lessonId) {
        updateTimeSpent(lessonId, 10);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lessonComplete, lessonId]);

  // Security
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLessonData(lessonId);
      if (data) {
        setLesson(data as any);
        setLessonComplete(!!data.user_progress?.completed_at);
        
        const course = await getCourseDetailsData(data.course_id);
        setCourseData(course);

        if (data.user_progress?.completed_at && data.quiz_data) {
           setActiveTab('quiz');
        }
      }
    } catch (err) {
      console.error('Failed to load lesson:', err);
      toast.error('Failed to load lesson content');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completeLesson = useCallback(async (quizPercentage?: number, isPerfect?: boolean) => {
    if (lessonComplete && !quizPercentage) return;
    
    try {
      const res = await completeLessonAndReward(lessonId, quizPercentage, isPerfect);
      if (res.success) {
        setLessonComplete(true);
        if (lesson?.course_id) {
          const course = await getCourseDetailsData(lesson.course_id);
          setCourseData(course);
        }
        if (lesson?.quiz_data) setActiveTab('quiz');
        if (!quizPercentage) toast.success("Step Verified!");
      }
    } catch (err) { 
      console.error('Failed to record completion:', err);
      toast.error("Failed to sync progress");
    }
  }, [lessonId, lessonComplete, lesson?.course_id, lesson?.quiz_data]);

  return {
    lesson,
    courseData,
    loading,
    lessonComplete,
    activeTab,
    setActiveTab,
    isFocusMode,
    setIsFocusMode,
    completeLesson
  };
}
