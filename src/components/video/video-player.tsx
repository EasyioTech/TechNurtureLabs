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
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls during playback
  useEffect(() => {
    const handleActivity = () => {
      setShowControls(true);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      if (isPlaying) {
        controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [isPlaying]);

  // Auto-save progress and update maxTime
  useEffect(() => {
    const interval = setInterval(() => {
      if (player.current && !player.current.paused) {
        const { currentTime, duration } = player.current;
        if (duration > 0) {
          if (currentTime > maxTimeWatched.current && currentTime - maxTimeWatched.current <= 3) {
            maxTimeWatched.current = currentTime;
          }

          const pct = (currentTime / duration) * 100;
          setProgress(pct);

          if (Math.abs(currentTime - lastSavedPosition.current) > 15) {
            saveProgress(pct);
          }

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
    if (targetTime > maxTimeWatched.current + 2) {
      player.current.currentTime = maxTimeWatched.current;
      setShowSkipWarning(true);
      setTimeout(() => setShowSkipWarning(false), 3000);
    }
  };

  return (
    <div className={cn("relative group/player w-full transition-all duration-1000", className)}>
      {/* Cinematic Ambient Aura */}
      <div className={cn(
        "absolute -inset-20 theater-aura transition-opacity duration-1000",
        isPlaying ? "opacity-100" : "opacity-0"
      )} />

      <div className={cn(
        "relative z-20 aspect-video bg-black rounded-[3rem] overflow-hidden shadow-[0_0_100px_-20px_rgba(30,41,59,0.5)] border border-white/5 transition-all duration-1000",
        isPlaying && "scale-[1.02] shadow-[0_0_150px_-20px_rgba(79,70,229,0.2)]"
      )}>
        <MediaPlayer
          ref={player}
          title="Curriculum Video"
          src={src}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
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
          <div className={cn(
            "absolute inset-0 z-50 transition-opacity duration-500 pointer-events-none",
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          )}>
            <DefaultVideoLayout icons={defaultLayoutIcons} />
          </div>
        </MediaPlayer>

        {/* Skip Warning Overlay */}
        {showSkipWarning && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900/90 border border-white/10 px-10 py-6 rounded-[2.5rem] flex items-center gap-5 shadow-2xl scale-110">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                <Lock size={28} strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Focus Mode Active</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Skipping is restricted to ensure mastery.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Under-Player Minimal Progress (Only visible when controls are hidden) */}
      <div className={cn(
        "absolute -bottom-4 left-10 right-10 h-1.5 transition-all duration-700 z-10",
        !showControls && isPlaying ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="w-full h-full bg-white/5 backdrop-blur-md rounded-full overflow-hidden border border-white/10">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Context Info Card (Hides when playing) */}
      <div className={cn(
        "mt-12 p-10 rounded-[4rem] border transition-all duration-1000",
        isCompleted ? "bg-emerald-50/20 border-emerald-100" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/40",
        isPlaying && "opacity-20 blur-xl scale-95 pointer-events-none translate-y-12"
      )}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className={cn(
              "w-24 h-24 rounded-[2.5rem] flex items-center justify-center border-4 transition-all duration-1000",
              isCompleted
                ? "bg-white text-emerald-500 border-emerald-100 scale-110 shadow-lg"
                : "bg-slate-50 text-indigo-600 border-slate-100"
            )}>
              {isCompleted ? <CheckCircle2 size={48} /> : <Play size={48} fill="currentColor" className="ml-2" />}
            </div>
            <div className="text-left">
              <h4 className={cn(
                "text-2xl font-black uppercase tracking-tight mb-2 leading-none",
                isCompleted ? "text-emerald-900" : "text-slate-900"
              )}>
                {isCompleted ? 'Knowledge Verified' : 'Deep Study Session'}
              </h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {isCompleted ? 'Badge Unlocked' : 'Mastery Progress Optimized'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 w-full lg:w-auto min-w-[400px]">
            <div className="flex-1 w-full">
              <div className="flex items-end justify-between mb-4">
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Watching Progress</p>
                <p className="text-xl font-black text-indigo-600 tracking-tighter">{Math.round(progress)}%</p>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200/30">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    isCompleted ? "bg-emerald-500" : "bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSeekBack}
                className="w-16 h-16 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-100 hover:shadow-2xl transition-all active:scale-90"
              >
                <RotateCcw size={28} />
              </button>
              <div className="w-16 h-16 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center text-slate-200 cursor-not-allowed opacity-50">
                <FastForward size={28} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
