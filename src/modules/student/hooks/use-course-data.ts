'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCourseDetailsData } from '@/modules/student/actions';
import { Lesson } from '@/modules/student/types';
import { toast } from 'sonner';

export function useCourseData(courseId: string) {
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCourseDetailsData(courseId);
      setCourse(data.course);
      setLessons(data.lessons as any);
      setEnrolledCount(data.enrolledCount);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const totalXP = lessons.reduce((acc, l) => acc + (l.xp_reward || 0), 0);
  const earnedXP = lessons.filter(l => l.status === 'completed').reduce((acc, l) => acc + (l.xp_reward || 0), 0);
  const progress = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 10), 0);
  const nextLesson = lessons.find(l => l.status === 'available');

  return {
    course,
    lessons,
    enrolledCount,
    loading,
    completedCount,
    totalXP,
    earnedXP,
    progress,
    totalDuration,
    nextLesson
  };
}
