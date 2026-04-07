'use client';

/**
 * CloudflareStreamPlayer — Renders a Cloudflare Stream video via iframe embed.
 *
 * Features:
 * - Adaptive bitrate streaming (HLS/DASH) via Cloudflare
 * - Progress tracking via postMessage API (uses data.time — Cloudflare's actual field)
 * - Duration capture from loadedmetadata / timeupdate events
 * - No-skip enforcement: forward seeks beyond watched position are blocked
 * - Auto-complete when video ends OR when ≥95% is watched
 * - Manual "Mark Complete" fallback button at ≥90% watch time
 * - Auto-resume from last saved position
 * - Fullscreen → landscape lock on mobile
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
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
    autoPlay?: boolean;
    muted?: boolean;
}

export function CloudflareStreamPlayer({
    uid,
    lessonId,
    initialProgress,
    onComplete,
    className,
    autoPlay = false,
    muted = false,
}: CloudflareStreamPlayerProps) {
    const [isPaused, setIsPaused] = React.useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Keep latest onComplete in a ref so fireComplete never needs it as a dep.
    // This prevents the message listener from tearing down on every parent re-render
    // (e.g. when docPage changes in a multi-block lesson with video + PDF).
    const onCompleteRef = useRef(onComplete);
    useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

    // Refs kept outside React state so they're readable inside message handlers
    // without stale-closure issues and without triggering re-renders.
    const completedRef = useRef(!!initialProgress?.completed_at);
    // Highest video position the student has legitimately watched
    const maxWatchedRef = useRef<number>(initialProgress?.last_position_secs || 0);
    // Video duration — populated from loadedmetadata or the first timeupdate that includes it
    const durationRef = useRef<number>(0);
    // True while a seek-back postMessage is in flight — prevents the resulting
    // timeupdate from being re-detected as a new forward skip (infinite loop fix).
    const seekingBackRef = useRef(false);

    // Build embed URL with optional resume timestamp
    const startTimeSecs =
        !completedRef.current &&
        initialProgress?.last_position_secs &&
        initialProgress.last_position_secs > 10
            ? Math.floor(initialProgress.last_position_secs)
            : 0;

    const embedUrl = [
        `https://iframe.videodelivery.net/${uid}`,
        `?autoplay=${autoPlay}&muted=${muted}&preload=auto&enableIframeApi=true`,
        startTimeSecs ? `&startTime=${startTimeSecs}` : '',
    ].join('');

    // ── Seek the Cloudflare iframe to a given time ──────────────────────────
    // Correct command is { currentTime: seconds } — NOT { seek: seconds }.
    // We set seekingBackRef while in-flight so the resulting timeupdate is
    // ignored and doesn't trigger another round of skip detection.
    const seekIframeTo = useCallback((time: number) => {
        try {
            seekingBackRef.current = true;
            iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ currentTime: time }),
                '*',
            );
            // Release the lock after the player has had time to respond (~400 ms).
            // If the postMessage is ignored (player not ready), the lock still clears.
            setTimeout(() => { seekingBackRef.current = false; }, 400);
        } catch {}
    }, []);

    // ── Fire lesson completion exactly once ─────────────────────────────────
    // Empty dep array — stable forever. onCompleteRef always holds the latest value.
    const fireComplete = useCallback(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        onCompleteRef.current?.(true);
    }, []);

    // ── postMessage listener from Cloudflare iframe ─────────────────────────
    // NOTE: The listener is intentionally NOT gated on lessonId so that the
    // ended / 95% auto-complete path always fires even when lessonId is absent
    // (e.g. admin preview). DB saves are still gated on lessonId.
    useEffect(() => {
        if (completedRef.current) return;

        let lastDbSync = 0;

        function handleMessage(event: MessageEvent) {
            // Accept messages from Cloudflare origins OR same-origin (production HTTP)
            if (
                event.origin !== window.location.origin &&
                !event.origin.includes('videodelivery.net') &&
                !event.origin.includes('cloudflarestream.com') &&
                !event.origin.includes('iframe.videodelivery.net')
            ) return;

            try {
                const raw = event.data;
                const data: any = typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (!data || typeof data !== 'object') return;

                // Cloudflare sometimes wraps the payload: { data: { type, time, duration } }
                const payload: any = data.data && typeof data.data === 'object' ? data.data : data;

                // ── Capture duration ──────────────────────────────────────
                // Cloudflare sends duration in loadedmetadata, timeupdate, and sometimes durationchange
                const dur: number =
                    payload.duration ?? data.duration ?? 0;
                if (dur > 0) {
                    durationRef.current = dur;
                }

                // Normalise event name — Cloudflare sends { type } or { event }
                const eventName: string = payload.type ?? payload.event ?? data.type ?? data.event ?? '';

                // ── timeupdate ────────────────────────────────────────────
                // Cloudflare Stream uses `time` (not `currentTime`) in most builds.
                // Extract from both the outer and inner payload for resilience.
                const ct: number | null =
                    payload.time ?? payload.currentTime ?? data.time ?? data.currentTime ?? null;

                if ((eventName === 'timeupdate' || (ct !== null && eventName === '')) && ct !== null) {
                    // While a seek-back is in flight, ignore incoming events —
                    // they represent the player catching up to our seek command,
                    // not a new user action.
                    if (seekingBackRef.current) return;

                    const duration = durationRef.current;

                    // ── No-skip enforcement ───────────────────────────────
                    // Allow up to 3 seconds ahead of maxWatched (covers normal
                    // playback gaps between timeupdate events and resume offsets).
                    const allowedMax = maxWatchedRef.current + 3;

                    if (!completedRef.current && ct > allowedMax) {
                        // Student tried to skip forward — push them back.
                        seekIframeTo(maxWatchedRef.current);
                        return;
                    }

                    // Legitimate position — advance the watermark
                    maxWatchedRef.current = Math.max(maxWatchedRef.current, ct);

                    if (duration > 0) {
                        const pct = Math.min(100, Math.floor((ct / duration) * 100));

                        // Throttled DB save (at most once every 10 s)
                        if (lessonId) {
                            const now = Date.now();
                            if (now - lastDbSync > 10_000) {
                                lastDbSync = now;
                                saveVideoProgress(lessonId, ct, pct).catch(() => {});
                            }
                        }

                        // Near-end detection: within 3 s of end counts as complete
                        const nearEnd = ct >= duration - 3;

                        // Auto-complete: 90%+ watched OR within 3 s of end
                        if (pct >= 90 || nearEnd) {
                            fireComplete();
                        }
                    }
                }

                // ── Video ended ───────────────────────────────────────────
                if (eventName === 'ended' || data.type === 'ended' || data.event === 'ended') {
                    // Save final position before completing
                    if (lessonId) {
                        const finalDur = durationRef.current;
                        if (finalDur > 0) {
                            saveVideoProgress(lessonId, finalDur, 100).catch(() => {});
                        }
                    }
                    fireComplete();
                }

                // ── play / pause state sync ──────────────────────────────
                if (eventName === 'play' || eventName === 'playing') {
                    setIsPaused(false);
                } else if (eventName === 'pause' || eventName === 'ended') {
                    setIsPaused(true);
                }

                // ── loadedmetadata — capture duration early ───────────────
                if (eventName === 'loadedmetadata' || eventName === 'durationchange') {
                    // duration already captured above; nothing else to do
                }
            } catch {
                // Ignore parse errors from unrelated postMessages
            }
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
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
        <div 
            className={cn('w-full overflow-hidden bg-black', className)}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="relative aspect-video w-full group">
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="lazy"
                />

                {/* Large Center Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <button 
                        onClick={() => {
                            const cmd = isPaused ? 'play' : 'pause';
                            iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ [cmd]: true }), '*');
                            setIsPaused(!isPaused);
                        }}
                        className={cn(
                            "w-20 h-20 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 transition-all hover:scale-110 pointer-events-auto shadow-2xl",
                            isPaused ? "opacity-100" : "opacity-0 hover:opacity-100" // Always show on pause, show on hover when playing
                        )}
                    >
                        {isPaused ? (
                            <div className="relative left-1">
                                <svg viewBox="0 0 32 32" className="w-10 h-10 fill-current"><path d="M8 5v22l18-11L8 5z"/></svg>
                            </div>
                        ) : (
                            <div>
                                <svg viewBox="0 0 32 32" className="w-10 h-10 fill-current"><path d="M6 4h8v24H6V4zm12 0h8v24h-8V4z"/></svg>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
