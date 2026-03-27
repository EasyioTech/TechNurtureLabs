'use client';

/**
 * VideoPlayer — Renders a regular (non-Cloudflare) video via Vidstack.
 *
 * Features:
 * - Auto-resume from last saved position
 * - Progress sync to DB every 10 s
 * - No-skip enforcement: forward seeks beyond watched position are blocked
 * - Auto-complete when video ends
 * - Manual "Mark Complete" fallback button at ≥90% watch time
 * - Fullscreen → landscape lock on mobile
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
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

  // Highest legitimately-watched position — used for no-skip and DB flush
  const maxWatchedRef = useRef<number>(initialProgress?.last_position_secs || 0);
  const completedRef = useRef(!!initialProgress?.completed_at);

  // ── Fire completion exactly once ──────────────────────────────────────────
  const fireComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.(true);
  }, [onComplete]);

  // ── Auto-resume ───────────────────────────────────────────────────────────
  const onCanPlay = useCallback(() => {
    if (!isReady && initialProgress?.last_position_secs && initialProgress.last_position_secs > 10 && !completedRef.current) {
      if (player.current) {
        player.current.currentTime = initialProgress.last_position_secs;
      }
    }
    setIsReady(true);
  }, [isReady, initialProgress]);

  // ── Progress sync every 10 s ──────────────────────────────────────────────
  useEffect(() => {
    if (completedRef.current || !isReady) return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function syncProgress() {
      if (!player.current) return;
      const ct: number = player.current.currentTime;
      const duration: number = player.current.duration;
      if (!duration || duration <= 0) return;

      // Track max watched position
      maxWatchedRef.current = Math.max(maxWatchedRef.current, ct);

      const pct = Math.min(100, Math.floor((ct / duration) * 100));

      // Only write to DB while actively playing
      if (player.current.paused) return;

      saveVideoProgress(lessonId, ct, pct).catch(() => {
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(() => {
          saveVideoProgress(lessonId, ct, pct).catch(() => {});
        }, 3_000);
      });
    }

    const interval = setInterval(syncProgress, 10_000);

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') syncProgress();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [lessonId, isReady]);

  // ── No-skip enforcement via onSeeked ─────────────────────────────────────
  // When the player finishes seeking, check if the new position is ahead of
  // the furthest position legitimately watched.  If so, reset to maxWatched.
  const handleSeeked = useCallback(() => {
    if (!player.current || completedRef.current) return;
    const ct: number = player.current.currentTime;
    // Allow 3-second buffer for small forward skips (buffering, resume, etc.)
    const allowed = maxWatchedRef.current + 3;
    if (ct > allowed) {
      player.current.currentTime = maxWatchedRef.current;
    }
  }, []);

  // ── Track max position on every time update ───────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    if (!player.current || completedRef.current) return;
    const ct: number = player.current.currentTime;
    const duration: number = player.current.duration;
    if (!duration || duration <= 0) return;

    maxWatchedRef.current = Math.max(maxWatchedRef.current, ct);
  }, []);

  // ── Video ended → complete ────────────────────────────────────────────────
  const handleEnded = useCallback(() => {
    if (!player.current) return;
    const duration: number = player.current.duration;
    if (duration > 0 && !completedRef.current) {
      // Flush final position
      saveVideoProgress(lessonId, duration, 100).catch(() => {});
    }
    fireComplete();
  }, [lessonId, fireComplete]);

  // ── Fullscreen → landscape lock on mobile ────────────────────────────────
  useEffect(() => {
    function handleFullscreenChange() {
      const isFS = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      try {
        if (isFS) {
          (screen.orientation as any)?.lock?.('landscape').catch?.(() => {});
        } else {
          screen.orientation?.unlock?.();
        }
      } catch {}
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

  return (
    <div className={cn('w-full overflow-hidden bg-black', className)}>
      {/* Player */}
      <div className="relative aspect-video w-full">
        <MediaPlayer
          ref={player}
          src={src}
          onEnded={handleEnded}
          onCanPlay={onCanPlay}
          onSeeked={handleSeeked}
          onTimeUpdate={handleTimeUpdate}
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
    </div>
  );
}
