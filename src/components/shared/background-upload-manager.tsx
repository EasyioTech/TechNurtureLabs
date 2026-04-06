'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadTasks, uploadStore } from '@/lib/upload-store';
import { UploadProgress } from './upload-progress';
import { cn } from '@/lib/utils';
import { useAdminTheme } from '@/modules/super-admin/theme-context';

export function BackgroundUploadManager() {
    const tasks = useUploadTasks();
    // Show only local visible uploads (those in media library modal)
    const visibleTasks = Object.values(tasks).filter(t => t.isLocalVisible);
    // Show background uploads (from dashboard) - max 1 at a time
    const backgroundTasks = Object.values(tasks).filter(t => !t.isLocalVisible);
    const currentTask = backgroundTasks[0]; // Only show the first/current upload

    const { isDark } = useAdminTheme();

    // Desktop: show if there's a background upload
    // Mobile: show if there's a background upload (will stack at bottom center)
    if (!currentTask) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={cn(
                    "fixed left-1/2 -translate-x-1/2 z-[9999]",
                    // Desktop: bottom center
                    "bottom-6 max-sm:bottom-20",
                    // Mobile responsive width
                    "w-full max-w-sm px-4 sm:px-0"
                )}
            >
                <UploadProgress
                    progress={currentTask.progress}
                    fileName={currentTask.fileName}
                    isUploading={currentTask.isUploading}
                    error={currentTask.error}
                    onCancel={() => currentTask.onCancel?.()}
                    onReset={() => currentTask.onReset?.()}
                    onDismiss={() => uploadStore.removeTask(currentTask.id)}
                    isDark={isDark}
                />
            </motion.div>
        </AnimatePresence>
    );
}
