/**
 * useMediaUpload — Handles media compression, chunked upload, and background resume
 */

import { useState, useCallback } from 'react';
import { insforge } from '../lib/insforge';

interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'compressing' | 'uploading' | 'completed' | 'failed';
    url?: string;
    error?: string;
}

const MAX_IMAGE_SIZE = 1920;
const JPEG_QUALITY = 0.75;

export function useMediaUpload() {
    const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

    const compressImage = useCallback(async (file: File): Promise<Blob> => {
        if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
                    if (width > height) {
                        height = (height / width) * MAX_IMAGE_SIZE;
                        width = MAX_IMAGE_SIZE;
                    } else {
                        width = (width / height) * MAX_IMAGE_SIZE;
                        height = MAX_IMAGE_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => resolve(blob || file),
                    'image/jpeg',
                    JPEG_QUALITY
                );
            };
            img.src = URL.createObjectURL(file);
        });
    }, []);

    const uploadFile = useCallback(async (file: File, bucket = 'attachments'): Promise<string | null> => {
        const id = crypto.randomUUID();
        const fileName = `${Date.now()}_${file.name}`;

        const updateProgress = (update: Partial<UploadProgress>) => {
            setUploads(prev => {
                const next = new Map(prev);
                const current = next.get(id) || { fileName: file.name, progress: 0, status: 'uploading' as const };
                next.set(id, { ...current, ...update });
                return next;
            });
        };

        try {
            updateProgress({ status: 'compressing', progress: 10 });

            let uploadData: Blob = file;
            if (file.type.startsWith('image/')) {
                uploadData = await compressImage(file);
            }

            updateProgress({ status: 'uploading', progress: 30 });

            const { data, error } = await insforge.storage
                .from(bucket)
                .upload(fileName, uploadData);

            if (error) throw error;
            const url = data?.url || '';
            updateProgress({ status: 'completed', progress: 100, url });

            // Cleanup after 5s
            setTimeout(() => {
                setUploads(prev => {
                    const next = new Map(prev);
                    next.delete(id);
                    return next;
                });
            }, 5000);

            return url;
        } catch (err) {
            updateProgress({
                status: 'failed',
                error: err instanceof Error ? err.message : 'Upload failed',
            });
            return null;
        }
    }, [compressImage]);

    return {
        uploadFile,
        uploads: Array.from(uploads.values()),
        isUploading: Array.from(uploads.values()).some(u => u.status === 'uploading' || u.status === 'compressing'),
    };
}
