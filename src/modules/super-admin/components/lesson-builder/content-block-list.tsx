'use client';

import React from 'react';
import { Layers, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { ContentItem, BLOCK_TYPES, TYPE_ACCENT } from './utils';
import { ContentBlockItem } from './content-block-item';

interface ContentBlockListProps {
    contentItems: ContentItem[];
    isDark: boolean;
    isUploading: boolean;
    isStreamUploading: boolean;
    activeUploadItemId: string | null;
    progress: number;
    streamProgress: number;
    uploadFile: File | null;
    uploadError: string | null;
    showBlockPicker: boolean;
    setShowBlockPicker: (show: boolean) => void;
    onAddBlock: (type: ContentItem['type']) => void;
    onRemoveBlock: (id: string) => void;
    onUpdateBlock: (id: string, key: 'type' | 'url', value: string) => void;
    onImageSync: (id: string, urls: string[]) => void;
    onFileUpload: (file: File, itemId: string, folder: string) => void;
    onLibraryRequest: (id: string) => void;
    abort: () => void;
    resetUpload: () => void;
    upload: (file: File, options: any) => Promise<any>;
}

export function ContentBlockList({
    contentItems, isDark, isUploading, isStreamUploading, activeUploadItemId,
    progress, streamProgress, uploadFile, uploadError,
    showBlockPicker, setShowBlockPicker,
    onAddBlock, onRemoveBlock, onUpdateBlock, onImageSync, onFileUpload, onLibraryRequest,
    abort, resetUpload, upload
}: ContentBlockListProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Content Blocks
                </Label>
                <span className={`text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Shown to students in sequence
                </span>
            </div>

            {contentItems.length === 0 && (
                <div className={cn(
                    'py-10 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2',
                    isDark ? 'border-white/8 bg-white/[0.01]' : 'border-slate-200 bg-slate-50'
                )}>
                    <Layers size={26} className={isDark ? 'text-slate-700' : 'text-slate-300'} />
                    <p className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No content blocks yet</p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Click below to add video, docs, or images</p>
                </div>
            )}

            <div className="space-y-2">
                {contentItems.map((item, idx) => (
                    <ContentBlockItem
                        key={item.id}
                        item={item}
                        idx={idx}
                        isDark={isDark}
                        isUploading={isUploading}
                        isStreamUploading={isStreamUploading}
                        activeUploadItemId={activeUploadItemId}
                        progress={progress}
                        streamProgress={streamProgress}
                        uploadFile={uploadFile}
                        uploadError={uploadError}
                        onRemove={onRemoveBlock}
                        onUpdate={onUpdateBlock}
                        onImageSync={onImageSync}
                        onFileUpload={onFileUpload}
                        onLibraryRequest={onLibraryRequest}
                        abort={abort}
                        resetUpload={resetUpload}
                        upload={upload}
                    />
                ))}
            </div>

            {!showBlockPicker ? (
                <button
                    type="button"
                    onClick={() => setShowBlockPicker(true)}
                    className={cn(
                        'w-full h-11 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide transition-all',
                        isDark
                            ? 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white hover:bg-white/[0.04]'
                            : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                    )}
                >
                    <Plus size={14} /> Add Content Block
                </button>
            ) : (
                <div className={cn(
                    'rounded-2xl border-2 p-3.5 space-y-3',
                    isDark ? 'border-white/8 bg-white/[0.02]' : 'border-indigo-100 bg-indigo-50/40'
                )}>
                    <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                            Choose content type
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowBlockPicker(false)}
                            className={cn(
                                'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                                isDark ? 'text-slate-600 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            )}
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {BLOCK_TYPES.map((bt) => {
                            const accent = TYPE_ACCENT[bt.id];
                            return (
                                <button
                                    key={bt.id}
                                    type="button"
                                    onClick={() => { onAddBlock(bt.id); setShowBlockPicker(false); }}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all group',
                                        isDark
                                            ? 'border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]'
                                            : 'border-slate-100 bg-white hover:shadow-md hover:border-slate-200'
                                    )}
                                    style={!isDark ? { borderLeftColor: accent.border, borderLeftWidth: '3px' } : {}}
                                >
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: isDark ? accent.darkBg : accent.lightBg }}
                                    >
                                        <bt.icon size={16} className={bt.color} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-xs font-black leading-none mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{bt.label}</p>
                                        <p className={`text-[9px] font-medium leading-none ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{bt.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
