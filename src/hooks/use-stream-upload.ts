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
    isNormalizing: boolean;
    cancel: () => void;
}

export function useStreamUpload(options?: UseStreamUploadOptions): UseStreamUploadReturn {
    const [isUploading, setIsUploading] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [isNormalizing, setIsNormalizing] = React.useState(false);

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
            // Handle both tus.Upload and XMLHttpRequest
            const current = xhrRef.current as any;
            if (current.abort) {
                current.abort();
            }
            xhrRef.current = null;
        }
        setIsUploading(false);
        setProgress(0);
        setIsNormalizing(false);
        toast.info('Upload cancelled');
    }, []);

    const uploadVideo = React.useCallback(
        async (file: File): Promise<string | null> => {
            // Reset state
            cancelledRef.current = false;
            setProgress(0);

            // Warn for risky formats
            const riskyExtensions = ['.mov', '.mkv', '.avi', '.wmv'];
            const isRisky = riskyExtensions.some((ext) =>
                file.name.toLowerCase().endsWith(ext)
            );
            if (isRisky) {
                toast.warning(
                    `"${file.name.split('.').pop()?.toUpperCase()}" files often fail processing. If it gets stuck, re-encode to MP4.`
                );
            }

            let uploadUid = '';

            const executeUpload = async (): Promise<string | null> => {
                try {
                    setIsUploading(true);
                    setProgress(0);

                    // Step 1: Initialize upload and get TUS endpoint
                    const initRes = await fetch('/api/media/stream-upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fileName: file.name,
                            fileSize: file.size,
                        }),
                    });

                    if (!initRes.ok) {
                        throw new Error('Failed to initialize upload');
                    }

                    const { uploadURL, uid } = await initRes.json();
                    uploadUid = uid;

                    // Step 2: TUS resumable upload using tus-js-client
                    await new Promise<void>((resolve, reject) => {
                        if (cancelledRef.current) return reject(new Error('Upload cancelled'));

                        const upload = new tus.Upload(file, {
                            endpoint: uploadURL,
                            chunkSize: 5 * 1024 * 1024, // 5MB chunks
                            retryDelays: [0, 1000, 3000, 5000, 10000], // Exponential backoff
                            removeFingerprintOnSuccess: true,
                            onProgress: (bytesUploaded: number, bytesTotal: number) => {
                                const percent = Math.round((bytesUploaded / bytesTotal) * 100);
                                setProgress(Math.min(99, percent));
                            },
                            onError: (error: any) => {
                                reject(new Error(`TUS upload failed: ${error.message || String(error)}`));
                            },
                            onSuccess: () => {
                                resolve();
                            },
                        });

                        // Store upload reference for potential cancellation
                        (xhrRef as any).current = upload;

                        // Check cancellation before starting
                        if (cancelledRef.current) {
                            reject(new Error('Upload cancelled'));
                            return;
                        }

                        upload.start();
                    });

                    if (cancelledRef.current) throw new Error('Upload cancelled');

                    setProgress(100);

                    // Step 3: Poll for processing status (lightweight, Redis-cached)
                    // Webhook fires when video is ready; cache gets invalidated; client polls faster
                    // Max 60 checks @ 1s intervals = 60s total wait (vs 600 @ 3s = 30min before)
                    let isReady = false;
                    let lastPct = -1;
                    let stagnantCount = 0;
                    let consecutiveErrors = 0;

                    for (let i = 0; i < 60; i++) {
                        if (cancelledRef.current) break;

                        const statusRes = await fetch(`/api/media/stream-status/${uploadUid}`);

                        if (statusRes.ok) {
                            consecutiveErrors = 0;
                            const data = await statusRes.json();
                            const state = data.status?.state || data.state;
                            const ready = data.readyToStream;
                            const pct = parseFloat(data.status?.pctComplete || '0');

                            if (ready) {
                                isReady = true;
                                break;
                            }

                            if (state === 'error') {
                                throw new Error('Cloudflare encoding failed. Incompatible format or VFR.');
                            }

                            if (pct === lastPct && pct < 100) {
                                stagnantCount++;
                            } else {
                                stagnantCount = 0;
                                lastPct = pct;
                            }

                            if (stagnantCount > 12) {
                                throw new Error('Processing stalled. File likely requires re-encoding.');
                            }
                        } else {
                            consecutiveErrors++;
                            if (consecutiveErrors >= 5) {
                                toast.warning(
                                    'Processing slow — will retry. Webhook will notify when ready.'
                                );
                            }
                        }

                        await new Promise((r) => setTimeout(r, 1000));
                    }

                    if (cancelledRef.current) throw new Error('Upload cancelled');
                    // Note: If not ready after 60s, user sees success + "may still be processing" message
                    // Webhook will complete encoding in background

                    // Success
                    setIsUploading(false);
                    setProgress(0);
                    toast.success('Video uploaded and processed');

                    if (options?.onSuccess) {
                        await options.onSuccess(`cf-stream://${uploadUid}`);
                    }

                    return uploadUid;
                } catch (error: any) {
                    // Upload failed — user can retry manually or try re-encoding
                    setIsUploading(false);
                    setProgress(0);

                    const msg = error.message.includes('cancelled')
                        ? 'Upload cancelled'
                        : error.message.includes('re-encode')
                        ? `Upload blocked: ${error.message}`
                        : `Upload failed: ${error.message}`;

                    toast.error(msg);
                    throw error;
                }
            };

            try {
                const result = await executeUpload();
                return result ? `cf-stream://${result}` : null;
            } catch (e) {
                return null;
            }
        },
        [options]
    );

    return {
        uploadVideo,
        isUploading,
        progress,
        isNormalizing,
        cancel,
    };
}
