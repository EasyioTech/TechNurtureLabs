'use client';

import React, { useRef, useState, useEffect } from 'react';
import { MediaPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, Play, RotateCcw, FastForward, 
  Info, Lock as LockIcon, ShieldCheck, Zap, Maximize, 
  Settings, Volume2, Timer, Smartphone, ChevronRight, Trophy
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
export function VideoPlayer({ src: initialSrc, poster, lessonId, initialProgress, onComplete, className }: VideoPlayerProps) {
  const player = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const nonceRef = useRef(0);
  const maxTimeWatched = useRef(initialProgress?.last_position_secs || 0);
  const [progress, setProgress] = useState(initialProgress?.progress_pct || 0);
  const [verifiedProgress, setVerifiedProgress] = useState(initialProgress?.progress_pct || 0);
  const [isCompleted, setIsCompleted] = useState(!!initialProgress?.completed_at);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  // 1. Session Initialization
  useEffect(() => {
    const init = async () => {
      try {
        const response = await fetch('/api/learning/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSessionToken(data.sessionToken);
          // Set source to the protected streaming proxy
          setSource(`/api/video/stream/${lessonId}?token=${data.sessionToken}`);
        }
      } catch (err) {
        console.error('[VideoPlayer] Session Init Error:', err);
      }
    };

    init();
    
    // Cleanup active session on unmount or lesson change
    return () => {
      // Background sync would be handled by the server on session expiration
    };
  }, [lessonId]);

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
      setTimeout(() => setShowResumePrompt(false), 10000);
    }
    setIsReady(true);
  };

  const resumeFromLast = () => {
    if (player.current) {
      const dbTime = initialProgress?.last_position_secs || 0;
      player.current.currentTime = dbTime;
      setShowResumePrompt(false);
      player.current.play();
    }
  };

  // 2. Heartbeat Sentinel (Every 15 Seconds)
  useEffect(() => {
    if (!sessionToken || isCompleted) return;

    const sendHeartbeat = async () => {
        if (!player.current || player.current.paused) return;

        const { currentTime, paused, playbackRate: currentRate } = player.current;
        const playerState = paused ? 'PAUSED' : 'PLAYING';
        
        nonceRef.current += 1;

        try {
            const res = await fetch('/api/learning/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionToken,
                    nonce: nonceRef.current,
                    playbackTime: currentTime,
                    playbackRate: currentRate,
                    playerState,
                    videoDuration: player.current.duration
                })
            });

            if (!res.ok) {
                const error = await res.json();
                if (error.code === 'SKIP_REJECTED' && error.resumeTo !== undefined) {
                    player.current.currentTime = error.resumeTo;
                    setShowSkipWarning(true);
                    setTimeout(() => setShowSkipWarning(false), 3000);
                } else if (error.code === 'SESSION_EXPIRED' || error.code === 'SECURITY_BREACH') {
                    // Force refresh or show error
                    window.location.reload();
                }
            } else {
                const data = await res.json();
                // Update verified progress from server source of truth
                if (player.current.duration) {
                   const vPct = Math.min(100, Math.floor((data.verifiedSeconds / player.current.duration) * 100));
                   setVerifiedProgress(vPct);
                }
            }
        } catch (err) {
            console.error('[Heartbeat] Network error:', err);
        }
    };

    const interval = setInterval(sendHeartbeat, 15000); // Tighter 15s resolution

    // Also expose to ref so we can trigger final heartbeat
    (window as any)._sendFinalHeartbeat = sendHeartbeat;

    return () => clearInterval(interval);
  }, [sessionToken, isCompleted, lessonId]);

  // 3. Visual Progress Sync (Smooth UI)
  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (player.current && !player.current.paused && player.current.duration) {
        const { currentTime, duration } = player.current;
        setProgress((currentTime / duration) * 100);
        
        // Locally tracking max time for skip protection
        if (currentTime > maxTimeWatched.current && currentTime - maxTimeWatched.current < 2) {
          maxTimeWatched.current = currentTime;
        }
      }
    }, 1000);
    return () => clearInterval(updateInterval);
  }, []);

  // Guard: Locally block skips before heartbeat catches them (UX optimization)
  const onSeeking = (event: any) => {
    if (isCompleted) return;
    const targetTime = event?.detail ?? player.current?.currentTime ?? 0;
    
    if (targetTime > maxTimeWatched.current + 3) {
      player.current.currentTime = maxTimeWatched.current;
      setShowSkipWarning(true);
      setTimeout(() => setShowSkipWarning(false), 3000);
    }
  };

  const onVideoEnded = async () => {
    if (isCompleted) return;
    
    // 1. Send final heartbeat to capture the last segment of time
    if ((window as any)._sendFinalHeartbeat) {
        await (window as any)._sendFinalHeartbeat();
    }
    
    // 2. Show completion overlay
    setShowCompletionOverlay(true);
  };

  const handleComplete = async () => {
    if (!sessionToken || isCompleted) return;
    
    setIsSubmitting(true);
    setCompletionError(null);
    try {
      const response = await fetch('/api/learning/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, sessionToken })
      });
      
      const data = await response.json();

      if (response.ok) {
        setIsCompleted(true);
        setShowCompletionOverlay(false);
        if (onComplete) onComplete();
      } else {
        setCompletionError(data.error || "Threshold not met. Keep watching!");
      }
    } catch (err) {
      console.error('[VideoPlayer] Completion Error:', err);
      setCompletionError("Connection lost. Retrying sync...");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeekBack = () => {
    if (player.current) {
      player.current.currentTime = Math.max(0, player.current.currentTime - 10);
      // Update maxTimeWatched immediately on seek back to avoid confusion
      maxTimeWatched.current = player.current.currentTime;
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
        "relative z-10 transition-all duration-700 w-full overflow-hidden",
        isMobile ? "mx-[-1.5rem]" : "rounded-[2.5rem] border border-slate-200 shadow-3xl bg-white p-1.5"
      )}>
        {/* Main Player Container */}
        <div className={cn(
           "relative aspect-video w-full bg-black overflow-hidden",
           !isMobile && "rounded-[2.2rem]"
        )}>
          {source ? (
            <MediaPlayer
              ref={player}
              title="Curriculum Content"
              src={source}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={onVideoEnded}
              onSeeking={onSeeking}
              onCanPlay={onCanPlay}
              className="w-full h-full"
              playsInline
              crossOrigin
            >
              <MediaProvider>
                {poster && <Poster src={poster} alt="Lesson Thumbnail" className="object-cover w-full h-full" />}
                <Track
                  src=""
                  kind="subtitles"
                  label="English"
                  lang="en-US"
                  default
                />
              </MediaProvider>
              
              <DefaultVideoLayout icons={defaultLayoutIcons} />

              {/* Resume Prompt Overlay */}
              <AnimatePresence>
                {showResumePrompt && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
                  >
                    <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 p-5 rounded-3xl flex items-center justify-between gap-4 shadow-2xl">
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
                        <LockIcon size={32} strokeWidth={3} />
                      </div>
                      <h5 className="text-xl font-black text-white uppercase tracking-tight mb-2">Focus Mode</h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        Skipping forward is restricted to ensure you master the entire curriculum.
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lesson Completion Overlay */}
              <AnimatePresence>
                {showCompletionOverlay && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl"
                  >
                    <motion.div 
                      key="completion-card"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="max-w-md w-full p-12 text-center"
                    >
                      <div className="w-24 h-24 bg-emerald-500/10 rounded-[3rem] flex items-center justify-center text-emerald-500 mx-auto mb-10 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                        <Trophy size={48} />
                      </div>
                      
                      <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 leading-none">Lesson Concluded</h3>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10">
                        Strategic objectives achieved. Verified playback complete.
                      </p>

                      {completionError && (
                         <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest">
                            {completionError}
                         </div>
                      )}

                      <div className="flex flex-col gap-4">
                        {verifiedProgress >= 80 ? (
                          <button 
                            onClick={handleComplete}
                            disabled={isSubmitting}
                            className="w-full h-16 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                            {isSubmitting ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>Finalize & Complete <ChevronRight size={18} /></>
                            )}
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setShowCompletionOverlay(false);
                              if (player.current) player.current.play();
                            }}
                            className="w-full h-16 bg-slate-100 border border-slate-200 text-slate-600 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all"
                          >
                            Return to Playback
                          </button>
                        )}
                        
                        <button 
                          onClick={() => setShowCompletionOverlay(false)}
                          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </MediaPlayer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
                <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing...</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Meta Bar (Intelligence Bench) */}
      <div className="max-w-[1240px] mx-auto px-6">
        <div className={cn(
          "mt-8 flex flex-col lg:flex-row items-stretch gap-4 bg-white border border-slate-200 p-4 rounded-[3rem] shadow-2xl shadow-slate-200/40 transition-all",
          isMobile && "mx-2 rounded-[2rem]"
        )}>
          {/* Progress Card Section */}
          <div className="flex-1 flex items-center gap-6 px-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 transition-colors shadow-sm",
              isCompleted ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-indigo-50 border-indigo-100 text-indigo-600"
            )}>
              {isCompleted ? <CheckCircle2 size={28} strokeWidth={2.5} /> : <Zap size={28} fill="currentColor" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-end justify-between mb-2">
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                    {isCompleted ? 'Resource Mastered' : 'Progress Status'}
                  </p>
                  <div className="flex items-center gap-3">
                     <div className={cn(
                       "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                       verifiedProgress >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                     )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", verifiedProgress >= 10 ? "bg-current animate-pulse" : "bg-slate-300")} />
                        Verified Playback: {verifiedProgress}%
                     </div>
                  </div>
                </div>
                <p className="text-xl font-black text-slate-900 leading-none tracking-tighter">{Math.round(progress)}%</p>
              </div>
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                {/* Visual Playhead Progress */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-300 z-10 relative",
                    isCompleted ? "bg-emerald-500" : "bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                  )}
                />
                {/* Ghost Verified Progress */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${verifiedProgress}%` }}
                  className="absolute inset-0 bg-emerald-500/10 rounded-full z-0 transition-all duration-1000"
                />
              </div>
            </div>
          </div>

          {/* Controls & Security Bench */}
          <div className="flex items-center gap-2 px-2 lg:px-4 lg:border-l border-slate-100">
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl group transition-all shrink-0">
              <ShieldCheck size={20} className="text-indigo-600" />
              <div className="hidden sm:block">
                <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-0.5">Secure View</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Vetted Active</p>
              </div>
            </div>

            <button 
              onClick={handleSeekBack}
              className="flex-1 lg:flex-none h-full px-8 py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 hover:border-indigo-200 transition-all active:scale-95 group shadow-sm"
            >
              <RotateCcw size={20} className="group-hover:-rotate-45 transition-transform" />
              <span className="ml-3 text-[9px] font-black uppercase tracking-widest hidden sm:inline text-slate-600">Rewind</span>
            </button>
          </div>
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
