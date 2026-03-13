'use client';

import React, { useRef, useState, useEffect } from 'react';
import { MediaPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { saveVideoProgress, markLessonComplete } from '@/components/learning/actions';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, Play, RotateCcw, FastForward, 
  Info, Lock, ShieldCheck, Zap, Maximize, 
  Settings, Volume2, Timer, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  lessonId: string;
  initialProgress?: {
    last_position_secs: number;
    progress_pct: number;
    completed_at: any;
  } | null;
  onComplete?: () => void;
  className?: string;
}

/**
 * Premium Immersive Video Player.
 * - Persistent Progress (Resume from last timestamp)
 * - Security Guard (No forward skipping)
 * - Mobile-First Responsive Design
 * - Cinematic Dark UI
 */
export function VideoPlayer({ src, poster, lessonId, initialProgress, onComplete, className }: VideoPlayerProps) {
  const player = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const maxTimeWatched = useRef(initialProgress?.last_position_secs || 0);
  const [progress, setProgress] = useState(initialProgress?.progress_pct || 0);
  const [isCompleted, setIsCompleted] = useState(!!initialProgress?.completed_at);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect Mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set initial time when player is ready
  const onCanPlay = () => {
    if (!isReady && initialProgress?.last_position_secs && initialProgress.last_position_secs > 5 && !isCompleted) {
      setShowResumePrompt(true);
      // Auto-hide prompt after 10 seconds if no action
      setTimeout(() => setShowResumePrompt(false), 10000);
    }
    setIsReady(true);
  };

  const resumeFromLast = () => {
    if (player.current) {
      // Prioritize the latest known position (either from DB or LocalStorage)
      const localKey = `video_progress_${lessonId}`;
      const localTime = localStorage.getItem(localKey);
      const dbTime = initialProgress?.last_position_secs || 0;
      const resumeTime = localTime ? Math.max(parseFloat(localTime), dbTime) : dbTime;

      player.current.currentTime = resumeTime;
      setShowResumePrompt(false);
      player.current.play();
    }
  };

  // Sync state and save progress
  useEffect(() => {
    let lastSavedTime = 0;
    
    const interval = setInterval(() => {
      if (player.current && !player.current.paused) {
        const { currentTime, duration } = player.current;
        if (duration > 0) {
          // Guard: Only update maxTime if they are watching linearly
          if (currentTime > maxTimeWatched.current && currentTime - maxTimeWatched.current <= 3) {
            maxTimeWatched.current = currentTime;
          }

          const pct = (currentTime / duration) * 100;
          setProgress(pct);

          // Local persistence (immediate)
          localStorage.setItem(`video_progress_${lessonId}`, currentTime.toString());

          // Database sync (every 10 seconds or 10% progress)
          if (Math.abs(currentTime - lastSavedTime) >= 10 || (pct - (initialProgress?.progress_pct || 0) >= 10)) {
            handleSaveProgress(currentTime, pct);
            lastSavedTime = currentTime;
          }

          // Complete if 98% watched
          if (pct >= 98 && !isCompleted) {
            handleComplete();
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lessonId, isCompleted]);

  const handleSaveProgress = async (secs: number, pct: number) => {
    try {
      await saveVideoProgress(lessonId, secs, pct);
    } catch (err) {
      console.error('[VideoPlayer] Sync Error:', err);
    }
  };

  const handleComplete = async () => {
    setIsCompleted(true);
    localStorage.removeItem(`video_progress_${lessonId}`); // Clean up local on completion
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
    // Strictly block forward seeking beyond what was already watched
    if (targetTime > maxTimeWatched.current + 2 && !isCompleted) {
      player.current.currentTime = maxTimeWatched.current;
      setShowSkipWarning(true);
      setTimeout(() => setShowSkipWarning(false), 3000);
    }
  };

  return (
    <div className={cn("relative group/player w-full select-none", className)}>
      {/* Background Visual Depth (Dynamic Aura) */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              background: 'radial-gradient(circle at center, rgba(79, 70, 229, 0.05) 0%, rgba(15, 23, 42, 0) 70%)'
            }}
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "relative z-10 transition-all duration-700",
        isMobile ? "mx-[-1.5rem] rounded-none" : "rounded-[2.5rem] p-1 bg-slate-900 shadow-2xl overflow-hidden shadow-indigo-500/10 border border-white/5"
      )}>
        {/* Main Player Container */}
        <div className={cn(
          "relative aspect-video bg-black overflow-hidden",
          !isMobile && "rounded-[2.2rem]"
        )}>
          <MediaPlayer
            ref={player}
            title="Curriculum Content"
            src={src}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => !isCompleted && handleComplete()}
            onSeeking={onSeeking}
            onCanPlay={onCanPlay}
            className="w-full h-full"
            playsInline
            crossOrigin
          >
            <MediaProvider>
              {poster && <Poster src={poster} alt="Lesson Thumbnail" className="object-cover w-full h-full" />}
            </MediaProvider>
            
            <DefaultVideoLayout icons={defaultLayoutIcons} />

            {/* Resume Callout */}
            <AnimatePresence>
              {showResumePrompt && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-6"
                >
                  <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-5 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
                        <RotateCcw size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Welcome Back</p>
                        <p className="text-[10px] font-bold text-white/60 uppercase">Resume where you left off?</p>
                      </div>
                    </div>
                    <button 
                      onClick={resumeFromLast}
                      className="bg-white text-slate-950 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-colors"
                    >
                      Resume
                    </button>
                    <button onClick={() => setShowResumePrompt(false)} className="text-white/40 hover:text-white transition-colors">
                      <Zap size={14} className="rotate-45" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skip Restriction Alert */}
            <AnimatePresence>
              {showSkipWarning && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="bg-slate-900 border border-white/10 p-8 rounded-[3rem] text-center max-w-xs shadow-2xl"
                  >
                    <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto mb-6">
                      <Lock size={32} strokeWidth={3} />
                    </div>
                    <h5 className="text-xl font-black text-white uppercase tracking-tight mb-2">Focus Mode</h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      Skipping forward is restricted to ensure you master the entire curriculum.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </MediaPlayer>
        </div>
      </div>

      {/* Floating Meta Bar (Mobile Optimized) */}
      <div className={cn(
        "mt-8 flex flex-col md:flex-row items-stretch md:items-center gap-6",
        isMobile && "px-2"
      )}>
        {/* Progress Card */}
        <div className="flex-1 bg-white border border-slate-100 p-6 md:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 flex items-center gap-6">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center border-2 shrink-0 transition-colors",
            isCompleted ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-indigo-50 border-indigo-100 text-indigo-600"
          )}>
            {isCompleted ? <CheckCircle2 size={32} strokeWidth={2.5} /> : <Zap size={32} fill="currentColor" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-end justify-between mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest line-clamp-1">
                {isCompleted ? 'Resource Mastered' : 'Acquiring Knowledge'}
              </p>
              <p className="text-xl font-black text-slate-900 leading-none">{Math.round(progress)}%</p>
            </div>
            <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  isCompleted ? "bg-emerald-500" : "bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                )}
              />
            </div>
          </div>
        </div>

        {/* Security / Info Mini Cards */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-4 group hover:border-indigo-500/30 transition-all cursor-help shrink-0">
            <ShieldCheck size={24} className="text-indigo-400" />
            <div className="hidden sm:block">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Secure View</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase leading-none">Anti-Skip Active</p>
            </div>
          </div>

          <button 
            onClick={handleSeekBack}
            className="h-full px-8 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:shadow-xl hover:scale-105 active:scale-95 group"
          >
            <RotateCcw size={24} className="group-hover:-rotate-45 transition-transform" />
            <span className="ml-3 text-[10px] font-black uppercase tracking-widest hidden sm:inline">Rewind</span>
          </button>
        </div>
      </div>

      {/* Mobile Connectivity Tip */}
      {isMobile && !isPlaying && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3"
        >
          <Smartphone size={16} className="text-amber-500" />
          <p className="text-[9px] font-bold text-amber-700 uppercase tracking-tight">
            Switch to landscape for an immersive full-screen experience
          </p>
        </motion.div>
      )}
    </div>
  );
}
