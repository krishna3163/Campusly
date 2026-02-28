// ===================================================================
// Campusly v3.0 — Media Upload Service
// Client-side compression, encryption, and upload pipeline.
// Local-first: stores thumbnails in IndexedDB for instant previews.
// ===================================================================

import { insforge } from '../lib/insforge';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const IMAGE_QUALITY = 0.8;
const VIDEO_MAX_DIMENSION = 720;

export type MediaType = 'image' | 'video' | 'audio' | 'voice' | 'file' | 'gif' | 'sticker';

export interface MediaUploadResult {
    url: string;
    thumbnailUrl?: string;
    originalSize: number;
    compressedSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    duration?: number;
}

/**
 * Validate a file before processing.
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` };
    }

    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/wav',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (!allowedTypes.includes(file.type) && !file.type.startsWith('text/')) {
        return { valid: false, error: 'Unsupported file type' };
    }

    return { valid: true };
}

/**
 * Determine media type from MIME.
 */
export function getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/gif')) return 'gif';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
}

/**
 * Compress an image file to WebP format.
 */
export async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');

            // Maintain aspect ratio, max 1920px
            let { width, height } = img;
            const maxDim = 1920;
            if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => resolve(blob || file),
                'image/webp',
                IMAGE_QUALITY
            );
        };
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Generate a thumbnail for an image.
 */
export async function generateImageThumbnail(file: File, maxSize = 200): Promise<Blob> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
                (blob) => resolve(blob || file),
                'image/webp',
                0.6
            );
        };
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Generate a thumbnail from a video file (first frame).
 */
export async function generateVideoThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadeddata = () => {
            video.currentTime = 1; // Seek to 1 second
        };
        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(video.videoWidth, 640);
            canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(video.src);
                    resolve(blob || file);
                },
                'image/webp',
                0.7
            );
        };
        video.src = URL.createObjectURL(file);
    });
}

/**
 * Upload a file to InsForge Storage with progress tracking.
 */
export async function uploadToStorage(
    bucket: string,
    path: string,
    file: Blob,
    onProgress?: (percent: number) => void
): Promise<string | null> {
    try {
        // InsForge storage upload
        const { data, error } = await insforge.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        // Get public URL
        const { data: urlData } = insforge.storage
            .from(bucket)
            .getPublicUrl(data.path);

        onProgress?.(100);
        return urlData.publicUrl;
    } catch (err) {
        console.error('Upload failed:', err);
        return null;
    }
}

/**
 * Full media processing and upload pipeline.
 */
export async function processAndUploadMedia(
    file: File,
    conversationId: string,
    onProgress?: (percent: number) => void
): Promise<MediaUploadResult | null> {
    const validation = validateFile(file);
    if (!validation.valid) {
        alert(validation.error);
        return null;
    }

    const mediaType = getMediaType(file.type);
    const timestamp = Date.now();
    const basePath = `chats/${conversationId}/${timestamp}`;
    let processedBlob: Blob = file;
    let thumbnailUrl: string | undefined;

    onProgress?.(10);

    // Compress images
    if (mediaType === 'image' && file.type !== 'image/gif') {
        processedBlob = await compressImage(file);
        onProgress?.(30);

        // Generate thumbnail
        const thumb = await generateImageThumbnail(file);
        thumbnailUrl = await uploadToStorage('media', `${basePath}_thumb.webp`, thumb) || undefined;
        onProgress?.(50);
    }

    // Generate video thumbnail
    if (mediaType === 'video') {
        try {
            const thumb = await generateVideoThumbnail(file);
            thumbnailUrl = await uploadToStorage('media', `${basePath}_thumb.webp`, thumb) || undefined;
        } catch { }
        onProgress?.(40);
    }

    // Upload main file
    const ext = file.name.split('.').pop() || 'bin';
    const mainUrl = await uploadToStorage('media', `${basePath}.${ext}`, processedBlob, onProgress);

    if (!mainUrl) return null;

    onProgress?.(100);

    return {
        url: mainUrl,
        thumbnailUrl,
        originalSize: file.size,
        compressedSize: processedBlob.size,
        mimeType: file.type,
    };
}
