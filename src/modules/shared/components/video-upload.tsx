'use client';

import React, { useState } from 'react';
import { Video, UploadCloud, Loader2 } from 'lucide-react';
import { MediaLibraryPicker } from '@/modules/super-admin/components/media-library-picker';
import { useAuth } from '@/components/providers/auth-provider';
import { useStreamUpload } from '@/hooks/use-stream-upload';
import { toast } from 'sonner';

interface VideoUploadProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    description?: string;
    isDark?: boolean;
    compact?: boolean;
    folder?: string;
}

export function VideoUpload({
    value,
    onChange,
    label,
    description,
    isDark = false,
    compact = false,
    folder
}: VideoUploadProps) {
    const { profile } = useAuth();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Use shared upload hook
    const { uploadVideo, isUploading, progress, cancel } = useStreamUpload({
        onSuccess: async (url: string) => {
            onChange(url);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    });

    const handlePickerClick = () => {
        setIsPickerOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 30 * 1024 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('File size limit is 30GB');
            return;
        }

        await uploadVideo(file);
    };

    return (
        <div className="space-y-4 w-full">
            {label && (
                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {label}
                </label>
            )}

            <div className="flex flex-col gap-3">
                <div
                    className={`relative aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden
                        cursor-pointer
                        ${value
                            ? 'border-transparent bg-slate-900'
                            : isDark
                                ? 'border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-white/[0.08]'
                                : 'border-slate-200 bg-slate-50 hover:border-indigo-500 hover:bg-white'
                        }
                    `}
                >
                    {isUploading && (
                        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                            <p className="text-white font-bold text-lg mb-1">Processing Video</p>
                            <p className="text-slate-400 text-sm">Uploading to Stream...</p>
                            <p className="text-slate-400 text-xs mt-2">{progress}%</p>
                        </div>
                    )}
                    {value ? (
                        <>
                            {value.startsWith('cf-stream://') || (value.length === 32 && !value.includes('/') && !value.includes('.')) ? (
                                <iframe
                                    src={`https://iframe.videodelivery.net/${value.replace('cf-stream://', '')}`}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video src={value} className="w-full h-full object-contain" controls />
                            )}
                        </>
                    ) : (
                        <div onClick={handlePickerClick} className="flex flex-col items-center">
                            <div className={`${compact ? 'w-8 h-8 rounded-xl' : 'w-12 h-12 rounded-2xl'} flex items-center justify-center ${compact ? '' : 'mb-3'} ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <Video size={compact ? 16 : 24} />
                            </div>
                            {!compact && (
                                <>
                                    <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Upload to Stream
                                    </p>
                                    <p className={`text-[10px] mt-1 font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        High-Performance Video
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-all border-2
                            ${isDark
                                ? 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.08] hover:border-white/10'
                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:shadow-sm'
                            }
                        `}>
                            {isUploading ? (
                                <><Loader2 size={14} className="animate-spin" /> {progress}%</>
                            ) : (
                                <><UploadCloud size={14} /> Upload Video</>
                            )}
                            <input ref={fileInputRef} type="file" className="hidden" accept="*/*" onChange={handleFileUpload} disabled={isUploading} />
                        </label>

                        {isUploading && (
                            <button
                                onClick={cancel}
                                className={`flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border-2
                                    ${isDark
                                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                        : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                                    }
                                `}
                            >
                                Cancel Upload
                            </button>
                        )}

                        {!value && !isUploading && (
                            <button
                                onClick={handlePickerClick}
                                className={`flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border-2
                                    ${isDark
                                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
                                        : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
                                    }
                                `}
                            >
                                Browse Stream Library
                            </button>
                        )}
                </div>
            </div>

            {description && (
                <p className={`text-[10px] font-medium leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {description}
                </p>
            )}

            <MediaLibraryPicker
                open={isPickerOpen}
                onOpenChange={setIsPickerOpen}
                onSelect={(url: string) => {
                    onChange(url);
                    setIsPickerOpen(false);
                }}
                filterType="video"
                folder={folder}
                currentUrl={value}
            />
        </div>
    );
}

