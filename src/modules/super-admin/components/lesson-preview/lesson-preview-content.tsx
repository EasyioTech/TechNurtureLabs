'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Download, ChevronLeft, ChevronRight, FileText, MonitorPlay, Play, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoPlayer } from '@/modules/student/components/video/video-player';
import { CloudflareStreamPlayer } from '@/modules/student/components/video/cloudflare-stream-player';
import { Lesson } from '../../types';
import { useAdminTheme, t } from '../../theme-context';
import { QuizPreview } from './quiz-preview';

// Lazy load heavy viewers
const PDFViewer = dynamic(() => import('@/modules/student/components/learning/pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96 text-slate-400">Loading Document Viewer...</div>,
});

type ContentBlock = { id: string; type: 'video' | 'pdf' | 'ppt' | 'image' | 'text'; url: string; urls?: string[]; };

/** Image carousel — renders multiple images with swipe/dot navigation */
function ImageCarousel({ urls }: { urls: string[] }) {
  const [current, setCurrent] = React.useState(0);
  const [dir, setDir] = React.useState(1);

  const goTo = (next: number) => {
    if (next === current) return;
    setDir(next > current ? 1 : -1);
    setCurrent(next);
  };

  const goNext = () => { if (current < urls.length - 1) goTo(current + 1); };
  const goPrev = () => { if (current > 0) goTo(current - 1); };

  return (
    <div className="relative w-full select-none">
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={current}
          src={urls[current]}
          alt=""
          className="w-full max-h-[70vh] object-contain rounded-2xl md:rounded-[32px] shadow-xl border border-slate-100/50 select-none"
          initial={{ opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -40 }}
          transition={{ duration: 0.2 }}
        />
      </AnimatePresence>

      {urls.length > 1 && (
        <>
          {current > 0 && (
            <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-slate-900/60 transition-colors">
              <ChevronLeft size={20} />
            </button>
          )}
          {current < urls.length - 1 && (
            <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-slate-900/60 transition-colors">
              <ChevronRight size={20} />
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 rounded-full bg-black/20 backdrop-blur-sm">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
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
  return url.startsWith('cf-stream://') || 
         url.includes('videodelivery.net/') || 
         (url.length === 32 && !url.includes('/') && !url.includes('.'));
}

function extractStreamUid(url: string): string {
  if (url.startsWith('cf-stream://')) return url.replace('cf-stream://', '');
  if (url.includes('videodelivery.net/')) {
    const match = url.match(/videodelivery\.net\/([a-f0-9]+)/i);
    return match?.[1] || url;
  }
  return url;
}

function resolveBlocks(lesson: Lesson): ContentBlock[] | null {
  if (lesson.content_type === 'quiz') return null;
  if (lesson.content_items) {
    try {
      const parsed = JSON.parse(lesson.content_items);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as ContentBlock[];
    } catch {}
  }
  return null;
}

/** Renders a single content block for admin preview */
function ContentBlockRenderer({
  block,
  lessonId,
}: {
  block: ContentBlock;
  lessonId: string;
}) {
  const { isDark } = useAdminTheme();
  const isStreamVideo = block.type === 'video' && isCloudflareStreamUrl(block.url);
  const isRegularVideo = block.type === 'video' && !isStreamVideo;

  if (block.type === 'text') {
    return (
      <div className="w-full px-6 md:px-12 py-6">
        <div className="max-w-[1100px] mx-auto">
          <p className={cn(
            "text-base leading-relaxed font-medium whitespace-pre-wrap",
            isDark ? "text-slate-400" : "text-slate-600"
          )}>
            {block.url}
          </p>
        </div>
      </div>
    );
  }

  if (isStreamVideo) {
    return (
      <div className="w-full lg:max-w-[1100px] lg:mx-auto lg:px-12 lg:py-6">
        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-black">
          <CloudflareStreamPlayer
            uid={extractStreamUid(block.url)}
            lessonId={lessonId}
            onComplete={() => {}}
            autoPlay={false}
            muted={false}
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  if (isRegularVideo) {
    return (
      <div className="w-full lg:max-w-[1100px] lg:mx-auto lg:px-12 lg:py-6">
        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-black">
          <VideoPlayer
            src={block.url}
            lessonId={lessonId}
            onComplete={() => {}}
            autoplay={false}
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  if (block.type === 'image') {
    const imageUrls = block.urls && block.urls.length > 0 ? block.urls : (block.url ? [block.url] : []);
    if (imageUrls.length === 0) return null;
    return (
      <div className="w-full px-6 md:px-12 py-8">
        <div className="max-w-[1100px] mx-auto">
          <ImageCarousel urls={imageUrls} />
        </div>
      </div>
    );
  }

  if (block.type === 'pdf') {
    return (
      <div className="w-full px-4 md:px-12 py-8">
        <div className="max-w-[1100px] mx-auto overflow-hidden rounded-[32px] shadow-2xl border border-white/5 h-[70vh]">
          <PDFViewer
            url={block.url}
            onComplete={() => {}}
            lessonComplete={false}
            pageNumber={1}
            docMax={100}
            canMarkComplete={false}
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  if (block.type === 'ppt') {
    return (
      <div className="w-full px-6 md:px-12 py-10">
        <div className={cn(
          "max-w-md mx-auto rounded-[40px] p-10 border text-center relative overflow-hidden",
          isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xl"
        )}>
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mx-auto mb-6 relative z-10">
            <Download size={28} strokeWidth={2.5} />
          </div>
          <h2 className={cn("text-xl font-black uppercase tracking-tight mb-3 relative z-10", isDark ? "text-white" : "text-slate-900")}>Presentation Slides</h2>
          <p className={cn("text-[11px] font-bold uppercase tracking-widest mb-8 relative z-10", isDark ? "text-slate-500" : "text-slate-400")}>Administrator Preview Mode</p>
          <div className={cn(
            "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-dashed",
            isDark ? "border-white/10 text-slate-500" : "border-slate-200 text-slate-400"
          )}>
            Download disabled in preview
          </div>
        </div>
      </div>
    );
  }

  return null;
}

interface LessonPreviewContentProps {
  lesson: Lesson;
}

export function LessonPreviewContent({ lesson }: LessonPreviewContentProps) {
  const { isDark, accent } = useAdminTheme();
  const blocks = React.useMemo(() => resolveBlocks(lesson), [lesson.content_items, lesson.content_url, lesson.content_type]);

  if (lesson.content_type === 'quiz') {
    return (
      <div className="w-full px-4 md:px-12 py-8">
        <div className="max-w-[1100px] mx-auto">
          <QuizPreview lessonId={lesson.id} />
        </div>
      </div>
    );
  }

  if (!blocks) {
    // Legacy single-content rendering
    const isStreamVideo = lesson.content_type === 'video' && lesson.content_url && isCloudflareStreamUrl(lesson.content_url);
    const isRegularVideo = lesson.content_type === 'video' && lesson.content_url && !isStreamVideo;

    return (
      <div className="flex flex-col">
          {/* Top Info Banner if not video */}
          {lesson.content_type !== 'video' && (
            <div className={cn("w-full px-6 md:px-12 py-10 border-b", isDark ? "border-white/5" : "border-slate-100")}>
              <div className="max-w-[1100px] mx-auto space-y-4">
                <h1 className={cn("text-3xl font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>
                  {lesson.title}
                </h1>
                {lesson.description && (
                  <p className={cn("text-sm font-medium leading-relaxed max-w-3xl", isDark ? "text-slate-400" : "text-slate-500")}>
                    {lesson.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {isStreamVideo && (
            <div className="w-full lg:max-w-[1100px] lg:mx-auto lg:px-12 lg:py-8">
               <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-2xl border border-white/5 bg-black">
                <CloudflareStreamPlayer
                  uid={extractStreamUid(lesson.content_url!)}
                  lessonId={lesson.id}
                  onComplete={() => {}}
                  autoPlay={false}
                  muted={false}
                  className="w-full h-full"
                />
              </div>
              <div className="mt-8 px-4">
                 <h1 className={cn("text-2xl md:text-3xl font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>
                  {lesson.title}
                </h1>
                {lesson.description && (
                  <p className={cn("text-sm font-medium leading-relaxed mt-4 max-w-3xl", isDark ? "text-slate-400" : "text-slate-500")}>
                    {lesson.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {isRegularVideo && (
            <div className="w-full lg:max-w-[1100px] lg:mx-auto lg:px-12 lg:py-8">
              <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-2xl border border-white/5 bg-black">
                <VideoPlayer
                  src={lesson.content_url!}
                  lessonId={lesson.id}
                  onComplete={() => {}}
                  autoplay={false}
                  className="w-full h-full"
                />
              </div>
              <div className="mt-8 px-4">
                 <h1 className={cn("text-2xl md:text-3xl font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>
                  {lesson.title}
                </h1>
                {lesson.description && (
                  <p className={cn("text-sm font-medium leading-relaxed mt-4 max-w-3xl", isDark ? "text-slate-400" : "text-slate-500")}>
                    {lesson.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {lesson.content_type === 'pdf' && lesson.content_url && (
            <div className="w-full px-4 md:px-12 py-8">
              <div className="max-w-[1100px] mx-auto h-[80vh] rounded-[32px] overflow-hidden shadow-2xl border border-white/5">
                <PDFViewer
                  url={lesson.content_url}
                  onComplete={() => {}}
                  lessonComplete={false}
                  pageNumber={1}
                  docMax={100}
                  canMarkComplete={false}
                  className="w-full h-full rounded-none"
                />
              </div>
            </div>
          )}

          {lesson.content_type === 'ppt' && lesson.content_url && (
             <div className="w-full px-6 md:px-12 py-12">
               <div className={cn(
                  "max-w-md mx-auto rounded-[40px] p-12 border text-center relative overflow-hidden",
                  isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-xl"
                )}>
                  <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mx-auto mb-8 relative z-10">
                    <Download size={32} strokeWidth={2.5} />
                  </div>
                  <h2 className={cn("text-2xl font-black uppercase tracking-tight mb-4 relative z-10", isDark ? "text-white" : "text-slate-900")}>Presentation</h2>
                  <p className={cn("text-xs font-bold uppercase tracking-widest mb-10 text-slate-500 relative z-10", isDark ? "text-slate-500" : "text-slate-400")}>Legacy Single-Asset Mode</p>
                  <div className={cn(
                    "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-dashed",
                    isDark ? "border-white/10 text-slate-500" : "border-slate-200 text-slate-400"
                  )}>
                    Preview restricted
                  </div>
                </div>
             </div>
          )}
      </div>
    );
  }

  // Multi-block content
  const firstVideoIdx = blocks.findIndex(b => b.type === 'video');
  const firstVideo = firstVideoIdx !== -1 ? blocks[firstVideoIdx] : null;
  const otherBlocks = blocks.filter((_, i) => i !== firstVideoIdx);

  return (
    <div className="flex flex-col pb-20">
      {/* 1. Top Video (if any) */}
      {firstVideo && (
        <ContentBlockRenderer
          key={firstVideo.id}
          block={firstVideo}
          lessonId={lesson.id}
        />
      )}

      {/* 2. Lesson Info */}
      <div className={cn("w-full px-6 md:px-12 py-10 border-b", isDark ? "border-white/5" : "border-slate-100")}>
        <div className="max-w-[1100px] mx-auto space-y-4">
          <h1 className={cn("text-3xl md:text-4xl font-black tracking-tight uppercase", isDark ? "text-white" : "text-slate-900")}>
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className={cn("text-sm md:text-base font-medium leading-relaxed max-w-3xl", isDark ? "text-slate-400" : "text-slate-500")}>
              {lesson.description}
            </p>
          )}
          <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest pt-4">
             <span className="flex items-center gap-2"><HelpCircle size={14} className={accent.text} /> {blocks.length} Assets</span>
             <span className="flex items-center gap-2"><Play size={14} className={accent.text} /> {lesson.duration_minutes} Minutes</span>
             <span className="flex items-center gap-2"><Download size={14} className={accent.text} /> {lesson.xp_reward} XP Reward</span>
          </div>
        </div>
      </div>

      {/* 3. Remaining blocks */}
      {otherBlocks.map((block) => (
        <ContentBlockRenderer
          key={block.id}
          block={block}
          lessonId={lesson.id}
        />
      ))}
    </div>
  );
}
