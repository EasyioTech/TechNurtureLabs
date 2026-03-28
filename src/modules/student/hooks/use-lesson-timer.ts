'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type PauseReason = 'tab_hidden' | null;

const timerKey = (id: string) => `tnl_timer_${id}`;
const doneKey  = (id: string) => `tnl_timer_done_${id}`;

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

  // Mirror elapsed in a ref so the interval callback always reads fresh value
  const elapsedRef  = useRef(0);
  const pausedRef   = useRef(false);   // avoid double pause/resume from blur+visibilitychange

  // ── Bootstrap from localStorage (runs once, client-only) ─────────────────
  useEffect(() => {
    if (isAlreadyComplete || !durationMinutes) return;
    try {
      if (localStorage.getItem(doneKey(lessonId)) === '1') {
        setIsComplete(true);
        return;
      }
      const raw = localStorage.getItem(timerKey(lessonId));
      if (raw) {
        const stored = Math.min(JSON.parse(raw).elapsed ?? 0, totalSeconds);
        elapsedRef.current = stored;
        setElapsed(stored);
      }
    } catch { /* storage unavailable – start fresh */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // ── Mark complete ─────────────────────────────────────────────────────────
  const complete = useCallback(() => {
    setIsComplete(true);
    try { localStorage.setItem(doneKey(lessonId), '1'); } catch {}
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
  }, []);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setIsPaused(false);
    setPauseReason(null);
  }, []);

  // ── Tick interval ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || isComplete || isPaused || !durationMinutes) return;

    const id = setInterval(() => {
      const next = elapsedRef.current + 1;
      elapsedRef.current = next;

      try {
        localStorage.setItem(timerKey(lessonId), JSON.stringify({ elapsed: next }));
      } catch {}

      setElapsed(next);

      if (next >= totalSeconds) {
        clearInterval(id);
        complete();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [hasStarted, isComplete, isPaused, durationMinutes, lessonId, totalSeconds, complete]);

  // ── Visibility & focus guards ─────────────────────────────────────────────
  useEffect(() => {
    if (!hasStarted || isComplete || !durationMinutes) return;

    const onVisibility = () => {
      document.visibilityState === 'hidden'
        ? pause('tab_hidden')
        : resume();
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hasStarted, isComplete, durationMinutes, pause, resume]);

  const start = useCallback(() => setHasStarted(true), []);

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
