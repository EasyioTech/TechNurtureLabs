'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Download, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoPlayer } from '@/components/video/video-player';
import { CloudflareStreamPlayer } from '@/components/video/cloudflare-stream-player';
import { Lesson } from '@/modules/student/types';

// Lazy load heavy viewers
const PDFViewer = dynamic(() => import('@/components/learning/pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
});
const QuizEngine = dynamic(() => import('@/modules/student/components/quiz/quiz-engine').then(mod => mod.QuizEngine), {
  ssr: false,
});

type ContentBlock = { id: string; type: 'video' | 'pdf' | 'ppt' | 'image' | 'text'; url: string; urls?: string[]; };

/** Image carousel — renders multiple images with swipe/dot navigation */
function ImageCarousel({ urls, onComplete, lessonComplete }: {
  urls: string[];
  onComplete: () => void;
  lessonComplete: boolean;
}) {
  const [current, setCurrent] = React.useState(0);
  const completedRef = React.useRef(false);
  const touchStartX = React.useRef(0);
  const touchStartY = React.useRef(0);
  const [dir, setDir] = React.useState(1);

  const goTo = (next: number) => {
    if (next === current) return;
    setDir(next > current ? 1 : -1);
    setCurrent(next);
  };

  const goNext = () => { if (current < urls.length - 1) goTo(current + 1); };
  const goPrev = () => { if (current > 0) goTo(current - 1); };

  // Mark complete when last image is reached
  React.useEffect(() => {
    if ((current === urls.length - 1 || urls.length <= 1) && !completedRef.current && !lessonComplete) {
      completedRef.current = true;
      onComplete();
    }
  }, [current, urls.length, lessonComplete, onComplete]);

  return (
    <div className="relative w-full select-none"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
          if (dx < 0) goNext(); else goPrev();
        }
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={current}
          src={urls[current]}
          alt=""
          className="w-full max-h-[75vh] object-contain rounded-2xl lg:rounded-3xl shadow-xl border border-slate-100"
          initial={{ opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -40 }}
          transition={{ duration: 0.2 }}
        />
      </AnimatePresence>

      {urls.length > 1 && (
        <>
          {current > 0 && (
            <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-slate-900/60 transition-colors">
              <ChevronLeft size={20} />
            </button>
          )}
          {current < urls.length - 1 && (
            <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-slate-900/60 transition-colors">
              <ChevronRight size={20} />
            </button>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'h-2 rounded-full transition-all duration-200',
                  i === current ? 'w-5 bg-white' : 'w-2 bg-white/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function isCloudflareStreamUrl(url: string): boolean {
  return url.startsWith('cf-stream://') || url.includes('videodelivery.net/');
}

function extractStreamUid(url: string): string {
  if (url.startsWith('cf-stream://')) return url.replace('cf-stream://', '');
  const match = url.match(/videodelivery\.net\/([a-f0-9]+)/i);
  return match?.[1] || url;
}

// Parse content_items JSON. Falls back to single content_url for old lessons.
function resolveBlocks(lesson: Lesson): ContentBlock[] | null {
  if (lesson.content_type === 'quiz' || lesson.content_type === 'assignment') return null;
  if (lesson.content_items) {
    try {
      const parsed = JSON.parse(lesson.content_items);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as ContentBlock[];
    } catch {}
  }
  return null; // fall through to legacy single-content rendering
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

/** Renders a single content block (video / pdf / image / ppt) */
function ContentBlock({
  block,
  lessonId,
  userProgress,
  lessonComplete,
  onComplete,
  pageNumber,
  docMax,
  onDocStateChange,
  onPageChange,
  isFirst,
}: {
  block: ContentBlock;
  lessonId: string;
  userProgress: Lesson['user_progress'];
  lessonComplete: boolean;
  onComplete: (isVideo?: boolean) => void;
  pageNumber?: number;
  docMax?: number;
  onDocStateChange?: (total: number) => void;
  onPageChange?: (page: number) => void;
  isFirst: boolean;
}) {
  const isStreamVideo = block.type === 'video' && isCloudflareStreamUrl(block.url);
  const isRegularVideo = block.type === 'video' && !isStreamVideo;

  if (block.type === 'text') {
    return (
      <div className="bg-white w-full px-4 sm:px-8 lg:px-12 py-3 lg:py-5">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">
            {block.url}
          </p>
        </div>
      </div>
    );
  }

  if (isStreamVideo) {
    return (
      <div className="w-full lg:max-w-[1100px] lg:mx-auto lg:px-12 lg:py-4">
        <CloudflareStreamPlayer
          uid={extractStreamUid(block.url)}
          lessonId={lessonId}
          initialProgress={isFirst ? userProgress as any : null}
          onComplete={(isVideo) => onComplete(isVideo)}
          className="lg:rounded-2xl overflow-hidden lg:shadow-xl lg:border lg:border-slate-200/70"
        />
      </div>
    );
  }

  if (isRegularVideo) {
    return (
      <div className="w-full lg:max-w-[1100px] lg:mx-auto lg:px-12 lg:py-4">
        <VideoPlayer
          src={block.url}
          lessonId={lessonId}
          initialProgress={isFirst ? userProgress as any : null}
          onComplete={(isVideo) => onComplete(isVideo)}
          className="lg:rounded-2xl overflow-hidden lg:shadow-xl lg:border lg:border-slate-200/70"
        />
      </div>
    );
  }

  if (block.type === 'image') {
    const imageUrls = block.urls && block.urls.length > 0 ? block.urls : (block.url ? [block.url] : []);
    if (imageUrls.length === 0) return null;
    return (
      <div className="bg-white w-full px-4 sm:px-8 lg:px-12 py-5 lg:py-8">
        <div className="max-w-[1100px] mx-auto">
          <ImageCarousel urls={imageUrls} onComplete={onComplete} lessonComplete={lessonComplete} />
        </div>
      </div>
    );
  }

  if (block.type === 'pdf') {
    return (
      <div className="w-full h-full bg-white">
        <PDFViewer
          url={block.url}
          onComplete={() => onComplete()}
          lessonComplete={lessonComplete}
          pageNumber={pageNumber ?? 1}
          docMax={docMax ?? 1}
          onLoadTotalPages={(total) => onDocStateChange?.(total)}
          onPageChange={onPageChange}
        />
      </div>
    );
  }

  if (block.type === 'ppt') {
    return (
      <div className="bg-white w-full px-4 sm:px-8 lg:px-12 py-10 lg:py-16">
        <div className="max-w-lg mx-auto bg-white rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/60 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-6 relative z-10">
            <Download size={28} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3 relative z-10">Course Slides</h2>
          <a
            href={block.url}
            download
            onClick={() => onComplete()}
            className="w-full inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 group relative z-10"
          >
            Download &amp; Continue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    );
  }

  return null;
}

export function LessonContent({
  lesson,
  isFocusMode,
  onComplete,
  lessonComplete,
  pageNumber = 1,
  docMax = 1,
  onDocStateChange,
  onPageChange,
}: LessonContentProps) {
  // Memoized so the array reference is stable across renders — prevents the completion
  // effect from re-firing every render after all blocks are done.
  const blocks = React.useMemo(
    () => resolveBlocks(lesson),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lesson.content_items, lesson.content_url, lesson.content_type]
  );

  // Track which blocks have completed (for multi-block: complete after last interactive block)
  const [completedBlocks, setCompletedBlocks] = React.useState<Set<string>>(new Set());
  // Prevent onComplete from firing more than once per lesson
  const lessonCompletedRef = React.useRef(false);
  // Store latest isVideo so the effect below can forward it
  const lastBlockIsVideo = React.useRef<boolean | undefined>(undefined);

  // Interactive blocks are blocks that require user action to complete.
  // Text blocks are purely informational — they auto-complete immediately and are excluded
  // from the completion threshold so they can never block lesson completion.
  const interactiveBlocks = React.useMemo(
    () => (blocks ?? []).filter(b => b.type !== 'text'),
    [blocks]
  );

  // Reset per-lesson state when lesson changes
  React.useEffect(() => {
    setCompletedBlocks(new Set());
    lessonCompletedRef.current = false;
    lastBlockIsVideo.current = undefined;
  }, [lesson.id]);

  const handleBlockComplete = React.useCallback((blockId: string, isVideo?: boolean) => {
    if (!blocks) { onComplete(isVideo); return; }
    // Text blocks don't participate in the completion gate — skip tracking them
    const isTextBlock = blocks.find(b => b.id === blockId)?.type === 'text';
    if (isTextBlock) return;
    lastBlockIsVideo.current = isVideo;
    // Pure updater — no side-effects inside
    setCompletedBlocks(prev => {
      const next = new Set(prev);
      next.add(blockId);
      return next;
    });
  }, [blocks, onComplete]);

  // Fire lesson completion AFTER state update — guard ref prevents repeated calls.
  // Only interactive (non-text) blocks count toward the completion threshold.
  React.useEffect(() => {
    if (!blocks) return;
    const threshold = interactiveBlocks.length;
    if (threshold === 0) {
      // All blocks are text — complete immediately
      if (!lessonCompletedRef.current) {
        lessonCompletedRef.current = true;
        onComplete(undefined);
      }
      return;
    }
    const allDone = interactiveBlocks.every(b => completedBlocks.has(b.id));
    if (allDone && !lessonCompletedRef.current) {
      lessonCompletedRef.current = true;
      onComplete(lastBlockIsVideo.current);
    }
  }, [completedBlocks, blocks, interactiveBlocks, onComplete]);

  // Legacy single-content rendering
  const isStreamVideo = lesson.content_type === 'video' && lesson.content_url && isCloudflareStreamUrl(lesson.content_url);
  const isRegularVideo = lesson.content_type === 'video' && lesson.content_url && !isStreamVideo;

  return (
    <section className={cn(
      'relative transition-all duration-700',
      isFocusMode ? 'fixed inset-0 top-0 z-[100] bg-black overflow-auto' : 'bg-black lg:bg-white'
    )}>

      {/* ── Multi-block content with Smart Order ────────────── */}
      {(() => {
        if (!blocks) return null;

        // Split blocks into video (to show at top) and others
        const firstVideoIdx = blocks.findIndex(b => b.type === 'video');
        const firstVideo = firstVideoIdx !== -1 ? blocks[firstVideoIdx] : null;
        const otherBlocks = blocks.filter((_, i) => i !== firstVideoIdx);

        return (
          <>
            {/* 1. Top Video (if any) */}
            {firstVideo && (
              <ContentBlock
                key={firstVideo.id}
                block={firstVideo}
                lessonId={lesson.id}
                userProgress={lesson.user_progress}
                lessonComplete={lessonComplete}
                onComplete={(isVideo) => handleBlockComplete(firstVideo.id, isVideo)}
                isFirst={true}
              />
            )}

            {/* 2. Lesson Title & Description (The "About" section) */}
            <div className="bg-white w-full px-4 sm:px-8 lg:px-12 py-8 lg:py-12 border-b border-slate-100/50">
              <div className="max-w-[1100px] mx-auto space-y-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                  {lesson.title}
                </h1>
                {lesson.description && (
                  <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-medium whitespace-pre-wrap max-w-3xl">
                    {lesson.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                  <span className="flex items-center gap-1.5"><Download size={12} className="text-indigo-500" /> {blocks.length} Resources</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>{lesson.xp_reward} XP Reward</span>
                </div>
              </div>
            </div>

            {/* 3. Remaining blocks (Documents, Images, slides, other videos or text blocks) */}
            {otherBlocks.map((block, idx) => (
              <ContentBlock
                key={block.id}
                block={block}
                lessonId={lesson.id}
                userProgress={lesson.user_progress}
                lessonComplete={lessonComplete}
                onComplete={(isVideo) => handleBlockComplete(block.id, isVideo)}
                pageNumber={idx === 0 ? pageNumber : 1}
                docMax={idx === 0 ? docMax : 1}
                onDocStateChange={idx === 0 ? onDocStateChange : undefined}
                onPageChange={idx === 0 ? onPageChange : undefined}
                isFirst={!firstVideo && idx === 0}
              />
            ))}
          </>
        );
      })()}

      {/* ── Legacy: single video ────────────────────────────── */}
      {!blocks && isStreamVideo && (
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

      {!blocks && isRegularVideo && (
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

      {!blocks && lesson.content_type === 'pdf' && (
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

      {!blocks && lesson.content_type === 'image' && lesson.content_url && (
        <div className="bg-white w-full px-4 sm:px-8 lg:px-12 py-8 lg:py-12">
          <div className="max-w-[1100px] mx-auto">
            <ImageCarousel urls={[lesson.content_url]} onComplete={onComplete} lessonComplete={lessonComplete} />
          </div>
        </div>
      )}

      {!blocks && lesson.content_type === 'ppt' && (
        <div className="bg-white w-full px-4 sm:px-8 lg:px-12 py-10 lg:py-16">
          <div className="max-w-lg mx-auto bg-white rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/60 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.75rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-6 relative z-10">
              <Download size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mb-3 relative z-10">Course Slides</h2>
            <p className="text-slate-400 font-medium text-xs sm:text-sm mb-8 max-w-xs mx-auto leading-relaxed relative z-10">
              Download the presentation slides to study offline.
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
