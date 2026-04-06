'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
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
    const [showSuccess, setShowSuccess] = useState(false);

    const isDone = progress === 100 && !isUploading && !error;

    // Auto-dismiss on success after 2 seconds
    useEffect(() => {
        if (isDone) {
            setShowSuccess(true);
            const timer = setTimeout(() => {
                onDismiss?.();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isDone, onDismiss]);

    if (!isUploading && !error && progress === 0) return null;

    const displayProgress = progress === 100 && isUploading ? 98 : progress;

    return (
        <div className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-full border backdrop-blur-md',
            isDark
                ? 'bg-zinc-900/80 border-zinc-700/50'
                : 'bg-white/80 border-zinc-200/50'
        )}>
            {/* Circular Progress Loader */}
            <div className="relative shrink-0 w-5 h-5">
                {error ? (
                    <AlertCircle size={20} className="text-red-500" />
                ) : isDone ? (
                    <CheckCircle size={20} className="text-emerald-500" />
                ) : (
                    <>
                        {/* Background circle */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 20 20">
                            <circle
                                cx="10"
                                cy="10"
                                r="8"
                                fill="none"
                                stroke={isDark ? '#3f3f46' : '#e4e4e7'}
                                strokeWidth="1.5"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="10"
                                cy="10"
                                r="8"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="1.5"
                                strokeDasharray={`${2 * Math.PI * 8}`}
                                strokeDashoffset={`${2 * Math.PI * 8 * (1 - displayProgress / 100)}`}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 300ms ease' }}
                            />
                        </svg>
                        {/* Percentage text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={cn(
                                'text-[7px] font-bold',
                                isDark ? 'text-blue-400' : 'text-blue-600'
                            )}>
                                {displayProgress}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    'text-xs font-medium truncate',
                    isDark ? 'text-zinc-200' : 'text-zinc-800'
                )}>
                    {fileName}
                </p>
                <p className={cn(
                    'text-[11px]',
                    error ? 'text-red-500' : isDone ? 'text-emerald-500' : isDark ? 'text-zinc-400' : 'text-zinc-500'
                )}>
                    {error ? error : isDone ? 'Uploaded' : isUploading ? 'Uploading...' : 'Processing...'}
                </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
                {error && onReset && (
                    <button
                        onClick={onReset}
                        className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded',
                            isDark
                                ? 'text-blue-400 hover:bg-zinc-800'
                                : 'text-blue-600 hover:bg-zinc-100'
                        )}
                    >
                        Retry
                    </button>
                )}
                {isUploading && onCancel && (
                    <button
                        onClick={onCancel}
                        className={cn(
                            'p-0.5 rounded transition-colors',
                            isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-400 hover:text-zinc-600'
                        )}
                    >
                        <X size={14} />
                    </button>
                )}
                {(error || isDone) && onDismiss && (
                    <button
                        onClick={onDismiss}
                        className={cn(
                            'p-0.5 rounded transition-colors',
                            isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-400 hover:text-zinc-600'
                        )}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
