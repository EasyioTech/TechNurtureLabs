import { useState, useCallback, useRef, useMemo } from 'react';
import { uploadStore } from '@/lib/upload-store';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
    id?: string;
}

export function useUpload(options?: UploadOptions) {
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const lastFileRef = useRef<{ file: File; additionalData: Record<string, string> } | null>(null);

    // Stable ID for this upload instance
    const uploadId = useMemo(() => options?.id || uuidv4(), [options?.id]);

    const abort = useCallback(() => {
        if (xhrRef.current) {
            xhrRef.current.abort();
            setIsUploading(false);
            setProgress(0);
            uploadStore.updateTask(uploadId, { isUploading: false, progress: 0 });
        }
    }, [uploadId]);

    const reset = useCallback(() => {
        setProgress(0);
        setIsUploading(false);
        setError(null);
        setResult(null);
        uploadStore.removeTask(uploadId);
    }, [uploadId]);

    // Retry the last failed upload
    const retry = useCallback(async () => {
        if (!lastFileRef.current) {
            setError('No previous upload to retry');
            return;
        }
        const { file, additionalData } = lastFileRef.current;
        // Clear error and retry
        setError(null);
        return upload(file, additionalData);
    }, [uploadId]);

    const upload = useCallback(async (file: File, additionalData: Record<string, string> = {}) => {
        setIsUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);

        // Store for retry
        lastFileRef.current = { file, additionalData };

        // Register with global store — onReset is now retry, not just dismiss
        uploadStore.addTask({
            id: uploadId,
            fileName: file.name,
            progress: 0,
            isUploading: true,
            error: null,
            onCancel: abort,
            onReset: undefined // Will be set to retry after first error
        });

        const formData = new FormData();
        formData.append('file', file);
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        return new Promise(async (resolve, reject) => {
            // Helper to get CSRF token from cookies
            const getCsrfToken = () => document.cookie
                .split('; ')
                .find(row => row.startsWith('csrf_token='))
                ?.split('=')[1];

            // 🚀 LARGE FILE OPTIMIZATION
            // If the file is > 50MB, use Presigned URL flow to avoid Next.js memory limits
            // All uploads go directly to R2 (no local storage fallback)
            if (file.size > 50 * 1024 * 1024) {
                try {
                    console.log('[Upload] Large file detected, switching to Direct R2 flow...');
                    const csrfToken = getCsrfToken();

                    const presignRes = await fetch('/api/media/presign', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
                        },
                        body: JSON.stringify({
                            fileName: file.name,
                            fileType: file.type,
                            folder: additionalData.folder || 'library'
                        })
                    });

                    if (!presignRes.ok) {
                        const errData = await presignRes.json().catch(() => ({}));
                        throw new Error(errData.error || 'Failed to generate secure upload gateway');
                    }
                    const { uploadUrl, key } = await presignRes.json();

                    // Perform direct XHR to R2
                    const xhr = new XMLHttpRequest();
                    xhrRef.current = xhr;

                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            const pct = Math.round((e.loaded * 100) / e.total);
                            setProgress(pct);
                            uploadStore.updateTask(uploadId, { progress: pct });
                        }
                    });

                    xhr.addEventListener('load', async () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            // 📝 Register with DB — wrapped in try/catch so errors are properly propagated
                            try {
                                const csrfToken = getCsrfToken();
                                const regRes = await fetch('/api/media/register', {
                                    method: 'POST',
                                    headers: { 
                                        'Content-Type': 'application/json',
                                        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
                                    },
                                    body: JSON.stringify({
                                        fileName: file.name,
                                        filePath: key,
                                        fileSize: file.size,
                                        mimeType: file.type,
                                        folder: additionalData.folder || 'library'
                                    })
                                });

                                if (!regRes.ok) {
                                    const errData = await regRes.json().catch(() => ({}));
                                    throw new Error(errData.error || 'Failed to register asset in database');
                                }
                                const regData = await regRes.json();

                                const finalResult = {
                                    url: regData.url,
                                    path: key,
                                    assetId: regData.assetId,
                                    storageType: 'r2',
                                    fileSize: file.size,
                                    mimeType: file.type,
                                    processingStatus: regData.processingStatus
                                };

                                setResult(finalResult);
                                setIsUploading(false);
                                uploadStore.updateTask(uploadId, { isUploading: false, progress: 100 });
                                options?.onSuccess?.(finalResult);
                                resolve(finalResult);
                            } catch (regErr: any) {
                                const msg = regErr.message || 'Failed to register uploaded asset';
                                setError(msg);
                                setIsUploading(false);
                                uploadStore.updateTask(uploadId, { isUploading: false, error: msg, onReset: retry });
                                options?.onError?.(msg);
                                reject(regErr);
                            }
                        } else {
                             const errorMessage = `Upload failed: ${xhr.statusText || 'Gateway Error'}`;
                             setError(errorMessage);
                             setIsUploading(false);
                             uploadStore.updateTask(uploadId, { isUploading: false, error: errorMessage, onReset: retry });
                             options?.onError?.(errorMessage);
                             reject(new Error(errorMessage));
                        }
                    });

                    xhr.addEventListener('error', () => {
                        setIsUploading(false);
                        const errorMessage = 'Network error during upload';
                        setError(errorMessage);
                        uploadStore.updateTask(uploadId, { isUploading: false, error: errorMessage, onReset: retry });
                        options?.onError?.(errorMessage);
                        reject(new Error(errorMessage));
                    });

                    xhr.addEventListener('abort', () => {
                        setIsUploading(false);
                        setProgress(0);
                        uploadStore.removeTask(uploadId);
                    });

                    xhr.open('PUT', uploadUrl);
                    xhr.setRequestHeader('Content-Type', file.type);
                    xhr.send(file);
                    return;
                } catch (err: any) {
                    const msg = err.message || 'Upload failed';
                    setError(msg);
                    setIsUploading(false);
                    uploadStore.updateTask(uploadId, { isUploading: false, error: msg });
                    options?.onError?.(msg);
                    reject(err);
                    return;
                }
            }

            // Small file path — POST via FormData to /api/upload
            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentage = Math.round((event.loaded * 100) / event.total);
                    setProgress(percentage);
                    uploadStore.updateTask(uploadId, { progress: percentage });
                }
            });

            xhr.addEventListener('load', () => {
                setIsUploading(false);
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    setResult(response);
                    uploadStore.updateTask(uploadId, { isUploading: false, progress: 100 });

                    // Auto-remove successful tasks after 5 seconds to keep UI clean
                    setTimeout(() => {
                        uploadStore.removeTask(uploadId);
                    }, 5000);

                    options?.onSuccess?.(response);
                    resolve(response);
                } else {
                    let errorMessage = 'Upload failed';
                    try {
                        const response = JSON.parse(xhr.responseText);
                        errorMessage = response.error || response.message || errorMessage;
                    } catch (e) {
                        // ignore parse error, use default
                    }
                    setError(errorMessage);
                    uploadStore.updateTask(uploadId, { isUploading: false, error: errorMessage, onReset: retry });
                    options?.onError?.(errorMessage);
                    reject(new Error(errorMessage));
                }
            });

            xhr.addEventListener('error', () => {
                setIsUploading(false);
                const errorMessage = 'Network error occurred';
                setError(errorMessage);
                uploadStore.updateTask(uploadId, { isUploading: false, error: errorMessage, onReset: retry });
                options?.onError?.(errorMessage);
                reject(new Error(errorMessage));
            });

            xhr.addEventListener('abort', () => {
                setIsUploading(false);
                setProgress(0);
                uploadStore.removeTask(uploadId);
            });

            const csrfToken = getCsrfToken();
            xhr.open('POST', '/api/upload');
            if (csrfToken) {
                xhr.setRequestHeader('x-csrf-token', csrfToken);
            }
            xhr.send(formData);
        });
    }, [options, uploadId, abort, reset, retry]);

    return {
        upload,
        abort,
        reset,
        progress,
        isUploading,
        error,
        result,
        uploadId
    };
}
