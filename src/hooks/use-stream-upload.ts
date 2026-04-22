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
export function useStreamUpload(options?: UseStreamUploadOptions): UseStreamUploadReturn {
    const [isUploading, setIsUploading] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    const xhrRef = React.useRef<XMLHttpRequest | null>(null);
    const cancelledRef = React.useRef(false);

    React.useEffect(() => {
        return () => {
            if (xhrRef.current) {
                xhrRef.current.abort();
            }
        };
    }, []);

    const cancel = React.useCallback(() => {
        cancelledRef.current = true;
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
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

                // Step 1: Initialize upload with CF Stream API
                // Returns a signed uploadURL (basic POST for <200MB, TUS for >=200MB)
                const initRes = await fetch('/api/media/stream-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileSize: file.size
                    }),
                });

                if (!initRes.ok) {
                    throw new Error('Failed to initialize upload with Cloudflare Stream');
                }

                const { uploadURL, uid } = await initRes.json();

                // Step 2: Upload based on file size
                const MAX_DIRECT_UPLOAD_SIZE = 200 * 1024 * 1024; // 200MB

                if (file.size < MAX_DIRECT_UPLOAD_SIZE) {
                    // Small files: use basic POST (multipart/form-data)
                    await uploadViaBasicPost(uploadURL, file);
                } else {
                    // Large files: use TUS protocol (resumable, chunked)
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
                const msg = error.message.includes('cancelled')
                    ? 'Upload cancelled'
                    : `Upload failed: ${error.message}`;
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

                xhrRef.current = upload as any;

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
