'use client';

import React, { useState } from 'react';
import { Video, UploadCloud, Loader2 } from 'lucide-react';
import { MediaLibraryPicker } from '@/modules/super-admin/components/media-library-picker';
import { useAuth } from '@/components/providers/auth-provider';
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
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const abortControllerRef = React.useRef<AbortController | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Only super-admins can use the media library through this component
    const isSuperAdmin = profile?.role === 'super_admin';

    const handlePickerClick = () => {
        if (!isSuperAdmin) return;
        setIsPickerOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isSuperAdmin) return;

        // Validate video file type
        if (!file.type.startsWith('video/')) {
            toast.error('Please upload a valid video file');
            return;
        }

        // Max 5GB per Cloudflare Stream limits
        if (file.size > 5 * 1024 * 1024 * 1024) {
            toast.error('Video must be smaller than 5GB');
            return;
        }

        abortControllerRef.current = new AbortController();

        try {
            setIsUploading(true);
            setUploadProgress(5);

            const getCsrfToken = () => {
                const cookieStr = document.cookie;
                const match = cookieStr.match(/csrf_token=([^;]+)/);
                return match?.[1] || '';
            };

            // Step 1: Get upload URL from our API
            const csrfToken = getCsrfToken();
            const initRes = await fetch('/api/media/stream-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
                },
                body: JSON.stringify({
                    fileName: file.name
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!initRes.ok) {
                const error = await initRes.json().catch(() => ({ error: 'Failed to get upload URL' }));
                throw new Error(error.error || 'Failed to initialize upload');
            }

            const { uploadUrl, uid } = await initRes.json();
            if (!uploadUrl || !uid) {
                throw new Error('Server returned invalid upload data');
            }

            setUploadProgress(10);

            // Step 2: Upload video directly to Cloudflare Stream
            // Using Direct Creator Upload (Cloudflare Stream best practice)
            const uploadRes = await fetch(uploadUrl, {
                method: 'POST',
                body: file,
                signal: abortControllerRef.current.signal,
                headers: {
                    'Content-Type': file.type || 'video/mp4',
                }
            });

            // Track progress during upload
            if (uploadRes.body) {
                const reader = uploadRes.body.getReader();
                const contentLength = uploadRes.headers.get('content-length');
                let receivedLength = 0;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    receivedLength += value.length;
                    if (contentLength) {
                        const percent = Math.round((receivedLength / parseInt(contentLength)) * 100);
                        setUploadProgress(Math.min(10 + percent, 99));
                    }
                }
            }

            if (!uploadRes.ok) {
                throw new Error(`Upload failed: ${uploadRes.statusText}`);
            }

            // Success! Store the Stream video reference
            setUploadProgress(100);
            onChange(`cf-stream://${uid}`);
            toast.success('Video uploaded to Cloudflare Stream');

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                toast.info('Upload cancelled');
            } else {
                toast.error(error.message || 'Failed to upload video');
                console.error('[Video Upload Error]:', error);
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            abortControllerRef.current = null;
        }
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
                        ${isSuperAdmin ? 'cursor-pointer' : 'cursor-default opacity-90'}
                        ${value
                            ? 'border-transparent bg-slate-900'
                            : isDark
                                ? 'border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-white/[0.08]'
                                : 'border-slate-200 bg-slate-50 hover:border-indigo-500 hover:bg-white'
                        }
                    `}
                >
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
                                        {isSuperAdmin ? 'Upload to Stream' : 'Admin Restricted'}
                                    </p>
                                    <p className={`text-[10px] mt-1 font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {isSuperAdmin ? 'High-Performance Video' : 'Managed by Super Admin'}
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {isSuperAdmin && (
                    <div className="flex gap-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-all border-2
                            ${isDark 
                                ? 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.08] hover:border-white/10' 
                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:shadow-sm'
                            }
                        `}>
                            {isUploading ? (
                                <><Loader2 size={14} className="animate-spin" /> {uploadProgress}%</>
                            ) : (
                                <><UploadCloud size={14} /> Upload Video</>
                            )}
                            <input ref={fileInputRef} type="file" className="hidden" accept="video/*" onChange={handleFileUpload} disabled={isUploading} />
                        </label>

                        {!value && (
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
                )}
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

