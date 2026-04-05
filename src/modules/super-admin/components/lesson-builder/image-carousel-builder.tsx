'use client';

import React from 'react';
import { Plus, X, Link2, Upload, Library, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ContentItem } from './utils';
import { useAdminTheme, t } from '../../theme-context';

interface ImageCarouselBuilderProps {
    item: ContentItem;
    isDark: boolean;
    isUploading: boolean;
    activeUploadItemId: string | null;
    progress: number;
    upload: (file: File, options: any) => Promise<any>;
    onSync: (id: string, urls: string[]) => void;
    onLibraryRequest: (id: string) => void;
}

export function ImageCarouselBuilder({
    item,
    isDark,
    isUploading,
    activeUploadItemId,
    progress,
    upload,
    onSync,
    onLibraryRequest,
}: ImageCarouselBuilderProps) {
    const getImageUrls = (item: ContentItem): string[] => {
        if (item.urls && item.urls.length > 0) return item.urls;
        return item.url ? [item.url] : [''];
    };

    const imageUrls = getImageUrls(item);

    return (
        <div className="flex flex-col gap-2">
            {imageUrls.map((imgUrl, imgIdx) => {
                const isUploadingSlot = isUploading && activeUploadItemId === `${item.id}:${imgIdx}`;
                const isUploadedSlot = imgUrl.startsWith('/api/') || imgUrl.includes('r2.cloudflare');
                return (
                    <div key={imgIdx} className="flex items-center gap-1.5">
                        <div className="flex-1 relative">
                            <Link2 size={11} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                            <Input
                                placeholder={`Image ${imgIdx + 1} URL…`}
                                value={isUploadedSlot ? '✓ Uploaded' : imgUrl}
                                readOnly={isUploadedSlot}
                                onChange={(e) => {
                                    const next = [...imageUrls];
                                    next[imgIdx] = e.target.value;
                                    onSync(item.id, next);
                                }}
                                className={cn(
                                    'h-9 rounded-xl pl-8 pr-3 text-xs font-medium border-2',
                                    isUploadedSlot && (isDark ? 'text-emerald-400' : 'text-emerald-600'),
                                    isDark
                                        ? 'bg-white/[0.04] text-white border-white/8 focus-visible:border-white/20'
                                        : 'bg-slate-50 border-slate-200 focus-visible:border-slate-400'
                                )}
                            />
                        </div>
                        <label className={cn(
                            'h-9 px-2 rounded-xl border-2 flex items-center gap-1 font-black text-[10px] uppercase tracking-wide cursor-pointer flex-shrink-0 transition-all select-none',
                            isDark
                                ? 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                        )}>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                        try {
                                            const result = await upload(f, { purpose: 'library', storagePreference: 'r2', folder: 'images' });
                                            if (result?.url) {
                                                const next = [...imageUrls];
                                                next[imgIdx] = result.url;
                                                onSync(item.id, next);
                                            }
                                        } catch { toast.error('Upload failed'); }
                                    }
                                }}
                            />
                            {isUploadingSlot
                                ? <><Loader2 size={10} className="animate-spin" /> {progress}%</>
                                : <><Upload size={10} /> Upload</>
                            }
                        </label>
                        <button
                            type="button"
                            onClick={() => onLibraryRequest(`${item.id}:${imgIdx}`)}
                            className={cn(
                                'h-9 px-2 rounded-xl border-2 flex items-center gap-1 font-black text-[10px] uppercase tracking-wide flex-shrink-0 transition-all',
                                isDark
                                    ? 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                    : 'border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                            )}
                        >
                            <Library size={10} /> Lib
                        </button>
                        {imageUrls.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const next = imageUrls.filter((_, i) => i !== imgIdx);
                                    onSync(item.id, next);
                                }}
                                className={cn(
                                    'h-9 w-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                    isDark
                                        ? 'border-white/10 text-slate-600 hover:border-rose-500/30 hover:text-rose-400'
                                        : 'border-slate-200 text-slate-300 hover:border-rose-200 hover:text-rose-500'
                                )}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                );
            })}
            <button
                type="button"
                onClick={() => onSync(item.id, [...imageUrls, ''])}
                className={cn(
                    'h-8 rounded-xl border-2 border-dashed flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wide transition-all',
                    isDark
                        ? 'border-white/10 text-slate-600 hover:border-white/20 hover:text-slate-300'
                        : 'border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
                )}
            >
                <Plus size={11} /> Add Another Image
            </button>
        </div>
    );
}
