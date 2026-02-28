'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Play, CheckCircle2, Trophy, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getLessonsByCourse } from '@/modules/learning/actions';
import Link from 'next/link';

type Lesson = {
  id: string;
  title: string;
  sequence_index: number;
  content_type: 'video' | 'mcq' | 'ppt';
  content_url: string;
  duration: number;
  status: 'locked' | 'available' | 'completed';
};

export function JourneyMap({ courseId }: { courseId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLessons() {
      try {
        const lessonData = await getLessonsByCourse(courseId);
        if (lessonData) {
          const formattedLessons = lessonData.map((l, i) => ({
            ...l,
            status: i === 0 ? 'available' : 'locked',
          }));
          setLessons(formattedLessons as Lesson[]);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchLessons();
  }, [courseId]);

  const handleLessonComplete = (lessonId: string) => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b']
    });

    setLessons(prev => prev.map((l, i, arr) => {
      if (l.id === lessonId) return { ...l, status: 'completed' as const };
      if (arr[i - 1]?.id === lessonId) return { ...l, status: 'available' as const };
      return l;
    }));
  };

  if (loading) return <div className="p-8 text-center">Loading Journey...</div>;

  return (
    <div className="relative min-h-screen py-20 px-4 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md mx-auto relative">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: lessons.length * 150 }}>
          {lessons.map((_, i) => {
            if (i === lessons.length - 1) return null;
            const startX = 50 + (i % 2 === 0 ? 20 : -20);
            const endX = 50 + ((i + 1) % 2 === 0 ? 20 : -20);
            return (
              <motion.path
                key={`path-${i}`}
                d={`M ${startX}% ${i * 150 + 40} L ${endX}% ${(i + 1) * 150 + 40}`}
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="8 8"
                className="text-zinc-300 dark:text-zinc-800"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: i * 0.2 }}
              />
            );
          })}
        </svg>

        <div className="space-y-[110px] relative z-10">
          {lessons.map((lesson, i) => (
            <div
              key={lesson.id}
              className={`flex justify-center ${i % 2 === 0 ? 'translate-x-12' : '-translate-x-12'}`}
            >
              <LessonNode
                lesson={lesson}
                onComplete={() => handleLessonComplete(lesson.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LessonNode({ lesson, onComplete }: { lesson: Lesson; onComplete: () => void }) {
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';

  const Icon = lesson.content_type === 'video' ? Play :
    lesson.content_type === 'mcq' ? Trophy :
      FileText;

  const content = (
    <motion.div
      whileHover={!isLocked ? { scale: 1.1 } : {}}
      whileTap={!isLocked ? { scale: 0.95 } : {}}
      className="relative flex flex-col items-center"
    >
      <div className={`
        w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg cursor-pointer
        transition-all duration-500 border-b-4 active:border-b-0 active:translate-y-1
        ${isCompleted ? 'bg-emerald-500 border-emerald-700 text-white' :
          isLocked ? 'bg-zinc-200 border-zinc-300 text-zinc-400 cursor-not-allowed' :
            'bg-white dark:bg-zinc-900 border-primary/20 dark:border-primary/40 text-primary'}
      `}>
        {isCompleted ? <CheckCircle2 size={32} /> :
          isLocked ? <Lock size={32} /> :
            <Icon size={32} fill={lesson.content_type === 'video' ? 'currentColor' : 'none'} />}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute -bottom-12 w-48 text-center"
      >
        <p className={`text-sm font-bold truncate ${isLocked ? 'text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
          {lesson.title}
        </p>
        <p className="text-xs text-zinc-400">{lesson.duration} min</p>
      </motion.div>

      {lesson.status === 'available' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl bg-primary/20 -z-10"
        />
      )}
    </motion.div>
  );

  if (isLocked) return content;

  return (
    <Link href={`/student/lesson/${lesson.id}`}>
      {content}
    </Link>
  );
}
