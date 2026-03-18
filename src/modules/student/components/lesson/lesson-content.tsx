'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/video/video-player';
import { Lesson } from '@/modules/student/types';

// Lazy load heavy viewers
const PDFViewer = dynamic(() => import('@/components/learning/pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
});
const PPTViewer = dynamic(() => import('@/components/learning/ppt-viewer').then(mod => mod.PPTViewer), {
  ssr: false,
});
const AssignmentViewer = dynamic(() => import('@/components/learning/assignment-viewer').then(mod => mod.AssignmentViewer), {
  ssr: false,
});

const QuizEngine = dynamic(() => import('@/modules/student/components/quiz/quiz-engine').then(mod => mod.QuizEngine), {
  ssr: false,
});

interface LessonContentProps {
  lesson: Lesson;
  isFocusMode: boolean;
  onComplete: (isVideo?: boolean, quizPercentage?: number, isPerfect?: boolean) => void;
  lessonComplete: boolean;
  pageNumber?: number;
  docMax?: number;
  onDocStateChange?: (total: number) => void;
  onPageChange?: (page: number) => void;
}

export function LessonContent({
  lesson,
  isFocusMode,
  onComplete,
  lessonComplete,
  pageNumber = 1,
  docMax = 1,
  onDocStateChange,
  onPageChange
}: LessonContentProps) {
  return (
    <section className={cn(
      "relative transition-all duration-700",
      isFocusMode ? "fixed inset-0 top-0 z-[100] bg-white overflow-auto" : "bg-white border-b border-slate-100"
    )}>
        <div className={cn(
        "mx-auto transition-all duration-700 w-full",
        isFocusMode ? "h-full p-0" : "px-0 lg:px-0 pt-0 pb-8 lg:pb-12"
      )}>
         {lesson.content_type === 'video' && lesson.content_url && (
            <div className="w-full max-w-[1100px] mx-auto px-4 lg:px-12 py-6 lg:py-10">
                <VideoPlayer
                src={lesson.content_url}
                lessonId={lesson.id}
                initialProgress={lesson.user_progress as any}
                onComplete={(isVideo) => onComplete(isVideo)}
                className="rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100"
                />
            </div>
          )}

          {lesson.content_type === 'pdf' && (
            <div className="w-full h-full">
              <PDFViewer 
                url={lesson.content_url!} 
                onComplete={() => onComplete()} 
                lessonComplete={lessonComplete}
                pageNumber={pageNumber}
                docMax={docMax}
                onLoadTotalPages={(total) => onDocStateChange?.(total)}
                onPageChange={onPageChange}
              />
            </div>
          )}
          
          {lesson.content_type === 'ppt' && (
            <div className="w-full h-full">
              <PPTViewer
                url={lesson.content_url!}
                assetId={(lesson as any).asset_id ?? null}
                onComplete={() => onComplete()}
                lessonComplete={lessonComplete}
                pageNumber={pageNumber}
                docMax={docMax}
                onLoadTotalPages={(total) => onDocStateChange?.(total)}
                onPageChange={onPageChange}
              />
            </div>
          )}

          {lesson.content_type === 'assignment' && (
            <div className="w-full max-w-[1100px] mx-auto px-4 lg:px-12 py-6 lg:py-10">
              <AssignmentViewer lessonId={lesson.id} onComplete={() => onComplete()} lessonComplete={lessonComplete} />
            </div>
          )}

          {lesson.content_type === 'quiz' && lesson.quiz_data && (
            <div className="w-full max-w-[1100px] mx-auto px-4 lg:px-12 py-6 lg:py-10">
              <QuizEngine 
                quizData={lesson.quiz_data} 
                lessonXp={lesson.xp_reward} 
                lessonComplete={lessonComplete}
                onComplete={(score, perf) => onComplete(false, score, perf)}
              />
            </div>
          )}
      </div>
    </section>
  );
}
