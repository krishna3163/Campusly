import { insforge } from '../lib/insforge';
import { uploadToStorage, validateFile } from './mediaUploadService';

export const PostService = {
    // --- Section 10: Post (Text + Image + Video) Fix ---
    async createPostWithMedia(userId: string, campusId: string, content: string, file?: File, category: string = 'general') {
        if (!campusId) throw new Error('No empty campus_id allowed. Please select a campus.');
        if (!content && !file) throw new Error('Post content or media required');

        let mediaUrl = null;
        let mediaType = null;

        // 1. Media upload first if exists
        if (file) {
            const validation = validateFile(file);
            if (!validation.valid) throw new Error(validation.error);

            const timestamp = Date.now();
            const ext = file.name.split('.').pop() || 'bin';
            const path = `posts/${userId}/${timestamp}.${ext}`;

            mediaUrl = await uploadToStorage('media', path, file);
            if (!mediaUrl) throw new Error('Media transmission failed');

            mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        }

        // 2. Insert post record
        const { data: post, error } = await insforge.database
            .from('posts')
            .insert({
                user_id: userId,
                campus_id: campusId,
                content,
                media_url: mediaUrl,
                media_type: mediaType,
                type: mediaUrl ? 'media' : 'text',
                category,
                created_at: new Date().toISOString()
            })
            .select('*, author:profiles!user_id(*)')
            .single();

        if (error) throw error;

        return post;
    },

    async deletePost(postId: string, userId: string) {
        const { error } = await insforge.database
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', userId);

        if (error) throw error;
    },

    async likePost(postId: string, userId: string) {
        const { error } = await insforge.database
            .from('post_likes')
            .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' });

        if (error) throw error;
    }
};
