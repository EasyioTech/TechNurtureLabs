'use client';

import React from 'react';
import { toast } from 'sonner';

interface UseStreamUploadOptions {
    onSuccess?: (uid: string) => Promise<void> | void;
}

export interface UseStreamUploadReturn {
    uploadVideo: (file: File) => Promise<string | null>;
    isUploading: boolean;
    progress: number;
    cancel: () => void;
}

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

                // Step 1: Get signed upload URL from Cloudflare Stream via our server
                const initRes = await fetch('/api/media/stream-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
                });

                if (!initRes.ok) throw new Error('Failed to initialize upload');
                const { uploadURL, uid } = await initRes.json();

                // Step 2: Upload entire file directly to Cloudflare Stream (POST only, no PATCH)
                // CF's direct_upload endpoint rejects PATCH requests.
                // Uses simple XHR POST for maximum compatibility.
                await new Promise<void>((resolve, reject) => {
                    if (cancelledRef.current) return reject(new Error('Upload cancelled'));

                    const xhr = new XMLHttpRequest();

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
                            reject(new Error(`Upload failed: ${xhr.status}`));
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

                    xhr.open('POST', uploadURL);
                    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                    xhr.send(file);
                });

                if (cancelledRef.current) throw new Error('Upload cancelled');

                setIsUploading(false);
                setProgress(100);

                // Step 3: Call onSuccess immediately — CF's iframe embed handles "processing" state natively
                // Webhook will invalidate cache when encoding completes
                options?.onSuccess?.(`cf-stream://${uid}`);
                return uid;
            } catch (error: any) {
                setIsUploading(false);
                const msg = error.message.includes('cancelled') ? 'Upload cancelled' : `Upload failed: ${error.message}`;
                toast.error(msg);
                return null;
            }
        },
        [options]
    );

    return {
        uploadVideo,
        isUploading,
        progress,
        cancel,
    };
}
