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

    const upload = useCallback(async (file: File, additionalData: Record<string, string> = {}) => {
        setIsUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);

        // Register with global store
        uploadStore.addTask({
            id: uploadId,
            fileName: file.name,
            progress: 0,
            isUploading: true,
            error: null,
            onCancel: abort,
            onReset: reset
        });

        const formData = new FormData();
        formData.append('file', file);
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        return new Promise(async (resolve, reject) => {
            // 🚀 LARGE FILE OPTIMIZATION
            // If the file is > 50MB, use Presigned URL flow to avoid Next.js memory limits (unless local storage is preferred)
            if (file.size > 50 * 1024 * 1024 && additionalData.storagePreference !== 'local') {
                try {
                    console.log('[Upload] Large file detected, switching to Direct R2 flow...');
                    const presignRes = await fetch('/api/media/presign', {
                        method: 'POST',
                        body: JSON.stringify({
                            fileName: file.name,
                            fileType: file.type,
                            folder: additionalData.folder || 'library'
                        })
                    });

                    if (!presignRes.ok) throw new Error('Failed to generate secure upload gateway');
                    const { uploadUrl, key, publicUrl } = await presignRes.json();

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
                            // 📝 Register with DB
                            const regRes = await fetch('/api/media/register', {
                                method: 'POST',
                                body: JSON.stringify({
                                    fileName: file.name,
                                    filePath: key,
                                    fileSize: file.size,
                                    mimeType: file.type,
                                    folder: additionalData.folder || 'library'
                                })
                            });

                            if (!regRes.ok) throw new Error('Failed to register asset in database');
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
                        } else {
                             const errorMessage = `Upload failed: ${xhr.statusText || 'Gateway Error'}`;
                             setError(errorMessage);
                             uploadStore.updateTask(uploadId, { isUploading: false, error: errorMessage });
                             reject(new Error(errorMessage));
                        }
                    });

                    xhr.open('PUT', uploadUrl);
                    xhr.setRequestHeader('Content-Type', file.type);
                    xhr.send(file);
                    return;
                } catch (err: any) {
                    setError(err.message);
                    setIsUploading(false);
                    reject(err);
                    return;
                }
            }

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
                    uploadStore.updateTask(uploadId, { isUploading: false, error: errorMessage });
                    options?.onError?.(errorMessage);
                    reject(new Error(errorMessage));
                }
            });

            xhr.addEventListener('error', () => {
                setIsUploading(false);
                const errorMessage = 'Network error occurred';
                setError(errorMessage);
                uploadStore.updateTask(uploadId, { isUploading: false, error: errorMessage });
                options?.onError?.(errorMessage);
                reject(new Error(errorMessage));
            });

            xhr.addEventListener('abort', () => {
                setIsUploading(false);
                setProgress(0);
                uploadStore.removeTask(uploadId);
            });

            xhr.open('POST', '/api/upload');
            xhr.send(formData);
        });
    }, [options, uploadId, abort, reset]);

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
