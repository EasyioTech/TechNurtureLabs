'use client';

import * as tus from 'tus-js-client';
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
    const tusUploadRef = React.useRef<tus.Upload | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Cleanup: abort upload on unmount
    React.useEffect(() => {
        return () => {
            if (tusUploadRef.current) {
                tusUploadRef.current.abort();
            }
        };
    }, []);

    const handlePickerClick = () => {
        setIsPickerOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

        try {
            setIsUploading(true);
            setUploadProgress(0);

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
                    fileName: file.name,
                    fileSize: file.size
                })
            });

            if (!initRes.ok) {
                const error = await initRes.json().catch(() => ({ error: 'Failed to get upload URL' }));
                throw new Error(error.error || 'Failed to initialize upload');
            }

            const { uploadURL, uid } = await initRes.json();

            let uploadSucceeded = false;
            let uploadTimeoutId: NodeJS.Timeout | null = null;

            // Step 3: Upload using TUS with comprehensive error handling
            const upload = new tus.Upload(file, {
                endpoint: uploadURL,
                // Aggressive retry strategy for network resilience
                retryDelays: [0, 3000, 5000, 10000, 20000, 30000, 60000],
                chunkSize: 50 * 1024 * 1024, // 50MB chunks for better reliability on large files
                removeFingerprintOnSuccess: true, // Clean up resume fingerprint after success
                metadata: {
                    filename: file.name,
                    filetype: file.type,
                },
                onError: (error) => {
                    if (uploadTimeoutId) clearTimeout(uploadTimeoutId);

                    // Don't show error if already succeeded
                    if (!uploadSucceeded) {
                        console.error('[Video Upload] TUS Error:', error);
                        toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
                        setIsUploading(false);
                        setUploadProgress(0);
                    }
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = (bytesUploaded / bytesTotal) * 100;
                    setUploadProgress(Math.round(percentage));
                },
                onSuccess: () => {
                    uploadSucceeded = true;
                    if (uploadTimeoutId) clearTimeout(uploadTimeoutId);

                    console.log('[Video Upload] Upload successful, UID:', uid);
                    setUploadProgress(100);
                    onChange(`cf-stream://${uid}`);
                    toast.success('Video uploaded successfully');
                    setIsUploading(false);
                    tusUploadRef.current = null;
                },
            });

            tusUploadRef.current = upload;

            // Safety timeout: if TUS hangs for >5 minutes, force cleanup
            // This prevents infinite processing loops when TUS stalls
            uploadTimeoutId = setTimeout(() => {
                if (!uploadSucceeded && tusUploadRef.current) {
                    console.error('[Video Upload] Timeout: upload did not complete in 5 minutes');
                    toast.error('Upload took too long. Please try again or use a smaller file.');
                    tusUploadRef.current.abort(true); // true = don't retry
                    setIsUploading(false);
                    setUploadProgress(0);
                    tusUploadRef.current = null;
                }
            }, 5 * 60 * 1000);

            upload.start();

        } catch (error: any) {
            toast.error(error.message || 'Failed to upload video');
            console.error('[Video Upload Error]:', error);
            setIsUploading(false);
            setUploadProgress(0);
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
                        cursor-pointer
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
                                <><Loader2 size={14} className="animate-spin" /> {uploadProgress}%</>
                            ) : (
                                <><UploadCloud size={14} /> Upload Video</>
                            )}
                            <input ref={fileInputRef} type="file" className="hidden" accept="video/*" onChange={handleFileUpload} disabled={isUploading} />
                        </label>

                        {isUploading && (
                            <button
                                onClick={() => {
                                    if (tusUploadRef.current) {
                                        tusUploadRef.current.abort(true);
                                        tusUploadRef.current = null;
                                    }
                                    setIsUploading(false);
                                    setUploadProgress(0);
                                    toast.info('Upload cancelled');
                                }}
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

