'use client';

/**
 * CloudflareStreamPlayer — Renders a Cloudflare Stream video
 * using the official iframe embed with full adaptive streaming.
 *
 * Features:
 * - Adaptive bitrate streaming (HLS/DASH) handled by Cloudflare
 * - Progress tracking via postMessage API
 * - Completion overlay reusing existing lesson flow
 * - Auto-resume from last position
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MonitorPlay, CheckCircle2 as CheckIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { saveVideoProgress } from '@/modules/student/actions/lesson-actions';

interface CloudflareStreamPlayerProps {
    uid: string;
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

export function CloudflareStreamPlayer({
    uid,
    lessonId,
    initialProgress,
    onComplete,
    className,
}: CloudflareStreamPlayerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isCompleted, setIsCompleted] = useState(!!initialProgress?.completed_at);
    const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completionError, setCompletionError] = useState<string | null>(null);
    const [verifiedProgress, setVerifiedProgress] = useState(initialProgress?.progress_pct || 0);

    // Build the embed URL with initial time if available
    const startTime = initialProgress?.last_position_secs && initialProgress.last_position_secs > 10 && !isCompleted
        ? `#t=${Math.floor(initialProgress.last_position_secs)}s`
        : '';

    const embedUrl = `https://iframe.videodelivery.net/${uid}?autoplay=false&preload=auto${startTime ? `&startTime=${Math.floor(initialProgress?.last_position_secs || 0)}` : ''}`;

    // Listen for postMessage events from the Cloudflare Stream iframe
    useEffect(() => {
        if (isCompleted) return;

        let lastSyncTime = 0;

        function handleMessage(event: MessageEvent) {
            // Only accept messages from Cloudflare's domain
            if (!event.origin.includes('videodelivery.net') && !event.origin.includes('cloudflarestream.com')) return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                // Cloudflare Stream sends timeupdate events
                if (data.type === 'timeupdate' && data.currentTime && data.duration) {
                    const pct = Math.floor((data.currentTime / data.duration) * 100);
                    setVerifiedProgress(prev => Math.max(prev, pct));

                    // Sync every 10 seconds
                    const now = Date.now();
                    if (now - lastSyncTime > 10000) {
                        lastSyncTime = now;
                        saveVideoProgress(lessonId, data.currentTime, pct).catch(() => { });
                    }
                }

                // Video ended
                if (data.type === 'ended') {
                    setShowCompletionOverlay(true);
                }
            } catch { }
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [lessonId, isCompleted]);

    // Fallback: track progress via interval polling the iframe
    useEffect(() => {
        if (isCompleted) return;

        const interval = setInterval(() => {
            // Progress is tracked via postMessage above
            // This interval just ensures we sync on tab-hide
        }, 10000);

        function handleVisibilityChange() {
            if (document.visibilityState === 'hidden' && verifiedProgress > 0) {
                // Sync current progress when tab is hidden
                const estimatedTime = (verifiedProgress / 100) * 600; // rough estimate
                saveVideoProgress(lessonId, estimatedTime, verifiedProgress).catch(() => { });
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [lessonId, isCompleted, verifiedProgress]);

    const handleComplete = async () => {
        if (isCompleted) return;
        setIsSubmitting(true);
        setCompletionError(null);

        try {
            const { completeLessonAndReward } = await import('@/modules/student/actions/lesson-actions');
            const result = await completeLessonAndReward(lessonId);

            if (result.success) {
                setIsCompleted(true);
                if (onComplete) await onComplete(true);
                setTimeout(() => setShowCompletionOverlay(false), 2000);
            } else {
                setCompletionError(result.error || 'Please finish watching the video.');
            }
        } catch {
            setCompletionError('Connection error. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

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

                {showCompletionOverlay && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/10 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-[320px] w-full bg-white/90 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-xl text-center"
                        >
                            <div className="space-y-6">
                                {isCompleted ? (
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                                            <CheckIcon size={24} className="text-slate-900" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-slate-900">Progress Saved</h3>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Synchronization Complete</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                                            <MonitorPlay size={24} className="text-slate-900" />
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-slate-900">Lesson Finished</h3>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Ready to complete?</p>
                                        </div>

                                        {completionError && (
                                            <div className="text-[10px] font-bold text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                                {completionError}
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={handleComplete}
                                                disabled={isSubmitting}
                                                className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                ) : 'Save Progress'}
                                            </button>
                                            {!isSubmitting && (
                                                <button
                                                    onClick={() => setShowCompletionOverlay(false)}
                                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest pt-1"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
