'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { X, Loader2, CloudUpload, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
    progress: number;
    fileName: string;
    isUploading: boolean;
    error: string | null;
    onCancel?: () => void;
    onReset?: () => void;
    isDark?: boolean;
}

export function UploadProgress({
    progress,
    fileName,
    isUploading,
    error,
    onCancel,
    onReset,
    isDark = false,
}: UploadProgressProps) {
    if (!isUploading && !error && progress === 0) return null;

    return (
        <div className={cn(
            "mt-4 p-4 rounded-2xl border-2 transition-all animate-in fade-in slide-in-from-top-2 duration-300",
            isDark 
                ? "bg-white/[0.03] border-white/5" 
                : "bg-slate-50 border-slate-100 shadow-sm"
        )}>
            <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    error 
                        ? "bg-rose-500/10 text-rose-500" 
                        : (progress === 100 && !isUploading)
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-indigo-500/10 text-indigo-500"
                )}>
                    {error ? (
                        <X size={20} />
                    ) : (progress === 100 && !isUploading) ? (
                        <FileCheck size={20} className="animate-bounce" />
                    ) : progress === 100 ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <CloudUpload size={20} className={cn(isUploading && "animate-pulse")} />
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <p className={cn(
                            "text-[11px] font-black uppercase tracking-wider truncate",
                            isDark ? "text-white" : "text-slate-900"
                        )}>
                            {fileName}
                        </p>
                        <span className={cn(
                            "text-[10px] font-black tabular-nums",
                            error ? "text-rose-500" : "text-indigo-500"
                        )}>
                            {error ? 'FAILED' : (progress === 100 && isUploading) ? '99%' : `${progress}%`}
                        </span>
                    </div>
                    <p className={cn(
                        "text-[9px] font-bold uppercase tracking-widest mt-0.5",
                        isDark ? "text-slate-500" : "text-slate-400"
                    )}>
                        {error 
                            ? 'Upload interrupted' 
                            : (progress === 100 && isUploading) 
                                ? 'Processing on server...' 
                                : progress === 100 
                                    ? 'Success! File saved' 
                                    : 'Transferring data...'}
                    </p>
                </div>

                {isUploading && onCancel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        className={cn(
                            "w-8 h-8 rounded-full shrink-0",
                            isDark ? "hover:bg-white/10 text-slate-500" : "hover:bg-slate-200 text-slate-400"
                        )}
                    >
                        <X size={14} />
                    </Button>
                )}
            </div>

            <div className={cn(
                "relative h-1.5 w-full rounded-full overflow-hidden",
                isDark ? "bg-white/5" : "bg-slate-200"
            )}>
                <Progress 
                    value={(progress === 100 && isUploading) ? 98 : progress} 
                    className={cn(
                        "h-full w-full bg-transparent border-0 transition-all duration-500",
                        (progress === 100 && isUploading) && "animate-pulse"
                    )}
                />
                {isUploading && (
                    <div 
                        className="absolute inset-y-0 left-0 bg-indigo-500/30 animate-shimmer"
                        style={{ width: `${(progress === 100 && isUploading) ? 98 : progress}%` }}
                    />
                )}
            </div>

            {error && (
                <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Loader2 size={10} className="animate-spin" /> {error}
                    </p>
                    {onReset && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onReset}
                            className={cn(
                                "h-7 px-3 rounded-full text-[9px] font-black uppercase tracking-widest",
                                isDark ? "text-white hover:bg-white/10" : "text-slate-900 hover:bg-slate-200"
                            )}
                        >
                            Retry Upload
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
