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
    useCloudflareStream?: boolean;
}

export function VideoUpload({ 
    value, 
    onChange, 
    label, 
    description, 
    isDark = false, 
    compact = false, 
    folder,
    useCloudflareStream = false
}: VideoUploadProps) {
    const { profile } = useAuth();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    // Only super-admins can use the media library through this component
    const isSuperAdmin = profile?.role === 'super_admin';

    const handlePickerClick = () => {
        if (!isSuperAdmin) return;
        setIsPickerOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isSuperAdmin) return;

        // Basic validation
        if (!file.type.startsWith('video/')) {
            toast.error('Please upload a valid video file');
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(5);
            
            if (useCloudflareStream) {
                // Cloudflare Stream path
                const res = await fetch('/api/media/stream-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name }),
                });
                
                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Failed to initialise stream upload');
                }
                
                const { uploadUrl, uid } = await res.json();
                
                const xhr = new XMLHttpRequest();
                xhr.open('POST', uploadUrl, true);
                
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percent);
                    }
                };
                
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        onChange(`cf-stream://${uid}`);
                        setUploadProgress(100);
                        toast.success('Video uploaded to Cloudflare Stream');
                    } else {
                        toast.error('Cloudflare upload failed');
                    }
                    setIsUploading(false);
                };

                xhr.onerror = () => {
                    toast.error('Network error during upload');
                    setIsUploading(false);
                };

                const fd = new FormData();
                fd.append('file', file);
                xhr.send(fd);
            } else {
                // R2 path
                const formData = new FormData();
                formData.append('file', file);
                if (folder) formData.append('folder', folder);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/media/upload', true);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 90) + 5;
                        setUploadProgress(percent);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        const response = JSON.parse(xhr.responseText);
                        onChange(response.url);
                        setUploadProgress(100);
                        toast.success('Video uploaded to R2 successfully');
                    } else {
                        toast.error('Upload failed');
                    }
                    setIsUploading(false);
                };

                xhr.onerror = () => {
                    toast.error('Upload failed');
                    setIsUploading(false);
                };

                xhr.send(formData);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            setIsUploading(false);
            toast.error(error.message || 'An error occurred during upload');
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
                                        {isSuperAdmin 
                                            ? useCloudflareStream ? 'Upload to Stream' : 'Browse R2 Library' 
                                            : 'Admin Restricted'}
                                    </p>
                                    <p className={`text-[10px] mt-1 font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {isSuperAdmin 
                                            ? useCloudflareStream ? 'High-Performance Video' : 'MP4, WebM up to 50MB' 
                                            : 'Managed by Super Admin'}
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
                                <><UploadCloud size={14} /> {useCloudflareStream ? 'Stream Upload' : 'Upload Video'}</>
                            )}
                            <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} disabled={isUploading} />
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
                                Browse {useCloudflareStream ? 'Stream' : 'R2'} Library
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

