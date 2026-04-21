'use client';

import React, { useState } from 'react';
import { Video, UploadCloud, Loader2 } from 'lucide-react';
import { MediaLibraryPicker } from '@/modules/super-admin/components/media-library-picker';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import * as tus from 'tus-js-client';

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
    const lastFileHashRef = React.useRef<string | null>(null);
    
    // Only super-admins can use the media library through this component
    const isSuperAdmin = profile?.role === 'super_admin';

    const handlePickerClick = () => {
        if (!isSuperAdmin) return;
        setIsPickerOpen(true);
    };

    const parseErrorResponse = (response: Response): string => {
        try {
            const json = response.statusText || 'Upload failed';
            return json;
        } catch {
            return 'Upload failed with status ' + response.status;
        }
    };

    const cancelUpload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    const computeFileHash = (file: File): string => {
        return `${file.name}|${file.size}|${file.type}|${file.lastModified}`;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isSuperAdmin) return;

        if (!file.type.startsWith('video/')) {
            toast.error('Please upload a valid video file');
            return;
        }

        const fileHash = computeFileHash(file);
        if (lastFileHashRef.current === fileHash && value) {
            toast.info('This video was already uploaded');
            return;
        }

        abortControllerRef.current = new AbortController();

        try {
            setIsUploading(true);
            setUploadProgress(1); // Analysis phase

            // ─── STEP 1: PRE-UPLOAD ANALYSIS ─────────────────────────────────────────
            // We analyze the video to detect its duration and metadata location.
            // This prevents "Infinite Loop" processing in Cloudflare Stream and 
            // resolves "hundreds of minutes" duration reporting errors.
            
            const analyzeVideo = (f: File): Promise<{ duration: number, isFastStart: boolean }> => {
                return new Promise((resolve) => {
                    const video = document.createElement('video');
                    video.preload = 'metadata';
                    const videoUrl = URL.createObjectURL(f);
                    
                    const timeout = setTimeout(() => {
                        cleanup();
                        resolve({ duration: 0, isFastStart: false });
                    }, 4000);

                    const cleanup = () => {
                        clearTimeout(timeout);
                        video.onloadedmetadata = null;
                        video.onerror = null;
                        URL.revokeObjectURL(videoUrl);
                    };

                    video.onloadedmetadata = () => {
                        const duration = video.duration;
                        cleanup();
                        
                        // Check for moov atom in first 128KB (Fast Start)
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const buffer = e.target?.result as ArrayBuffer;
                            if (!buffer) return resolve({ duration, isFastStart: false });
                            
                            const bytes = new Uint8Array(buffer);
                            let isFastStart = false;
                            // Search for 'moov' string
                            for (let i = 0; i < bytes.length - 4; i++) {
                                if (bytes[i] === 109 && bytes[i+1] === 111 && bytes[i+2] === 111 && bytes[i+3] === 118) {
                                    isFastStart = true;
                                    break;
                                }
                            }
                            resolve({ duration, isFastStart });
                        };
                        reader.readAsArrayBuffer(f.slice(0, 131072)); // 128KB
                    };

                    video.onerror = () => {
                        cleanup();
                        resolve({ duration: 0, isFastStart: false });
                    };

                    video.src = videoUrl;
                });
            };

            const { duration: durationHint, isFastStart } = await analyzeVideo(file);
            
            if (!isFastStart && durationHint > 0) {
                toast.info('Non-optimized video detected. Stabilizing metadata markers...', { icon: '⚙️' });
            } else if (!isFastStart && durationHint === 0) {
                toast.warning('Metadata markers not found at start. Processing may take longer.', { duration: 5000 });
            }

            setUploadProgress(5);
            // ─────────────────────────────────────────────────────────────────────────

            const getCsrfToken = () => {
                const cookieStr = document.cookie;
                const match = cookieStr.match(/csrf_token=([^;]+)/);
                return match?.[1] || '';
            };

            const csrfToken = getCsrfToken();
            const res = await fetch('/api/media/stream-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    durationHint: durationHint // Pass hint to CF Stream via API
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!res.ok) {
                let errorMsg = parseErrorResponse(res);
                try {
                    const errorData = await res.json();
                    errorMsg = errorData.error || errorMsg;
                } catch {
                    // use default errorMsg if JSON parsing fails
                }
                throw new Error(errorMsg);
            }

            let uploadData;
            try {
                uploadData = await res.json();
            } catch {
                throw new Error('Server returned invalid response');
            }

            const { uploadUrl, uid, isResumable } = uploadData;

            if (!uploadUrl || !uid) {
                throw new Error('Missing upload URL or video ID');
            }

            // TUS Resumable Upload via server proxy (no CORS issues)
            // Server proxy relays all TUS requests to Cloudflare
            const proxiedUrl = `/api/media/tus-proxy?url=${encodeURIComponent(uploadUrl)}`;
            console.log('[Upload System] Initializing proxied TUS upload:', uid);

            const tusUpload = new tus.Upload(file, {
                uploadUrl: proxiedUrl,
                chunkSize: 5 * 1024 * 1024,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                parallelUploads: 1,
                storeFingerprintForResuming: false, // CRITICAL: Force use of proxy URL, don't resume direct CF URLs
                removeFingerprintOnSuccess: true,
                headers: {
                    'Tus-Resumable': '1.0.0',
                },
                metadata: {
                    filename: file.name,
                    filetype: file.type,
                },
                onError: (error) => {
                    console.error('[TUS Error Detail]:', error);
                    // Handle specific CORS/Network failures
                    if (error.message?.includes('Access-Control-Allow-Origin') || error.message?.includes('CORS')) {
                        toast.error('CORS Blocked: Please ensure this domain is added to "Allowed Origins" in your Cloudflare Stream settings.', { duration: 8000 });
                    } else {
                        const msg = error.message?.includes('400')
                            ? 'Upload error: Metadata mismatch or expired URL'
                            : `Upload failed: ${error.message || 'Unknown error'}`;
                        toast.error(msg);
                    }
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percent = Math.round((bytesUploaded / bytesTotal) * 100);
                    setUploadProgress(percent);
                },
                onSuccess: () => {
                    lastFileHashRef.current = fileHash;
                    onChange(`cf-stream://${uid}`);
                    setUploadProgress(100);
                    toast.success('Video uploaded successfully');
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
            });

            tusUpload.start();
        } catch (error: any) {
            if (error.name === 'AbortError') {
                toast.info('Upload cancelled');
            } else {
                toast.error(error.message || 'An error occurred during upload');
            }
        } finally {
            setIsUploading(false);
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

