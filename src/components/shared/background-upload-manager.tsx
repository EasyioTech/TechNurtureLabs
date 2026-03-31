'use client';

import React, { useState, useRef } from 'react';
import { useUploadTasks, uploadStore } from '@/lib/upload-store';
import { UploadProgress } from './upload-progress';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BackgroundUploadManager() {
    const tasks = useUploadTasks();
    const taskList = Object.values(tasks).filter(t => !t.isLocalVisible);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Swipe-to-dismiss state
    const dragStartX = useRef<number | null>(null);
    const [dragOffsetX, setDragOffsetX] = useState(0);
    const [isDismissed, setIsDismissed] = useState(false);

    if (taskList.length === 0 || isDismissed) return null;

    const activeCount = taskList.filter(t => t.isUploading).length;
    const errorCount = taskList.filter(t => t.error).length;

    const handlePointerDown = (e: React.PointerEvent) => {
        dragStartX.current = e.clientX;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (dragStartX.current === null) return;
        const delta = e.clientX - dragStartX.current;
        if (delta > 0) setDragOffsetX(delta); // only allow sliding right
    };

    const handlePointerUp = () => {
        if (dragOffsetX > 80) {
            setIsDismissed(true);
        } else {
            setDragOffsetX(0);
        }
        dragStartX.current = null;
    };

    return (
        <div
            className="fixed bottom-4 right-4 z-[9999] w-[300px] max-w-[calc(100vw-2rem)]"
            style={{
                transform: `translateX(${dragOffsetX}px)`,
                opacity: dragOffsetX > 0 ? Math.max(0, 1 - dragOffsetX / 160) : 1,
                transition: dragStartX.current !== null ? 'none' : 'transform 0.2s ease, opacity 0.2s ease',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <div className="rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden select-none">
                {/* Header */}
                <div
                    className="flex items-center justify-between px-3 py-2 bg-zinc-50 border-b border-zinc-200 cursor-pointer"
                    onClick={() => setIsCollapsed(v => !v)}
                >
                    <div className="flex items-center gap-2">
                        {activeCount > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                        <span className="text-xs font-semibold text-zinc-700">
                            {activeCount > 0
                                ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}…`
                                : errorCount > 0
                                ? `${errorCount} upload${errorCount > 1 ? 's' : ''} failed`
                                : 'Uploads complete'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {errorCount > 0 && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 rounded px-1.5 py-0.5">
                                {errorCount} error{errorCount > 1 ? 's' : ''}
                            </span>
                        )}
                        <button
                            className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded"
                            onClick={e => { e.stopPropagation(); setIsCollapsed(v => !v); }}
                        >
                            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>

                {/* Task list */}
                {!isCollapsed && (
                    <div className="flex flex-col gap-1 p-2 max-h-[240px] overflow-y-auto">
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
                                isDark={false}
                            />
                        ))}
                    </div>
                )}

                {/* Swipe hint — only shown briefly on first mount */}
                <div className="px-3 py-1.5 border-t border-zinc-100 bg-zinc-50">
                    <p className="text-[10px] text-zinc-400 text-center">Slide right to dismiss</p>
                </div>
            </div>
        </div>
    );
}
