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

        return new Promise((resolve, reject) => {
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
