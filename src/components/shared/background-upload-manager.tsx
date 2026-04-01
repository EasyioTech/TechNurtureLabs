'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadTasks, uploadStore } from '@/lib/upload-store';
import { UploadProgress } from './upload-progress';
import { ChevronDown, ChevronUp, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminTheme } from '@/modules/super-admin/theme-context';

export function BackgroundUploadManager() {
    const tasks = useUploadTasks();
    const taskList = Object.values(tasks).filter(t => !t.isLocalVisible);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const { isDark } = useAdminTheme();

    if (taskList.length === 0 || isDismissed) return null;

    const activeCount = taskList.filter(t => t.isUploading).length;
    const errorCount = taskList.filter(t => t.error).length;

    return (
        <AnimatePresence>
            {!isDismissed && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 400 }}
                    dragElastic={0.1}
                    onDragEnd={(_, info) => {
                        if (info.offset.x > 120) setIsDismissed(true);
                    }}
                    className="fixed bottom-4 right-4 z-[9999] w-[280px] max-w-[calc(100vw-2rem)]"
                >
                    <div className={cn(
                        "rounded-[20px] border shadow-2xl overflow-hidden select-none transition-colors duration-300",
                        isDark 
                            ? "bg-[#1a1d25] border-white/10 shadow-black/40" 
                            : "bg-white border-zinc-200 shadow-zinc-400/20"
                    )}>
                        {/* Header */}
                        <div
                            className={cn(
                                "flex items-center justify-between px-3.5 py-2.5 cursor-pointer",
                                isDark ? "bg-white/[0.03]" : "bg-zinc-50"
                            )}
                            onClick={() => setIsCollapsed(v => !v)}
                        >
                            <div className="flex items-center gap-2">
                                {activeCount > 0 ? (
                                    <Loader2 size={14} className="animate-spin text-blue-500" />
                                ) : errorCount > 0 ? (
                                    <AlertCircle size={14} className="text-red-500" />
                                ) : (
                                    <CheckCircle size={14} className="text-emerald-500" />
                                )}
                                <span className={cn(
                                    "text-[11px] font-black uppercase tracking-tight",
                                    isDark ? "text-white/90" : "text-zinc-700"
                                )}>
                                    {activeCount > 0
                                        ? `Uploading ${activeCount}`
                                        : errorCount > 0
                                        ? `${errorCount} Failed`
                                        : 'Complete'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className={cn(
                                        "p-1 rounded-lg transition-colors",
                                        isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-zinc-200 text-zinc-400"
                                    )}
                                    onClick={e => { e.stopPropagation(); setIsDismissed(true); }}
                                >
                                    <X size={14} strokeWidth={2.5} />
                                </button>
                                <button className={cn(
                                    "p-1 rounded-lg transition-colors",
                                    isDark ? "text-white/40" : "text-zinc-400"
                                )}>
                                    {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Task list */}
                        {!isCollapsed && (
                            <div className={cn(
                                "flex flex-col gap-1 p-2 max-h-[220px] overflow-y-auto no-scrollbar",
                                isDark ? "bg-[#1a1d25]" : "bg-white"
                            )}>
                                {taskList.slice().reverse().map(task => (
                                    <UploadProgress
                                        key={task.id}
                                        progress={task.progress}
                                        fileName={task.fileName}
                                        isUploading={task.isUploading}
                                        error={task.error}
                                        onCancel={() => task.onCancel?.()}
                                        onReset={() => task.onReset?.()}
                                        onDismiss={() => uploadStore.removeTask(task.id)}
                                        isDark={isDark}
                                    />
                                ))}
                            </div>
                        )}

                        <div className={cn(
                            "px-3 py-1.5 border-t text-[9px] font-bold text-center uppercase tracking-widest",
                            isDark ? "border-white/5 text-white/20" : "border-zinc-100 text-zinc-400"
                        )}>
                            Slide right to dismiss
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
