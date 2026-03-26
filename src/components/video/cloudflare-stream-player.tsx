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

        function handleMessage(event: MessageEvent) {
            if (!event.origin.includes('videodelivery.net') && !event.origin.includes('cloudflarestream.com')) return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                // Progress tracking
                if (data.type === 'timeupdate' && data.currentTime && data.duration) {
                    const pct = Math.floor((data.currentTime / data.duration) * 100);
                    setVerifiedProgress(prev => Math.max(prev, pct));

                    const now = Date.now();
                    if (now - lastSyncTime > 10000) {
                        lastSyncTime = now;
                        saveVideoProgress(lessonId!, data.currentTime, pct).catch(() => {});
                    }
                }

                // Video ended → bubble up immediately, no in-player overlay
                if (data.type === 'ended') {
                    if (!isCompleted) {
                        setIsCompleted(true);
                        onComplete?.(true);
                    }
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
                const estimatedTime = (verifiedProgress / 100) * 600;
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
        </div>
    );
}
