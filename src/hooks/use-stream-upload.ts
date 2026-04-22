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

    // Cleanup on unmount
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
            const current = xhrRef.current as any;
            if (current.abort) {
                current.abort();
            }
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

                // Initialize TUS upload
                const initRes = await fetch('/api/media/stream-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
                });

                if (!initRes.ok) throw new Error('Failed to start upload');
                const { uploadURL, uid } = await initRes.json();

                // TUS chunked upload
                const CHUNK_SIZE = 5 * 1024 * 1024;
                let offset = 0;

                while (offset < file.size && !cancelledRef.current) {
                    const chunk = file.slice(offset, Math.min(offset + CHUNK_SIZE, file.size));

                    const res = await fetch(uploadURL, {
                        method: 'PATCH',
                        headers: {
                            'Upload-Offset': offset.toString(),
                            'Content-Type': 'application/offset+octet-stream',
                            'Tus-Resumable': '1.0.0',
                        },
                        body: chunk,
                    });

                    if (!res.ok) throw new Error('Upload failed');
                    offset += chunk.size;
                    setProgress(Math.min(99, Math.round((offset / file.size) * 100)));
                }

                if (cancelledRef.current) throw new Error('Upload cancelled');
                setProgress(100);

                // Poll for encoding ready
                let isReady = false;
                for (let i = 0; i < 60; i++) {
                    if (cancelledRef.current) break;

                    const statusRes = await fetch(`/api/media/stream-status/${uid}`);
                    if (statusRes.ok) {
                        const data = await statusRes.json();
                        if (data.readyToStream) {
                            isReady = true;
                            break;
                        }
                        if (data.status?.state === 'error') throw new Error('Encoding failed');
                    }
                    await new Promise(r => setTimeout(r, 1000));
                }

                setIsUploading(false);
                if (options?.onSuccess) {
                    await options.onSuccess(`cf-stream://${uid}`);
                }
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
