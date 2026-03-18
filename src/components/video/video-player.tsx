'use client';

import React, { useRef, useState, useEffect } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { MonitorPlay, CheckCircle2 as CheckIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { cn } from '@/lib/utils';
import { saveVideoProgress } from '@/modules/student/actions/lesson-actions';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  lessonId: string;
  initialProgress?: {
    last_position_secs: number;
    progress_pct: number;
    completed_at: any;
    verified_watch_seconds?: number;
  } | null;
  onComplete?: (isVideo?: boolean) => void;
  className?: string;
}

export function VideoPlayer({ src, poster, lessonId, initialProgress, onComplete, className }: VideoPlayerProps) {
  const player = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [verifiedProgress, setVerifiedProgress] = useState(initialProgress?.progress_pct || 0);
  const [isCompleted, setIsCompleted] = useState(!!initialProgress?.completed_at);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  // Auto-resume logic
  const onCanPlay = () => {
    if (!isReady && initialProgress?.last_position_secs && initialProgress.last_position_secs > 10 && !isCompleted) {
      if (player.current) {
        player.current.currentTime = initialProgress.last_position_secs;
      }
    }
    setIsReady(true);
  };

  // Simple progress tracking
  useEffect(() => {
    if (isCompleted || !isReady) return;

    const interval = setInterval(() => {
      if (!player.current || player.current.paused) return;

      const currentTime = player.current.currentTime;
      const duration = player.current.duration;
      
      if (duration > 0) {
        const pct = Math.floor((currentTime / duration) * 100);
        // Local state update for UI
        setVerifiedProgress(prev => Math.max(prev, pct));
        
        // Background sync
        saveVideoProgress(lessonId, currentTime, pct).catch(() => {});
      }
    }, 10000); // Sync every 10 seconds

    return () => clearInterval(interval);
  }, [lessonId, isCompleted, isReady]);

  const handleComplete = async () => {
    if (isCompleted) return;
    setIsSubmitting(true);
    setCompletionError(null);
    
    try {
      // Import the server action directly
      const { completeLessonAndReward } = await import('@/modules/student/actions/lesson-actions');
      const result = await completeLessonAndReward(lessonId);
      
      if (result.success) {
        setIsCompleted(true);
        if (onComplete) await onComplete(true);
        setTimeout(() => setShowCompletionOverlay(false), 2000);
      } else {
        setCompletionError(result.error || "Please finish watching the video.");
      }
    } catch (err) {
      setCompletionError("Connection error. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("w-full overflow-hidden bg-black", className)}>
      <div className="relative aspect-video w-full">
        <MediaPlayer
          ref={player}
          src={src}
          onEnded={() => setShowCompletionOverlay(true)}
          onCanPlay={onCanPlay}
          className="w-full h-full"
          playsInline
          crossOrigin
          key={src}
        >
          <MediaProvider>
            {poster && <Poster src={poster} className="object-cover w-full h-full" />}
          </MediaProvider>
          <DefaultVideoLayout icons={defaultLayoutIcons} />

          {showCompletionOverlay && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/10 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-[320px] w-full bg-white/90 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-xl text-center"
              >
                <div className="space-y-6">
                  {isCompleted ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckIcon size={24} className="text-slate-900" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900">Progress Saved</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Synchronization Complete</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                         <MonitorPlay size={24} className="text-slate-900" />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900">Lesson Finished</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Ready to complete?</p>
                      </div>

                      {completionError && (
                        <div className="text-[10px] font-bold text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                          {completionError}
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        {verifiedProgress >= 75 ? (
                          <button 
                            onClick={handleComplete}
                            disabled={isSubmitting}
                            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                          >
                            {isSubmitting ? (
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : "Save Progress"}
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-slate-900 transition-all duration-1000" 
                                    style={{ width: `${verifiedProgress}%` }}
                                  />
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 text-right">
                                  {verifiedProgress}% Complete
                                </div>
                            </div>
                            <button 
                              onClick={() => setShowCompletionOverlay(false)}
                              className="w-full h-12 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                              Resume Video
                            </button>
                          </div>
                        )}
                        {!isSubmitting && (
                          <button 
                            onClick={() => setShowCompletionOverlay(false)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest pt-1"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </MediaPlayer>
      </div>
    </div>
  );
}
