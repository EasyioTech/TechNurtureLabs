'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type PauseReason = 'tab_hidden' | null;

const timerKey = (id: string) => `tnl_timer_${id}`;
const doneKey  = (id: string) => `tnl_timer_done_${id}`;
const startedKey = (id: string) => `tnl_timer_started_${id}`;

export interface UseLessonTimerReturn {
  timeLeft:    number;        // seconds remaining
  elapsed:     number;        // seconds elapsed so far
  isComplete:  boolean;       // timer reached 0
  isPaused:    boolean;       // currently paused
  pauseReason: PauseReason;   // why it paused
  hasStarted:  boolean;       // instruction modal dismissed
  start:       () => void;    // call after modal dismissed
}

export function useLessonTimer({
  lessonId,
  durationMinutes,
  isAlreadyComplete,
}: {
  lessonId:          string;
  durationMinutes:   number;  // 0 means "no timer"
  isAlreadyComplete: boolean;
}): UseLessonTimerReturn {
  const totalSeconds = durationMinutes * 60;

  const [hasStarted,  setHasStarted]  = useState(false);
  const [elapsed,     setElapsed]     = useState(0);
  const [isComplete,  setIsComplete]  = useState(isAlreadyComplete);
  const [isPaused,    setIsPaused]    = useState(false);
  const [pauseReason, setPauseReason] = useState<PauseReason>(null);
  const [isHydrated,  setIsHydrated]  = useState(false);

  // Mirror elapsed in a ref so the interval callback always reads fresh value
  const elapsedRef  = useRef(0);
  const pausedRef   = useRef(false);   // avoid double pause/resume from blur+visibilitychange

  // ── Bootstrap from localStorage (runs once, client-only) ─────────────────
  useEffect(() => {
    if (isAlreadyComplete || !durationMinutes) {
      setIsHydrated(true);
      return;
    }

    try {
      // Check if timer was already marked complete
      if (localStorage.getItem(doneKey(lessonId)) === '1') {
        setIsComplete(true);
        setIsHydrated(true);
        return;
      }

      // Restore elapsed time from previous session
      const raw = localStorage.getItem(timerKey(lessonId));
      if (raw) {
        const parsed = JSON.parse(raw);
        const stored = Math.min(parsed.elapsed ?? 0, totalSeconds);

        // Validate stored value is reasonable (0 to totalSeconds)
        if (stored >= 0 && stored <= totalSeconds) {
          elapsedRef.current = stored;
          setElapsed(stored);
        }
      }

      // Restore whether timer was already started in a previous session
      if (localStorage.getItem(startedKey(lessonId)) === '1') {
        setHasStarted(true);
      }
    } catch {
      // localStorage unavailable – start fresh, but don't break
      console.warn('Timer: localStorage unavailable, starting fresh');
    } finally {
      setIsHydrated(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // ── Mark complete ─────────────────────────────────────────────────────────
  const complete = useCallback(() => {
    setIsComplete(true);
    try {
      // Mark as complete and clean up intermediate state
      localStorage.setItem(doneKey(lessonId), '1');
      // Keep elapsed time for analytics, but clear the "started" flag since it's done
      localStorage.removeItem(startedKey(lessonId));
    } catch {
      // localStorage unavailable, but continue anyway
      console.warn('Timer: could not persist completion state');
    }
    window.dispatchEvent(
      new CustomEvent('tnl:timer-done', { detail: { lessonId } })
    );
  }, [lessonId]);

  // ── Pause / resume ────────────────────────────────────────────────────────
  const pause = useCallback((reason: PauseReason) => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    setIsPaused(true);
    setPauseReason(reason);

    // Persist pause state so we know what happened if user force-closes
    try {
      localStorage.setItem(
        timerKey(lessonId),
        JSON.stringify({
          elapsed: elapsedRef.current,
          paused: true,
          pauseReason: reason,
          pausedAt: new Date().toISOString(),
        })
      );
    } catch {
      // localStorage unavailable, continue anyway
    }
  }, [lessonId]);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setIsPaused(false);
    setPauseReason(null);

    // Update storage to show timer resumed
    try {
      localStorage.setItem(
        timerKey(lessonId),
        JSON.stringify({ elapsed: elapsedRef.current })
      );
    } catch {
      // localStorage unavailable, continue anyway
    }
  }, [lessonId]);

  // ── Tick interval ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || isComplete || isPaused || !durationMinutes || !isHydrated) return;

    const id = setInterval(() => {
      const next = elapsedRef.current + 1;
      elapsedRef.current = next;

      try {
        localStorage.setItem(timerKey(lessonId), JSON.stringify({ elapsed: next }));
      } catch {
        // localStorage unavailable, continue ticking anyway
      }

      setElapsed(next);

      if (next >= totalSeconds) {
        clearInterval(id);
        complete();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [hasStarted, isComplete, isPaused, durationMinutes, isHydrated, lessonId, totalSeconds, complete]);

  // ── Visibility & focus guards ─────────────────────────────────────────────
  // IMPORTANT: Only pause/resume based on document visibility, NOT window focus.
  // This prevents pausing when student opens DevTools, switches windows, etc.
  // The lesson timer only pauses when the browser tab itself is hidden.
  useEffect(() => {
    if (!hasStarted || isComplete || !durationMinutes || !isHydrated) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pause('tab_hidden');
      } else {
        // Tab came back into view — resume only if we were previously paused
        if (isPaused && pauseReason === 'tab_hidden') {
          resume();
          // Optionally notify the student via custom event
          window.dispatchEvent(
            new CustomEvent('tnl:timer-resumed', { detail: { lessonId } })
          );
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hasStarted, isComplete, durationMinutes, isHydrated, isPaused, pauseReason, lessonId, pause, resume]);

  const start = useCallback(() => {
    setHasStarted(true);
    // Persist that timer was started so it resumes on reload
    try {
      localStorage.setItem(startedKey(lessonId), '1');
    } catch {
      // localStorage unavailable, continue anyway
    }
  }, [lessonId]);

  // ── Clean up on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Ensure final elapsed time is persisted on unmount
      try {
        if (!isComplete && hasStarted) {
          localStorage.setItem(
            timerKey(lessonId),
            JSON.stringify({ elapsed: elapsedRef.current })
          );
        }
      } catch {
        // localStorage unavailable
      }
    };
  }, [lessonId, isComplete, hasStarted]);

  return {
    timeLeft:    Math.max(0, totalSeconds - elapsed),
    elapsed,
    isComplete,
    isPaused,
    pauseReason,
    hasStarted,
    start,
  };
}
