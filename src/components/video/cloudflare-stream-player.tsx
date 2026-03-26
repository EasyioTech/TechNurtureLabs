'use client';

/**
 * CloudflareStreamPlayer — Renders a Cloudflare Stream video
 * using the official iframe embed with full adaptive streaming.
 *
 * Features:
 * - Adaptive bitrate streaming (HLS/DASH) handled by Cloudflare
 * - Progress tracking via postMessage API
 * - Auto-resume from last position
 * - Fullscreen → landscape lock on mobile
 */

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
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

    // Build embed URL with resume timestamp
    const startTimeSecs = initialProgress?.last_position_secs && initialProgress.last_position_secs > 10 && !isCompleted
        ? Math.floor(initialProgress.last_position_secs)
        : 0;

    const embedUrl = [
        `https://iframe.videodelivery.net/${uid}`,
        `?autoplay=false&preload=auto`,
        startTimeSecs ? `&startTime=${startTimeSecs}` : '',
    ].join('');

    // ── postMessage from Cloudflare iframe ────────────────────────────────────
    useEffect(() => {
        if (isCompleted || !lessonId) return;

        let lastSyncTime = 0;
        // Track whether onComplete has been called to prevent double-fire
        let firedComplete = false;

        function fireComplete() {
            if (firedComplete) return;
            firedComplete = true;
            setIsCompleted(true);
            onComplete?.(true);
        }

        function handleMessage(event: MessageEvent) {
            // Cloudflare Stream sends from either of these origins
            if (
                !event.origin.includes('videodelivery.net') &&
                !event.origin.includes('cloudflarestream.com') &&
                !event.origin.includes('iframe.cloudflarestream.com')
            ) return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (!data || typeof data !== 'object') return;

                // Cloudflare Stream postMessage API uses `data.time`, not `data.currentTime`
                const currentTime = data.currentTime ?? data.time ?? null;
                const duration = data.duration ?? null;

                // Progress tracking (timeupdate)
                if (data.type === 'timeupdate' && currentTime !== null && duration) {
                    const pct = Math.floor((currentTime / duration) * 100);
                    setVerifiedProgress(prev => {
                        const next = Math.max(prev, pct);
                        return next;
                    });

                    const now = Date.now();
                    if (now - lastSyncTime > 10000) {
                        lastSyncTime = now;
                        saveVideoProgress(lessonId!, currentTime, pct).catch(() => {});
                    }

                    // Fallback: if 95%+ watched and ended event never fires, complete anyway
                    if (pct >= 95) {
                        fireComplete();
                    }
                }

                // Video ended → bubble up immediately
                if (data.type === 'ended' || data.event === 'ended') {
                    fireComplete();
                }
            } catch {}
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [lessonId, isCompleted, onComplete]);

    // ── Flush progress on tab hide ─────────────────────────────────────────
    useEffect(() => {
        if (isCompleted || !lessonId) return;

        function handleVisibilityChange() {
            if (document.visibilityState === 'hidden' && verifiedProgress > 0) {
                // Use verified progress to estimate current time; flush to DB
                const estimatedTime = (verifiedProgress / 100) * 600; // rough estimate
                saveVideoProgress(lessonId!, estimatedTime, verifiedProgress).catch(() => {});
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [lessonId, isCompleted, verifiedProgress]);

    // ── Fullscreen → auto-rotate to landscape on mobile ───────────────────
    useEffect(() => {
        function handleFullscreenChange() {
            const isFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement
            );

            if (isFullscreen) {
                try {
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

    return (
        <div className={cn('w-full overflow-hidden bg-black', className)}>
            <div className="relative aspect-video w-full">
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="lazy"
                />
            </div>

            {/* Manual completion fallback — appears after 90% watch time if the video
                has not auto-completed (e.g. ended event was missed or player issue). */}
            {!isCompleted && verifiedProgress >= 90 && lessonId && (
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
