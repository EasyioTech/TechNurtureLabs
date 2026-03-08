'use client';

import React, { useRef, useState, useEffect } from 'react';
import { MediaPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { saveVideoProgress, markLessonComplete } from '@/components/learning/actions';
import { cn } from '@/lib/utils';
import { CheckCircle2, Play, RotateCcw, FastForward, Info, Lock } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  lessonId: string;
  userId?: string;
  onComplete?: () => void;
  className?: string;
}

/**
 * Premium Restricted Video Player.
 * Strictly prevents skipping forward to ensure students watch the full content.
 */
export function VideoPlayer({ src, poster, lessonId, userId, onComplete, className }: VideoPlayerProps) {
  const player = useRef<any>(null);
  const lastSavedPosition = useRef(0);
  const maxTimeWatched = useRef(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  // Auto-save progress and update maxTime
  useEffect(() => {
    const interval = setInterval(() => {
      if (player.current && !player.current.paused) {
        const { currentTime, duration } = player.current;
        if (duration > 0) {
          // Update max watched time strictly (only increment if it played naturally, not jumped)
          if (currentTime > maxTimeWatched.current && currentTime - maxTimeWatched.current <= 3) {
            maxTimeWatched.current = currentTime;
          }

          const pct = (currentTime / duration) * 100;
          setProgress(pct);

          // Save progress every 15 seconds
          if (Math.abs(currentTime - lastSavedPosition.current) > 15) {
            saveProgress(pct);
          }

          // Mark as complete if > 95% AND they've actually seen it
          const maxPct = (maxTimeWatched.current / duration) * 100;
          if (maxPct >= 95 && !isCompleted) {
            handleComplete();
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [lessonId, userId, isCompleted]);

  const saveProgress = async (pct: number) => {
    lastSavedPosition.current = player.current?.currentTime || 0;
    try {
      await saveVideoProgress(lessonId, pct);
    } catch (err) {
      console.error('[VideoPlayer] Progress Sync Error:', err);
    }
  };

  const handleComplete = async () => {
    setIsCompleted(true);
    try {
      await markLessonComplete(lessonId);
      if (onComplete) onComplete();
    } catch (err) {
      console.error('[VideoPlayer] Completion Error:', err);
    }
  };

  const handleSeekBack = () => {
    if (player.current) {
      player.current.currentTime = Math.max(0, player.current.currentTime - 10);
    }
  };

  const onSeeking = (event: any) => {
    const targetTime = event?.detail ?? player.current?.currentTime ?? 0;
    // VERY STRICT: If seeking forward beyond what was already watched
    if (targetTime > maxTimeWatched.current + 2) {
      player.current.currentTime = maxTimeWatched.current;
      setShowSkipWarning(true);
      setTimeout(() => setShowSkipWarning(false), 3000);
    }
  };

  return (
    <div className={cn("space-y-8 w-full", className)}>
      <div className="aspect-video bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-900/10 border border-white/5 relative group">
        <MediaPlayer
          ref={player}
          title="Curriculum Video"
          src={src}
          onEnded={() => !isCompleted && handleComplete()}
          onSeeking={onSeeking}
          onTimeUpdate={(event: any) => {
            const currentTime = event?.detail?.currentTime ?? player.current?.currentTime ?? 0;
            if (currentTime > maxTimeWatched.current && currentTime - maxTimeWatched.current <= 1) {
              maxTimeWatched.current = currentTime;
            }
          }}
          className="w-full h-full"
          playsInline
        >
          <MediaProvider>
            {poster && <Poster src={poster} alt="Lesson Thumbnail" className="vds-poster object-cover" />}
          </MediaProvider>
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>

        {showSkipWarning && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in duration-300">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-[2rem] flex items-center gap-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                <Lock size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest">No Skipping Allowed</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Please watch the full content to proceed</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={cn(
        "p-8 lg:p-10 rounded-[3rem] border transition-all duration-700 relative overflow-hidden",
        isCompleted
          ? "bg-emerald-50/20 border-emerald-100"
          : "bg-white border-slate-100 shadow-2xl shadow-slate-200/40"
      )}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className={cn(
              "w-20 h-20 rounded-[2rem] flex items-center justify-center border-4 transition-all duration-1000",
              isCompleted
                ? "bg-white text-emerald-500 border-emerald-100 scale-110 rotate-[360deg] shadow-lg"
                : "bg-slate-50 text-indigo-600 border-slate-100"
            )}>
              {isCompleted ? <CheckCircle2 size={40} /> : <Play size={40} fill="currentColor" />}
            </div>
            <div className="flex-1">
              <h4 className={cn(
                "text-xl font-black uppercase tracking-tight mb-2",
                isCompleted ? "text-emerald-900" : "text-slate-900"
              )}>
                {isCompleted ? 'Module Finished' : 'Continuous Learning'}
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="student" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {isCompleted ? 'Badge Available' : 'Watching with 4K+ others'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto min-w-[320px]">
            <div className="flex-1 w-full">
              <div className="flex items-end justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Watching Progress</p>
                </div>
                <p className={cn(
                  "text-base font-black tracking-tighter",
                  isCompleted ? "text-emerald-600" : "text-indigo-600"
                )}>
                  {Math.round(progress)}%
                </p>
              </div>
              <div className="h-5 bg-slate-100 rounded-full overflow-hidden p-1.5 border border-slate-200/30">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSeekBack}
                className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all active:scale-90"
                title="Rewind 10s"
              >
                <RotateCcw size={22} />
              </button>
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-200 cursor-not-allowed" title="Skipping Locked">
                <FastForward size={22} />
              </div>
            </div>
          </div>
        </div>

        {!isCompleted && (
          <div className="mt-8 pt-8 border-t border-slate-100 flex items-center gap-3">
            <Info size={14} className="text-amber-500" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Lesson will be marked complete automatically once you reach 95% of the video duration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
