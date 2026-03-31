'use client';

import React from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
    progress: number;
    fileName: string;
    isUploading: boolean;
    error: string | null;
    onCancel?: () => void;
    onReset?: () => void;
    onDismiss?: () => void;
    isDark?: boolean;
}

export function UploadProgress({
    progress,
    fileName,
    isUploading,
    error,
    onCancel,
    onReset,
    onDismiss,
    isDark = false,
}: UploadProgressProps) {
    if (!isUploading && !error && progress === 0) return null;

    const isProcessing = progress === 100 && isUploading;
    const isDone = progress === 100 && !isUploading && !error;
    const displayProgress = isProcessing ? 98 : progress;

    const statusText = error
        ? 'Failed'
        : isProcessing
        ? 'Processing…'
        : isDone
        ? 'Done'
        : `${displayProgress}%`;

    return (
        <div className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm',
            isDark
                ? 'bg-zinc-900 border-zinc-800 text-white'
                : 'bg-white border-zinc-200 text-zinc-900'
        )}>
            {/* Status icon */}
            <div className="shrink-0">
                {error ? (
                    <AlertCircle size={15} className="text-red-500" />
                ) : isDone ? (
                    <CheckCircle size={15} className="text-emerald-500" />
                ) : (
                    <Loader2 size={15} className="animate-spin text-blue-500" />
                )}
            </div>

            {/* File name + bar */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={cn(
                        'text-xs font-medium truncate',
                        isDark ? 'text-zinc-200' : 'text-zinc-800'
                    )}>
                        {fileName}
                    </span>
                    <span className={cn(
                        'text-xs font-semibold tabular-nums shrink-0',
                        error ? 'text-red-500' : isDone ? 'text-emerald-500' : 'text-blue-500'
                    )}>
                        {statusText}
                    </span>
                </div>

                {/* Progress bar */}
                <div className={cn(
                    'h-1 w-full rounded-full overflow-hidden',
                    isDark ? 'bg-zinc-800' : 'bg-zinc-100'
                )}>
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-300',
                            error
                                ? 'bg-red-500'
                                : isDone
                                ? 'bg-emerald-500'
                                : 'bg-blue-500',
                            isProcessing && 'animate-pulse'
                        )}
                        style={{ width: `${error ? 100 : displayProgress}%` }}
                    />
                </div>
            </div>

            {/* Action button */}
            {error ? (
                <div className="flex items-center gap-1 shrink-0">
                    {onReset && (
                        <button
                            onClick={onReset}
                            className={cn(
                                'text-xs font-semibold px-2 py-0.5 rounded',
                                isDark
                                    ? 'text-blue-400 hover:bg-zinc-800'
                                    : 'text-blue-600 hover:bg-zinc-100'
                            )}
                        >
                            Retry
                        </button>
                    )}
                    {onDismiss && (
                        <button onClick={onDismiss} className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded">
                            <X size={13} />
                        </button>
                    )}
                </div>
            ) : isUploading && onCancel ? (
                <button
                    onClick={onCancel}
                    className="shrink-0 text-zinc-400 hover:text-zinc-600 p-0.5 rounded"
                >
                    <X size={13} />
                </button>
            ) : isDone && onDismiss ? (
                <button
                    onClick={onDismiss}
                    className="shrink-0 text-zinc-400 hover:text-zinc-600 p-0.5 rounded"
                >
                    <X size={13} />
                </button>
            ) : null}
        </div>
    );
}
