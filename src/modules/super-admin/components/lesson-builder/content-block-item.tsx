'use client';

import React from 'react';
import { X, Link2, Upload, Library, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ContentItem, BLOCK_TYPES, TYPE_ACCENT, validateBlockUrl } from './utils';
import { ImageCarouselBuilder } from './image-carousel-builder';
import { UploadProgress } from '@/components/shared/upload-progress';

interface ContentBlockItemProps {
    item: ContentItem;
    idx: number;
    isDark: boolean;
    isUploading: boolean;
    isStreamUploading: boolean;
    isNormalizing?: boolean;
    activeUploadItemId: string | null;
    progress: number;
    streamProgress: number;
    uploadFile: File | null;
    uploadError: string | null;
    onRemove: (id: string) => void;
    onUpdate: (id: string, key: 'type' | 'url', value: string) => void;
    onImageSync: (id: string, urls: string[]) => void;
    onFileUpload: (file: File, itemId: string, folder: string) => void;
    onLibraryRequest: (id: string) => void;
    abort: () => void;
    resetUpload: () => void;
    upload: (file: File, options: any) => Promise<any>;
}

export function ContentBlockItem({
    item, idx, isDark, isUploading, isStreamUploading, isNormalizing, activeUploadItemId,
    progress, streamProgress, uploadFile, uploadError,
    onRemove, onUpdate, onImageSync, onFileUpload, onLibraryRequest,
    abort, resetUpload, upload
}: ContentBlockItemProps) {
    const bt = BLOCK_TYPES.find(b => b.id === item.type) || BLOCK_TYPES[0];
    const isStreamUploadingThis = isStreamUploading && activeUploadItemId === item.id;
    const isNormalizingThis = isNormalizing && activeUploadItemId === item.id;
    const isUploadingThis = (isUploading || isStreamUploading || isNormalizing) && activeUploadItemId === item.id;
    const isUploaded = item.url.startsWith('/api/') || item.url.includes('r2.cloudflare') || item.url.startsWith('cf-stream://');
    
    const displayUrl = isUploaded
        ? item.url.startsWith('cf-stream://')
            ? `☁ Stream: ${item.url.replace('cf-stream://', '').slice(0, 16)}…`
            : '✓ Uploaded'
        : item.url;

    const typeAccent = TYPE_ACCENT[item.type] || TYPE_ACCENT.video;

    return (
        <div
            className={cn('rounded-2xl overflow-hidden', !isDark && 'shadow-sm')}
            style={{
                border: `2px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderLeftWidth: '4px',
                borderLeftColor: typeAccent.border,
            }}
        >
            <div
                className="flex items-center gap-2.5 px-3 py-2.5 border-b"
                style={{
                    backgroundColor: isDark ? typeAccent.darkBg : typeAccent.lightBg,
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                }}
            >
                <span className={`text-[9px] font-black w-4 flex-shrink-0 ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
                    {idx + 1}
                </span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <bt.icon size={13} className={bt.color} />
                    <span className={`text-[11px] font-black uppercase tracking-wide ${bt.color}`}>{bt.label}</span>
                </div>
                <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0',
                        isDark
                            ? 'hover:bg-rose-500/20 text-slate-600 hover:text-rose-400'
                            : 'hover:bg-rose-50 text-slate-300 hover:text-rose-500'
                    )}
                >
                    <X size={13} />
                </button>
            </div>

            <div className="flex flex-col gap-2 p-3">
                {item.type === 'image' ? (
                    <ImageCarouselBuilder
                        item={item}
                        isDark={isDark}
                        isUploading={isUploading}
                        activeUploadItemId={activeUploadItemId}
                        progress={progress}
                        upload={upload}
                        onSync={onImageSync}
                        onLibraryRequest={onLibraryRequest}
                    />
                ) : (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <Link2 size={11} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                                <Input
                                    placeholder={`Paste ${bt.label.toLowerCase()} URL…`}
                                    value={displayUrl}
                                    readOnly={isUploaded}
                                    onChange={(e) => onUpdate(item.id, 'url', e.target.value)}
                                    className={cn(
                                        'h-9 rounded-xl pl-8 pr-3 text-xs font-medium border-2',
                                        isUploaded && (isDark ? 'text-emerald-400' : 'text-emerald-600'),
                                        !isUploaded && validateBlockUrl(item.type, item.url) && 'border-amber-400',
                                        isDark
                                            ? 'bg-white/[0.04] text-white border-white/8 focus-visible:border-white/20'
                                            : 'bg-slate-50 border-slate-200 focus-visible:border-slate-400'
                                    )}
                                />
                            </div>
                            <label className={cn(
                                'h-9 px-3 rounded-xl border-2 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wide cursor-pointer flex-shrink-0 transition-all select-none',
                                isUploadingThis
                                    ? isDark ? 'border-white/20 text-white' : 'border-slate-300 text-slate-600'
                                    : isDark
                                        ? 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                        : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                            )}>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept={bt.accept}
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) {
                                            const folder = (item.type === 'pdf' || item.type === 'ppt') ? 'documents' : 'videos';
                                            onFileUpload(f, item.id, folder);
                                        }
                                    }}
                                />
                                {isUploadingThis
                                    ? isNormalizingThis
                                        ? <><Loader2 size={11} className="animate-spin" /> Repairing...</>
                                        : <><Loader2 size={11} className="animate-spin" /> {isStreamUploadingThis ? streamProgress : progress}%</>
                                    : <><Upload size={11} /> Upload</>
                                }
                            </label>
                            <button
                                type="button"
                                onClick={() => onLibraryRequest(item.id)}
                                className={cn(
                                    'h-9 px-3 rounded-xl border-2 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wide flex-shrink-0 transition-all',
                                    isDark
                                        ? 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                        : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                                )}
                            >
                                <Library size={11} /> Lib
                            </button>
                        </div>
                        {!isUploaded && item.url && validateBlockUrl(item.type, item.url) && (
                            <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1 pl-1">
                                <span>⚠</span> {validateBlockUrl(item.type, item.url)}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {isUploadingThis && uploadFile && (
                <div className="px-3 pb-3">
                    <UploadProgress
                        progress={isStreamUploadingThis ? streamProgress : progress}
                        fileName={uploadFile.name}
                        isUploading={isUploading || isStreamUploading}
                        error={uploadError}
                        onCancel={isStreamUploadingThis ? undefined : abort}
                        onReset={resetUpload}
                        isDark={isDark}
                    />
                </div>
            )}
        </div>
    );
}
