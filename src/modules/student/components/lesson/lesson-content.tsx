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
  // https://iframe.videodelivery.net/UID or https://videodelivery.net/UID/...
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
      isFocusMode ? "fixed inset-0 top-0 z-[100] bg-white overflow-auto" : "bg-white border-b border-slate-100"
    )}>
        <div className={cn(
        "mx-auto transition-all duration-700 w-full",
        isFocusMode ? "h-full p-0" : "px-0 lg:px-0 pt-0 pb-8 lg:pb-12"
      )}>
         {/* Cloudflare Stream video */}
         {isStreamVideo && (
            <div className="w-full max-w-[1100px] mx-auto px-4 lg:px-12 py-6 lg:py-10">
                <CloudflareStreamPlayer
                    uid={extractStreamUid(lesson.content_url!)}
                    lessonId={lesson.id}
                    initialProgress={lesson.user_progress as any}
                    onComplete={(isVideo) => onComplete(isVideo)}
                    className="rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100"
                />
            </div>
          )}

         {/* Regular video (local/R2/external URL) */}
         {isRegularVideo && (
            <div className="w-full max-w-[1100px] mx-auto px-4 lg:px-12 py-6 lg:py-10">
                <VideoPlayer
                src={lesson.content_url!}
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
            <div className="w-full max-w-[1100px] mx-auto px-4 lg:px-12 py-10 lg:py-20 flex justify-center">
              <div className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-slate-100 shadow-2xl text-center max-w-2xl w-full relative overflow-hidden group/card">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover/card:bg-indigo-100/50 transition-colors" />
                 
                 <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.75rem] md:rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-8 shadow-inner relative z-10">
                    <Download size={36} strokeWidth={2.5} />
                 </div>
                 
                 <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight mb-4 leading-tight relative z-10">Course Slides</h2>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-10 max-w-sm mx-auto leading-relaxed relative z-10">
                    Download the presentation slides to study the material offline. Your progress will be recorded and the next lesson will unlock automatically.
                 </p>
                 
                 <div className="flex flex-col items-center gap-4 relative z-10">
                    <a 
                      href={lesson.content_url!} 
                      download 
                      onClick={() => onComplete()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-4 bg-slate-950 text-white px-10 md:px-14 py-5 md:py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 group"
                    >
                       Download & Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">
                       Next lesson will unlock automatically after download
                    </p>
                 </div>
              </div>
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
