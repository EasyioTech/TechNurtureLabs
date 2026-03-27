'use client';

/**
 * CloudflareStreamPlayer — Renders a Cloudflare Stream video via iframe embed.
 *
 * Features:
 * - Adaptive bitrate streaming (HLS/DASH) via Cloudflare
 * - Progress tracking via postMessage API (uses data.time — Cloudflare's actual field)
 * - Duration capture from loadedmetadata event
 * - No-skip enforcement: forward seeks beyond watched position are blocked
 * - Auto-complete when video ends OR when ≥95% is watched
 * - Manual "Mark Complete" fallback button at ≥90% watch time
 * - Auto-resume from last saved position
 * - Fullscreen → landscape lock on mobile
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Lock } from 'lucide-react';
import { saveVideoProgress } from '@/modules/student/actions/lesson-actions';

interface CloudflareStreamPlayerProps {
    uid: string;
    lessonId?: string;
    initialProgress?: {
        last_position_secs: number;
        progress_pct: number;
        completed_at: any;
        verified_watch_seconds?: number;
    } | null;
    onComplete?: (isVideo?: boolean) => void;
    className?: string;
}

export function CloudflareStreamPlayer({
    uid,
    lessonId,
    initialProgress,
    onComplete,
    className,
}: CloudflareStreamPlayerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [isCompleted, setIsCompleted] = useState(!!initialProgress?.completed_at);
    const [verifiedProgress, setVerifiedProgress] = useState(initialProgress?.progress_pct || 0);
    const [skipBlocked, setSkipBlocked] = useState(false);

    // Refs kept outside React state so they're readable inside message handlers
    // without stale-closure issues and without triggering re-renders.
    const completedRef = useRef(!!initialProgress?.completed_at);
    // Highest video position the student has legitimately watched
    const maxWatchedRef = useRef<number>(initialProgress?.last_position_secs || 0);
    // Video duration — populated from loadedmetadata or the first timeupdate that includes it
    const durationRef = useRef<number>(0);

    // Build embed URL with optional resume timestamp
    const startTimeSecs =
        !completedRef.current &&
        initialProgress?.last_position_secs &&
        initialProgress.last_position_secs > 10
            ? Math.floor(initialProgress.last_position_secs)
            : 0;

    const embedUrl = [
        `https://iframe.videodelivery.net/${uid}`,
        `?autoplay=false&preload=auto&enableIframeApi=true`,
        startTimeSecs ? `&startTime=${startTimeSecs}` : '',
    ].join('');

    // ── Seek the Cloudflare iframe to a given time ──────────────────────────
    const seekIframeTo = useCallback((time: number) => {
        try {
            // Cloudflare Stream accepts {seek: number} postMessages
            iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ seek: time }), '*');
        } catch {}
    }, []);

    // ── Fire lesson completion exactly once ─────────────────────────────────
    const fireComplete = useCallback(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        setIsCompleted(true);
        onComplete?.(true);
    }, [onComplete]);

    // ── postMessage listener from Cloudflare iframe ─────────────────────────
    useEffect(() => {
        if (completedRef.current || !lessonId) return;

        let lastDbSync = 0;

        function handleMessage(event: MessageEvent) {
            // Only accept messages from Cloudflare origins
            if (
                !event.origin.includes('videodelivery.net') &&
                !event.origin.includes('cloudflarestream.com')
            ) return;

            try {
                const raw = event.data;
                const data: any = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (!data || typeof data !== 'object') return;

                // ── Capture duration ──────────────────────────────────────
                // Cloudflare sends duration in loadedmetadata; also sometimes in timeupdate
                if (data.duration && data.duration > 0) {
                    durationRef.current = data.duration;
                }

                // ── timeupdate ────────────────────────────────────────────
                // Cloudflare Stream uses `data.time`, NOT `data.currentTime`
                const ct: number | null = data.time ?? data.currentTime ?? null;

                if (data.type === 'timeupdate' && ct !== null) {
                    const duration = durationRef.current;

                    // ── No-skip enforcement ───────────────────────────────
                    // Allow up to 3 seconds ahead of maxWatched (covers normal
                    // playback gaps between timeupdate events and resume offsets).
                    const allowedMax = maxWatchedRef.current + 3;

                    if (!completedRef.current && ct > allowedMax) {
                        // Student tried to skip forward — push them back
                        seekIframeTo(maxWatchedRef.current);
                        // Show brief on-screen indicator
                        setSkipBlocked(true);
                        setTimeout(() => setSkipBlocked(false), 1800);
                        return; // discard this position update
                    }

                    // Legitimate position — advance the watermark
                    maxWatchedRef.current = Math.max(maxWatchedRef.current, ct);

                    // Update progress percentage for UI and DB
                    if (duration > 0) {
                        const pct = Math.min(100, Math.floor((ct / duration) * 100));
                        setVerifiedProgress(prev => Math.max(prev, pct));

                        // Throttled DB save (at most once every 10 s)
                        const now = Date.now();
                        if (now - lastDbSync > 10_000) {
                            lastDbSync = now;
                            saveVideoProgress(lessonId!, ct, pct).catch(() => {});
                        }

                        // Auto-complete fallback: if 95 %+ watched and ended never fired
                        if (pct >= 95) {
                            fireComplete();
                        }
                    }
                }

                // ── Video ended ───────────────────────────────────────────
                if (data.type === 'ended' || data.event === 'ended') {
                    // Save final position before completing
                    const dur = durationRef.current;
                    if (dur > 0 && lessonId) {
                        saveVideoProgress(lessonId, dur, 100).catch(() => {});
                    }
                    fireComplete();
                }
            } catch {
                // Ignore parse errors from unrelated postMessages
            }
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    // fireComplete and seekIframeTo are stable (useCallback with no deps that change)
    }, [lessonId, fireComplete, seekIframeTo]);

    // ── Flush progress when tab is hidden ───────────────────────────────────
    useEffect(() => {
        if (!lessonId) return;

        function handleVisibilityChange() {
            if (document.visibilityState === 'hidden' && maxWatchedRef.current > 0 && !completedRef.current) {
                const dur = durationRef.current || 1;
                const pct = Math.min(100, Math.floor((maxWatchedRef.current / dur) * 100));
                saveVideoProgress(lessonId!, maxWatchedRef.current, pct).catch(() => {});
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [lessonId]);

    // ── Fullscreen → landscape lock on mobile ───────────────────────────────
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
            {/* Video iframe */}
            <div className="relative aspect-video w-full">
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="lazy"
                />

                {/* Skip-blocked toast overlay */}
                {skipBlocked && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm text-white px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl border border-white/10">
                            <Lock size={13} />
                            Please watch the video in order
                        </div>
                    </div>
                )}
            </div>

            {/* Below-video status bar */}
            <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between gap-4">
                {/* Progress pip */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${verifiedProgress}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 tabular-nums flex-shrink-0">
                        {verifiedProgress}%
                    </span>
                </div>

                {/* No-skip hint */}
                {!isCompleted && (
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
                        <Lock size={9} /> No skip
                    </span>
                )}

                {/* Manual complete fallback (≥90% watched, auto-complete at 95% may not have fired) */}
                {!isCompleted && verifiedProgress >= 90 && lessonId && (
                    <button
                        onClick={() => fireComplete()}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        <CheckCircle2 size={12} />
                        Complete
                    </button>
                )}

                {/* Completed badge */}
                {isCompleted && (
                    <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/40 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 size={12} />
                        Done
                    </span>
                )}
            </div>
        </div>
    );
}
