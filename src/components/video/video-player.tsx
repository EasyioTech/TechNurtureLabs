'use client';

import React, { useRef, useState, useEffect } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
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
  const [isCompleted, setIsCompleted] = useState(!!initialProgress?.completed_at);
  const [verifiedProgress, setVerifiedProgress] = useState(initialProgress?.progress_pct || 0);

  // ── Auto-resume from last saved position ──────────────────────────────────
  const onCanPlay = () => {
    if (!isReady && initialProgress?.last_position_secs && initialProgress.last_position_secs > 10 && !isCompleted) {
      if (player.current) {
        player.current.currentTime = initialProgress.last_position_secs;
      }
    }
    setIsReady(true);
  };

  // ── Progress sync every 10 s (only while playing) ─────────────────────────
  useEffect(() => {
    if (isCompleted || !isReady) return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function syncProgress() {
      if (!player.current) return;
      const currentTime = player.current.currentTime;
      const duration = player.current.duration;
      if (!duration || duration <= 0) return;

      const pct = Math.floor((currentTime / duration) * 100);
      setVerifiedProgress(prev => Math.max(prev, pct));

      // Only save to DB while playing (not paused) to avoid spamming on pause
      if (player.current.paused) return;

      saveVideoProgress(lessonId, currentTime, pct).catch(() => {
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(() => {
          saveVideoProgress(lessonId, currentTime, pct).catch(() => {});
        }, 3000);
      });
    }

    const interval = setInterval(syncProgress, 10000);

    // Flush on tab hide (critical for mobile)
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') syncProgress();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [lessonId, isCompleted, isReady]);

  // ── Fullscreen → auto-rotate to landscape on mobile ───────────────────────
  useEffect(() => {
    function handleFullscreenChange() {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );

      if (isFullscreen) {
        try {
          // Lock landscape when entering fullscreen (Android + some browsers)
          (screen.orientation as any)?.lock?.('landscape').catch?.(() => {});
        } catch {}
      } else {
        try {
          screen.orientation?.unlock?.();
        } catch {}
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // ── Video ended → bubble up to lesson-client ──────────────────────────────
  const handleEnded = () => {
    if (isCompleted) return;
    setIsCompleted(true);
    onComplete?.(true);
  };

  return (
    <div className={cn('w-full overflow-hidden bg-black', className)}>
      <div className="relative aspect-video w-full">
        <MediaPlayer
          ref={player}
          src={src}
          onEnded={handleEnded}
          onCanPlay={onCanPlay}
          className="w-full h-full"
          playsInline
          key={src}
          crossOrigin={src.startsWith('http') ? 'anonymous' : 'use-credentials'}
        >
          <MediaProvider>
            {poster && <Poster src={poster} className="object-cover w-full h-full" />}
          </MediaProvider>
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </div>

      {/* Manual completion fallback — appears after 90% watch time if onEnded was missed */}
      {!isCompleted && verifiedProgress >= 90 && (
        <div className="bg-black px-4 py-3 flex items-center justify-end">
          <button
            onClick={() => {
              if (!isCompleted) {
                setIsCompleted(true);
                onComplete?.(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 size={14} />
            Mark Complete
          </button>
        </div>
      )}
    </div>
  );
}
