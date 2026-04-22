'use client';

import React from 'react';
import * as tus from 'tus-js-client';
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
    const uploadRef = React.useRef<tus.Upload | null>(null);

    React.useEffect(() => {
        return () => {
            if (uploadRef.current) {
                uploadRef.current.abort();
            }
        };
    }, []);

    const cancel = React.useCallback(() => {
        if (uploadRef.current) {
            uploadRef.current.abort();
        }
        uploadRef.current = null;
        setIsUploading(false);
        setProgress(0);
        toast.info('Upload cancelled');
    }, []);

    const uploadVideo = React.useCallback(
        async (file: File): Promise<string | null> => {
            setIsUploading(true);
            setProgress(0);

            try {
                // Step 1: Get signed TUS upload URL from Cloudflare Stream via our server
                const initRes = await fetch('/api/media/stream-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
                });

                if (!initRes.ok) {
                    throw new Error('Failed to initialize upload with Cloudflare Stream');
                }

                const { uploadURL, uid } = await initRes.json();

                // Step 2: Upload directly to CF using tus-js-client
                // tus-js-client handles: chunking, progress, resumption, retries, protocol
                return new Promise<string | null>((resolve) => {
                    const upload = new tus.Upload(file, {
                        uploadUrl: uploadURL, // CF-signed TUS endpoint (direct, no proxy)
                        chunkSize: 50 * 1024 * 1024, // 50 MB — CF Stream recommended
                        retryDelays: [0, 3000, 5000, 10000, 20000], // Auto-retry 5× on network drop, resuming from last offset
                        metadata: {
                            filename: file.name,
                            filetype: file.type,
                        },
                        onProgress(uploaded, total) {
                            setProgress(Math.round((uploaded / total) * 100));
                        },
                        onSuccess() {
                            setIsUploading(false);
                            setProgress(100);

                            // Save URL immediately — CF's embed player shows "processing" natively until encoding completes
                            options?.onSuccess?.(`cf-stream://${uid}`);
                            resolve(uid);
                        },
                        onError(error) {
                            setIsUploading(false);
                            const msg = error instanceof Error ? error.message : 'Upload failed';
                            toast.error(msg);
                            resolve(null);
                        },
                    });

                    uploadRef.current = upload;
                    upload.start();
                });
            } catch (error: any) {
                setIsUploading(false);
                const msg = error?.message || 'Upload initialization failed';
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
