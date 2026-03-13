'use client';

import React, { useState } from 'react';
import { useUploadTasks, uploadStore } from '@/lib/upload-store';
import { UploadProgress } from './upload-progress';
import { ChevronDown, ChevronUp, Layers, X, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function BackgroundUploadManager() {
    const tasks = useUploadTasks();
    const taskList = Object.values(tasks).filter(t => !t.isLocalVisible);
    const [isMinimized, setIsMinimized] = useState(false);
    
    // Only show if there are active or errored tasks
    if (taskList.length === 0) return null;

    const activeCount = taskList.filter(t => t.isUploading).length;
    const errorCount = taskList.filter(t => t.error).length;

    return (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto z-[9999] flex flex-col items-end gap-3 pointer-events-none pb-safe">
            <AnimatePresence mode="popLayout">
                {!isMinimized ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="w-full sm:w-[340px] max-h-[80vh] sm:max-h-[500px] overflow-y-auto pointer-events-auto custom-scrollbar flex flex-col gap-3"
                    >
                        {/* Header for the group */}
                        <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-2xl border border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {activeCount > 0 ? `Uploading ${activeCount} items` : 'Upload Queue'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMinimized(true)}
                                    className="w-6 h-6 hover:bg-white/10 text-slate-400"
                                >
                                    <ChevronDown size={14} />
                                </Button>
                            </div>
                        </div>

                        {/* Individual Task Cards */}
                        {taskList.slice().reverse().map((task) => (
                            <div key={task.id} className="relative group">
                                <UploadProgress
                                    progress={task.progress}
                                    fileName={task.fileName}
                                    isUploading={task.isUploading}
                                    error={task.error}
                                    onCancel={() => task.onCancel?.()}
                                    onReset={() => task.onReset?.()}
                                    isDark={true}
                                />
                                {!task.isUploading && !task.error && (
                                    <button 
                                        onClick={() => uploadStore.removeTask(task.id)}
                                        className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/10 rounded-full text-white"
                                    >
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.button
                        layoutId="upload-manager-badge"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setIsMinimized(false)}
                        className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-full shadow-2xl border border-white/10 hover:bg-slate-800 transition-all group"
                    >
                        <div className="relative">
                            <Layers size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                            {activeCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-slate-900 animate-pulse" />
                            )}
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {activeCount} Active Uploads
                            </span>
                            {errorCount > 0 && (
                                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">
                                    {errorCount} failures noted
                                </span>
                            )}
                        </div>
                        <ChevronUp size={14} className="text-slate-500 ml-1" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
