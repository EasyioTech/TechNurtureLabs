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
    const [isNormalizing, setIsNormalizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
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

        // Gap #3: Proactive Filter for Risky Formats
        const riskyExtensions = ['.mov', '.mkv', '.avi', '.wmv'];
        const fileName = file.name.toLowerCase();
        const isRisky = riskyExtensions.some(ext => fileName.endsWith(ext));
        
        if (isRisky) {
            toast.warning(`"${file.name.split('.').pop()?.toUpperCase()}" files often fail processing. If it gets stuck, re-encode to MP4.`);
        }

        // Validate video file type
        if (!file.type.startsWith('video/')) {
            toast.error('Please upload a valid video file');
            return;
        }

        // Safeguard: File integrity check
        if (file.size < 100000) {
            toast.error("File seems corrupted or too small (min 100KB)");
            return;
        }

        const executeUpload = async (isRetry = false) => {
            let uid = '';
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

                const data = await initRes.json();
                uid = data.uid;
                const uploadURL = data.uploadURL;

                const upload = new tus.Upload(file, {
                    uploadUrl: uploadURL,
                    uploadDataDuringCreation: true,
                    overridePatchMethod: true, // 🔥 CRITICAL FIX
                    // @ts-ignore - Disable resume system
                    fingerprint: () => null, 
                    retryDelays: [0, 3000, 5000],
                    chunkSize: 5 * 1024 * 1024,
                    removeFingerprintOnSuccess: true,
                    metadata: { filename: file.name, filetype: file.type },
                    onError: (error) => {
                        console.error("TUS FULL ERROR:", error);
                        throw error;
                    },
                    onProgress: (bytesUploaded, bytesTotal) => {
                        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                        setUploadProgress(percentage);
                    },
                    onSuccess: async () => {
                        console.log("Upload finished, verifying state...");
                        setUploadProgress(100);
                        
                        try {
                            // Gap #2: Stagnant Processing Detection
                            let isReady = false;
                            let lastPct = -1;
                            let stagnantCount = 0;

                            for (let i = 0; i < 60; i++) { // Max 3 mins
                                const statusRes = await fetch(`/api/media/stream-status/${uid}`);
                                if (statusRes.ok) {
                                    const data = await statusRes.json();
                                    
                                    // Gap #1: Fix API Shape Alignment
                                    const state = data.status?.state || data.state;
                                    const ready = data.readyToStream;
                                    const pct = parseFloat(data.status?.pctComplete || '0');

                                    if (ready) {
                                        isReady = true;
                                        break;
                                    }

                                    // Root Cause Detection: Explicit Cloudflare Error
                                    if (state === 'error') {
                                        throw new Error('Cloudflare encoding failed. Incompatible format or VFR.');
                                    }

                                    // Stagnant check
                                    if (pct === lastPct && pct < 100) {
                                        stagnantCount++;
                                    } else {
                                        stagnantCount = 0;
                                        lastPct = pct;
                                    }

                                    if (stagnantCount > 12) { // Stalled for ~36s
                                        throw new Error('Processing stalled. File likely requires re-encoding.');
                                    }
                                }
                                await new Promise(r => setTimeout(r, 3000));
                            }

                            if (!isReady) throw new Error('Processing timeout');

                            onChange(`cf-stream://${uid}`);
                            toast.success('Video ready and processed');
                        } catch (err: any) {
                            throw err; // Caught by outer block
                        }
                    },
                });

                tusUploadRef.current = upload;
                upload.start();

            } catch (error: any) {
                // Gap #4: Retry Strategy
                if (!isRetry && !error.message.includes('re-encode')) {
                    console.log('Ingest failed, attempting one-time auto-retry...');
                    toast.info("Retrying processing...");
                    if (uid) await fetch(`/api/media/stream-status/${uid}`, { method: 'DELETE' });
                    return executeUpload(true);
                }

                // Gap #5: Normalization Escalation (Guaranteed Fix)
                if (isRetry) {
                    setIsNormalizing(true);
                    toast.info("Initial processing failed. Normalizing on server...");
                    try {
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        const normRes = await fetch('/api/media/normalize', {
                            method: 'POST',
                            body: formData
                        });

                        if (!normRes.ok) {
                            const error = await normRes.json();
                            throw new Error(error.error || 'Normalization pipeline failed');
                        }
                        
                        const { jobId } = await normRes.json();
                        toast.info("Normalization queued. This may take 1-2 minutes...");

                        // Poll for Job Completion
                        let attempts = 0;
                        let finalUid = null;

                        while (attempts < 40) { // 40 * 3s = 2 minutes
                            const jobRes = await fetch(`/api/media/jobs/${jobId}`);
                            if (jobRes.ok) {
                                const jobData = await jobRes.json();
                                if (jobData.state === 'completed' && jobData.result?.uid) {
                                    finalUid = jobData.result.uid;
                                    break;
                                }
                                if (jobData.state === 'failed') {
                                    throw new Error(`Normalization failed: ${jobData.failedReason || 'Unknown error'}`);
                                }
                            }
                            await new Promise(r => setTimeout(r, 3000));
                            attempts++;
                        }

                        if (!finalUid) throw new Error('Normalization timed out');

                        onChange(`cf-stream://${finalUid}`);
                        toast.success('Video repaired and processed');
                        setIsNormalizing(false);
                        setIsUploading(false);
                        return;
                    } catch (normErr) {
                        console.error('[Escalation Error]:', normErr);
                        setIsNormalizing(false);
                    }
                }

                // Final Failure Cleanup
                if (uid) {
                    try { await fetch(`/api/media/stream-status/${uid}`, { method: 'DELETE' }); } catch (e) {}
                }
                
                const finalMsg = error.message.includes('re-encode') 
                    ? error.message 
                    : `Upload failed. Processing error or malformed file.`;
                
                toast.error(finalMsg);
                setIsUploading(false);
                setUploadProgress(0);
            }
        };

        executeUpload();
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
                            {(isUploading || isNormalizing) && (
                                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                                    <p className="text-white font-bold text-lg mb-1">
                                        {isNormalizing ? 'Repairing & Processing' : 'Processing Video'}
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        {isNormalizing ? 'This may take a few minutes for large files...' : 'Standardizing for all devices...'}
                                    </p>
                                </div>
                            )}
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

