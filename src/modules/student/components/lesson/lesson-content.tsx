'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Download, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/video/video-player';
import { CloudflareStreamPlayer } from '@/components/video/cloudflare-stream-player';
import { Lesson } from '@/modules/student/types';

// Lazy load heavy viewers
const PDFViewer = dynamic(() => import('@/components/learning/pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
});
const AssignmentViewer = dynamic(() => import('@/components/learning/assignment-viewer').then(mod => mod.AssignmentViewer), {
  ssr: false,
});

const QuizEngine = dynamic(() => import('@/modules/student/components/quiz/quiz-engine').then(mod => mod.QuizEngine), {
  ssr: false,
});

/** Check if a content_url points to a Cloudflare Stream video */
function isCloudflareStreamUrl(url: string): boolean {
  return url.startsWith('cf-stream://') || url.includes('videodelivery.net/');
}

/** Extract the Cloudflare Stream UID from a content_url */
function extractStreamUid(url: string): string {
  if (url.startsWith('cf-stream://')) return url.replace('cf-stream://', '');
  const match = url.match(/videodelivery\.net\/([a-f0-9]+)/i);
  return match?.[1] || url;
}

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
  const isStreamVideo = lesson.content_type === 'video' && lesson.content_url && isCloudflareStreamUrl(lesson.content_url);
  const isRegularVideo = lesson.content_type === 'video' && lesson.content_url && !isStreamVideo;

  return (
    <section className={cn(
      "relative transition-all duration-700",
      isFocusMode ? "fixed inset-0 top-0 z-[100] bg-black overflow-auto" : "bg-black lg:bg-white"
    )}>
      {/* ─── VIDEO: edge-to-edge on mobile, padded on desktop ─── */}
      {isStreamVideo && (
        <div className="w-full lg:max-w-[1100px] lg:mx-auto lg:px-12 lg:py-8">
          <CloudflareStreamPlayer
            uid={extractStreamUid(lesson.content_url!)}
            lessonId={lesson.id}
            initialProgress={lesson.user_progress as any}
            onComplete={(isVideo) => onComplete(isVideo)}
            className="lg:rounded-2xl overflow-hidden lg:shadow-xl lg:border lg:border-slate-200/70"
          />
        </div>
      )}

      {isRegularVideo && (
        <div className="w-full lg:max-w-[1100px] lg:mx-auto lg:px-12 lg:py-8">
          <VideoPlayer
            src={lesson.content_url!}
            lessonId={lesson.id}
            initialProgress={lesson.user_progress as any}
            onComplete={(isVideo) => onComplete(isVideo)}
            className="lg:rounded-2xl overflow-hidden lg:shadow-xl lg:border lg:border-slate-200/70"
          />
        </div>
      )}

      {/* ─── PDF: full-width, white bg ─── */}
      {lesson.content_type === 'pdf' && (
        <div className="w-full h-full bg-white">
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

      {/* ─── Image: full-width display ─── */}
      {lesson.content_type === 'image' && lesson.content_url && (
        <div className="bg-white w-full px-4 sm:px-8 lg:px-12 py-8 lg:py-12">
          <div className="max-w-[1100px] mx-auto">
            <img
              src={lesson.content_url}
              alt={lesson.title}
              className="w-full max-h-[80vh] object-contain rounded-2xl lg:rounded-3xl shadow-xl border border-slate-100"
              onLoad={() => !lessonComplete && onComplete()}
            />
          </div>
        </div>
      )}

      {/* ─── PPT / Slides: download card ─── */}
      {lesson.content_type === 'ppt' && (
        <div className="bg-white w-full px-4 sm:px-8 lg:px-12 py-10 lg:py-16">
          <div className="max-w-lg mx-auto bg-white rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/60 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.75rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-6 relative z-10">
              <Download size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mb-3 relative z-10">Course Slides</h2>
            <p className="text-slate-400 font-medium text-xs sm:text-sm mb-8 max-w-xs mx-auto leading-relaxed relative z-10">
              Download the presentation slides to study offline. Your progress will be recorded automatically.
            </p>
            <a
              href={lesson.content_url!}
              download
              onClick={() => onComplete()}
              className="w-full inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 group relative z-10"
            >
              Download &amp; Continue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      )}

      {/* ─── Assignment ─── */}
      {lesson.content_type === 'assignment' && (
        <div className="bg-white w-full px-4 sm:px-8 lg:px-12 py-6 lg:py-10">
          <div className="max-w-[1100px] mx-auto">
            <AssignmentViewer lessonId={lesson.id} onComplete={() => onComplete()} lessonComplete={lessonComplete} />
          </div>
        </div>
      )}

      {/* ─── Quiz ─── */}
      {lesson.content_type === 'quiz' && lesson.quiz_data && (
        <div className="bg-white w-full px-4 sm:px-8 lg:px-12 py-6 lg:py-10">
          <div className="max-w-[1100px] mx-auto">
            <QuizEngine
              quizData={lesson.quiz_data}
              lessonXp={lesson.xp_reward}
              lessonComplete={lessonComplete}
              onComplete={(score, perf) => onComplete(false, score, perf)}
            />
          </div>
        </div>
      )}
    </section>
  );
}
