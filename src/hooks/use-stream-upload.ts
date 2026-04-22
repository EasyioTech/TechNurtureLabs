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
            xhrRef.current.abort();
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

            const executeUpload = async (isRetry = false): Promise<string | null> => {
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

                    // Step 2: Chunked TUS upload
                    await new Promise<void>((resolve, reject) => {
                        if (cancelledRef.current) return reject(new Error('Upload cancelled'));

                        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
                        let offset = 0;

                        const uploadNextChunk = () => {
                            if (cancelledRef.current) {
                                reject(new Error('Upload cancelled'));
                                return;
                            }

                            if (offset >= file.size) {
                                resolve();
                                return;
                            }

                            const chunk = file.slice(
                                offset,
                                Math.min(offset + CHUNK_SIZE, file.size)
                            );
                            const xhr = new XMLHttpRequest();
                            xhr.open('PATCH', uploadURL);

                            xhr.setRequestHeader('Upload-Offset', offset.toString());
                            xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');
                            xhr.setRequestHeader('Tus-Resumable', '1.0.0');
                            xhr.setRequestHeader('Upload-Length', file.size.toString());

                            xhr.upload.onprogress = (e) => {
                                if (e.lengthComputable) {
                                    const chunkPct = (e.loaded / e.total) * (chunk.size / file.size);
                                    const totalPct = Math.round(
                                        (offset / file.size + chunkPct) * 100
                                    );
                                    setProgress(Math.min(99, totalPct));
                                }
                            };

                            xhr.onload = () => {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    offset += chunk.size;
                                    uploadNextChunk();
                                } else {
                                    reject(new Error(`Upload failed with status ${xhr.status}`));
                                }
                            };

                            xhr.onerror = () => reject(new Error('Network error during TUS upload'));

                            xhrRef.current = xhr;
                            xhr.send(chunk);
                        };

                        uploadNextChunk();
                    });

                    if (cancelledRef.current) throw new Error('Upload cancelled');

                    setProgress(100);

                    // Step 3: Poll for processing status
                    let isReady = false;
                    let lastPct = -1;
                    let stagnantCount = 0;
                    let consecutiveErrors = 0;

                    for (let i = 0; i < 600; i++) {
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
                                    'Processing check is slow — Cloudflare may be rate-limiting. Still waiting...'
                                );
                            }
                        }

                        await new Promise((r) => setTimeout(r, 3000));
                    }

                    if (cancelledRef.current) throw new Error('Upload cancelled');
                    if (!isReady) throw new Error('Processing timeout');

                    // Success
                    setIsUploading(false);
                    setProgress(0);
                    toast.success('Video uploaded and processed');

                    if (options?.onSuccess) {
                        await options.onSuccess(`cf-stream://${uploadUid}`);
                    }

                    return uploadUid;
                } catch (error: any) {
                    // Retry logic
                    if (!isRetry && !error.message.includes('re-encode') && !error.message.includes('cancelled')) {
                        console.log('Ingest failed, attempting auto-retry...');
                        toast.info('Retrying processing...');
                        if (uploadUid) {
                            try {
                                await fetch(`/api/media/stream-status/${uploadUid}`, {
                                    method: 'DELETE',
                                });
                            } catch (e) {
                                // Ignore cleanup errors
                            }
                        }
                        return executeUpload(true);
                    }

                    // Normalization escalation
                    if (isRetry) {
                        setIsNormalizing(true);
                        toast.info('Processing failed. Normalizing on server...');
                        try {
                            const formData = new FormData();
                            formData.append('file', file);

                            const normRes = await fetch('/api/media/normalize', {
                                method: 'POST',
                                body: formData,
                            });

                            if (!normRes.ok) {
                                const errorData = await normRes.json().catch(() => ({}));
                                throw new Error(errorData.error || 'Normalization pipeline failed');
                            }

                            const { jobId } = await normRes.json();
                            toast.info('Normalization queued. This may take 1-2 minutes...');

                            let attempts = 0;
                            let finalUid = null;

                            while (attempts < 40) {
                                if (cancelledRef.current) throw new Error('Upload cancelled');

                                const jobRes = await fetch(`/api/media/jobs/${jobId}`);
                                if (jobRes.ok) {
                                    const jobData = await jobRes.json();
                                    if (jobData.state === 'completed' && jobData.result?.uid) {
                                        finalUid = jobData.result.uid;
                                        break;
                                    }
                                    if (jobData.state === 'failed') {
                                        throw new Error(
                                            `Normalization failed: ${jobData.failedReason || 'Unknown error'}`
                                        );
                                    }
                                }
                                await new Promise((r) => setTimeout(r, 3000));
                                attempts++;
                            }

                            if (cancelledRef.current) throw new Error('Upload cancelled');
                            if (!finalUid) throw new Error('Normalization timed out');

                            setIsNormalizing(false);
                            setIsUploading(false);
                            setProgress(0);
                            toast.success('Video repaired and processed');

                            if (options?.onSuccess) {
                                await options.onSuccess(`cf-stream://${finalUid}`);
                            }

                            return finalUid;
                        } catch (normErr: any) {
                            console.error('[Normalization Error]:', normErr);
                            setIsNormalizing(false);
                            setIsUploading(false);
                            const msg = normErr.message.includes('cancelled')
                                ? 'Upload cancelled'
                                : `Upload and normalization failed: ${normErr.message}`;
                            toast.error(msg);
                            throw normErr;
                        }
                    }

                    // Cleanup on final failure
                    if (uploadUid) {
                        try {
                            await fetch(`/api/media/stream-status/${uploadUid}`, {
                                method: 'DELETE',
                            });
                        } catch (e) {
                            // Ignore cleanup errors
                        }
                    }

                    setIsUploading(false);
                    setProgress(0);

                    const msg = error.message.includes('re-encode')
                        ? error.message
                        : 'Upload failed. Processing error or malformed file.';
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
