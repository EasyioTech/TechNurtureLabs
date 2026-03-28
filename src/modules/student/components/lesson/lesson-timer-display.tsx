'use client';

import { PauseCircle, Timer, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PauseReason } from '@/modules/student/hooks/use-lesson-timer';

interface Props {
  timeLeft:    number;       // seconds remaining
  totalSecs:   number;       // total lesson duration in seconds
  isComplete:  boolean;
  isPaused:    boolean;
  pauseReason: PauseReason;
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const PAUSE_LABELS: Record<NonNullable<PauseReason>, string> = {
  tab_hidden:     'Timer paused — return to this tab to continue',
};

export function LessonTimerDisplay({ timeLeft, totalSecs, isComplete, isPaused, pauseReason }: Props) {
  const pct        = totalSecs > 0 ? Math.max(0, (timeLeft / totalSecs) * 100) : 0;
  const isLow      = pct < 20;
  const isMid      = pct < 50;

  const barColor = isComplete
    ? 'bg-emerald-500'
    : isLow
      ? 'bg-red-500'
      : isMid
        ? 'bg-amber-500'
        : 'bg-indigo-500';

  const textColor = isComplete
    ? 'text-emerald-600'
    : isLow
      ? 'text-red-600'
      : isMid
        ? 'text-amber-600'
        : 'text-indigo-600';

  return (
    <div className="w-full bg-slate-50 border-b border-slate-100">
      {/* Progress bar */}
      <div className="h-1 bg-slate-200 w-full">
        <div
          className={cn('h-full transition-all duration-1000', barColor)}
          style={{ width: isComplete ? '100%' : `${100 - pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 py-2 max-w-[1100px] mx-auto w-full">

        {/* Left: icon + time */}
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 size={14} className="text-emerald-500" />
          ) : isPaused ? (
            <PauseCircle size={14} className="text-slate-400 animate-pulse" />
          ) : (
            <Timer size={14} className={cn('animate-pulse', textColor)} />
          )}

          <span className={cn('text-xs font-black tabular-nums tracking-widest', textColor)}>
            {isComplete ? 'Timer complete' : fmt(timeLeft)}
          </span>

          {!isComplete && (
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
              remaining
            </span>
          )}
        </div>

        {/* Right: pause reason or normal state */}
        <div className="text-right">
          {isComplete ? (
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
              Mark Done to earn XP
            </span>
          ) : isPaused && pauseReason ? (
            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest animate-pulse">
              {PAUSE_LABELS[pauseReason]}
            </span>
          ) : (
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Stay focused · Timer is running
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
