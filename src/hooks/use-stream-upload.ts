'use client';

import React from 'react';
import { toast } from 'sonner';
import * as tus from 'tus-js-client';

interface UseStreamUploadOptions {
    onSuccess?: (uid: string) => Promise<void> | void;
}

export interface UseStreamUploadReturn {
    uploadVideo: (file: File) => Promise<string | null>;
    isUploading: boolean;
    progress: number;
    cancel: () => void;
}

/**
 * Universal Cloudflare Stream Video Uploader
 *
 * Supports TWO upload methods based on file size:
 *
 * **Small files (< 200MB):**
 * 1. POST to /api/media/stream-upload → get direct upload URL
 * 2. POST file as multipart/form-data to uploadURL (simple, fast)
 *
 * **Large files (>= 200MB):**
 * 1. POST to /api/media/stream-upload → get TUS upload URL
 * 2. Use tus-js-client for resumable/chunked upload (supports large files)
 *
 * 3. CF processes asynchronously, returns 200 immediately
 * 4. Webhook notifies when processing complete
 *
 * This hook is used by:
 * - lesson-dialog.tsx (lesson video blocks)
 * - media-library-picker.tsx (library uploads)
 * - video-upload.tsx (generic video component)
 */
/**
 * Maps upload errors to user-friendly messages based on HTTP status or error type
 */
function getUploadErrorMessage(error: any): string {
    const msg = (error?.message ?? '').toLowerCase();

    // Status code checks (error message or underlying cause)
    if (msg.includes('401') || msg.includes('unauthorized')) {
        return 'Upload authentication failed. Please refresh and try again.';
    }
    if (msg.includes('402') || msg.includes('payment')) {
        return 'Account storage quota exceeded. Contact your administrator.';
    }
    if (msg.includes('413') || msg.includes('too large') || msg.includes('payload')) {
        return 'Upload chunk too large. Please try again.';
    }
    if (msg.includes('422') || msg.includes('unprocessable')) {
        return 'Video codec not supported. Use H.264/AAC MP4.';
    }
    if (msg.includes('429') || msg.includes('too many')) {
        return 'Too many uploads in progress. Please wait and retry.';
    }
    if (msg.includes('cancelled')) {
        return 'Upload cancelled.';
    }
    if (msg.includes('network')) {
        return 'Network error. Please check your connection and retry.';
    }
    if (msg.includes('timeout')) {
        return 'Upload timed out. Please retry.';
    }

    return `Upload failed: ${error?.message || 'Unknown error'}`;
}

export function useStreamUpload(options?: UseStreamUploadOptions): UseStreamUploadReturn {
    const [isUploading, setIsUploading] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    const xhrRef = React.useRef<XMLHttpRequest | null>(null);
    const tusRef = React.useRef<tus.Upload | null>(null);
    const cancelledRef = React.useRef(false);

    React.useEffect(() => {
        return () => {
            if (xhrRef.current) {
                xhrRef.current.abort();
            }
            if (tusRef.current) {
                tusRef.current.abort();
            }
        };
    }, []);

    const cancel = React.useCallback(() => {
        cancelledRef.current = true;
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
        }
        if (tusRef.current) {
            tusRef.current.abort();
            tusRef.current = null;
        }
        setIsUploading(false);
        setProgress(0);
        toast.info('Upload cancelled');
    }, []);

    const uploadVideo = React.useCallback(
        async (file: File): Promise<string | null> => {
            cancelledRef.current = false;
            setProgress(0);

            try {
                setIsUploading(true);

                // GUARD 1: File size must not exceed 30GB (Cloudflare hard limit)
                const MAX_FILE_SIZE = 30 * 1024 * 1024 * 1024; // 30GB
                if (file.size > MAX_FILE_SIZE) {
                    const sizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
                    const errorMsg = `Video exceeds 30GB maximum (file is ${sizeGB}GB)`;
                    toast.error(errorMsg);
                    return null;
                }

                // GUARD 2: Validate file type is a video
                const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska', 'application/octet-stream'];
                const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'mkv', 'webm', 'avi', 'flv', 'wmv', 'm4v', 'mts', 'ts', 'mpg', 'mpeg'];

                const fileExt = file.name.split('.').pop()?.toLowerCase();
                const isValidMime = file.type === '' || ALLOWED_MIME_TYPES.includes(file.type) || file.type.startsWith('video/');
                const isValidExt = fileExt && ALLOWED_EXTENSIONS.includes(fileExt);

                if (!isValidExt || (file.type && !isValidMime)) {
                    const errorMsg = `Only video files are supported (MP4, MOV, MKV, WebM, AVI, FLV, WMV). Got: ${file.type || fileExt || 'unknown type'}`;
                    toast.error(errorMsg);
                    return null;
                }

                // Step 1: Initialize upload with CF Stream API
                // Returns uploadURL based on file size:
                // - <200MB: direct Cloudflare URL (basic POST)
                // - >=200MB: our proxy URL (TUS via server)
                const initRes = await fetch('/api/media/stream-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type,
                    }),
                });

                if (!initRes.ok) {
                    const errorData = await initRes.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || 'Failed to initialize upload with Cloudflare Stream');
                }

                const { uploadURL, uid, isTus } = await initRes.json();

                // Step 2: Upload based on file size
                if (!isTus) {
                    // Small files (<200MB): use basic POST (multipart/form-data)
                    await uploadViaBasicPost(uploadURL, file);
                } else {
                    // Large files (>=200MB): use TUS protocol via server proxy
                    await uploadViaTus(uploadURL, file);
                }

                if (cancelledRef.current) throw new Error('Upload cancelled');

                setIsUploading(false);
                setProgress(100);

                // Step 3: Return URL immediately
                // CF processes asynchronously in background
                // Embed player shows "processing" state until ready
                // Webhook invalidates cache when encoding completes
                options?.onSuccess?.(`cf-stream://${uid}`);
                return uid;
            } catch (error: any) {
                setIsUploading(false);
                const msg = getUploadErrorMessage(error);
                toast.error(msg);
                return null;
            }
        },
        [options]
    );

    // Helper: Upload via basic POST (for files < 200MB)
    const uploadViaBasicPost = React.useCallback(
        async (uploadURL: string, file: File): Promise<void> => {
            return new Promise<void>((resolve, reject) => {
                if (cancelledRef.current) return reject(new Error('Upload cancelled'));

                const xhr = new XMLHttpRequest();
                const formData = new FormData();
                formData.append('file', file);

                // Track upload progress
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        setProgress(Math.min(99, percent));
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload cancelled'));
                });

                xhrRef.current = xhr;

                if (cancelledRef.current) {
                    reject(new Error('Upload cancelled'));
                    return;
                }

                // POST multipart form to signed upload URL
                // Do NOT set Content-Type header — browser sets it automatically with boundary
                xhr.open('POST', uploadURL);
                xhr.send(formData);
            });
        },
        []
    );

    // Helper: Upload via TUS protocol (for files >= 200MB)
    const uploadViaTus = React.useCallback(
        async (uploadURL: string, file: File): Promise<void> => {
            return new Promise<void>((resolve, reject) => {
                if (cancelledRef.current) return reject(new Error('Upload cancelled'));

                const upload = new tus.Upload(file, {
                    endpoint: uploadURL,
                    retryDelays: [0, 3000, 5000, 10000, 20000],
                    chunkSize: 50 * 1024 * 1024, // 50MB chunks (Cloudflare recommended)
                    uploadSize: file.size, // Required for Cloudflare TUS
                    metadata: {
                        name: file.name,
                        filetype: file.type,
                    },
                    onError: (error) => {
                        if (cancelledRef.current) return;
                        reject(new Error(`TUS upload failed: ${error.message}`));
                    },
                    onProgress: (bytesSent, bytesTotal) => {
                        if (!cancelledRef.current) {
                            const percent = Math.round((bytesSent / bytesTotal) * 100);
                            setProgress(Math.min(99, percent));
                        }
                    },
                    onSuccess: () => {
                        if (!cancelledRef.current) {
                            resolve();
                        }
                    },
                });

                // Store TUS upload reference for proper cancellation
                tusRef.current = upload;

                if (cancelledRef.current) {
                    reject(new Error('Upload cancelled'));
                    return;
                }

                upload.start();
            });
        },
        []
    );

    return {
        uploadVideo,
        isUploading,
        progress,
        cancel,
    };
}
