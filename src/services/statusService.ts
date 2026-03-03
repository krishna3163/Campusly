import { insforge } from '../lib/insforge';
import { uploadToStorage, validateFile } from './mediaUploadService';

export const StatusService = {
    // --- Section 9: Status Photo Upload Fix ---
    async uploadStatus(userId: string, campusId: string, file: File, caption?: string, metadata?: any) {
        // ... media upload logic ...
        const mediaUrl = await uploadToStorage('media', `statuses/${userId}/${Date.now()}.${file.name.split('.').pop()}`, file);
        if (!mediaUrl) throw new Error('Mesh cloud rejection');

        const { data, error } = await insforge.database
            .from('stories')
            .insert({
                user_id: userId,
                campus_id: campusId,
                type: file.type.startsWith('image/') ? 'image' : 'video',
                content: caption || '',
                media_url: mediaUrl,
                metadata: metadata || {},
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                visibility: 'contacts'
            }).select().single();
        if (error) throw error;
        return data;
    },

    async postText(userId: string, campusId: string, content: string, bgColor: string = '#7C3AED') {
        const { data, error } = await insforge.database
            .from('stories')
            .insert({
                user_id: userId,
                campus_id: campusId,
                type: 'text',
                content,
                metadata: { bg_color: bgColor },
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                visibility: 'contacts'
            }).select().single();
        if (error) throw error;
        return data;
    },

    async getCampusStories(campusId: string) {
        const now = new Date().toISOString();
        const { data: stories, error } = await insforge.database
            .from('stories')
            .select('*, user:profiles(id, display_name, avatar_url)')
            .eq('campus_id', campusId)
            .gt('expires_at', now)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by user
        return stories?.reduce((acc: any, story: any) => {
            const uid = story.user_id;
            if (!acc[uid]) acc[uid] = {
                user: story.user,
                items: []
            };
            acc[uid].items.push(story);
            return acc;
        }, {});
    },

    async getFriendStories(userId: string) {
        // For simplicity in this campus app, we fetch active stories from the same campus
        // or we could fetch based on a 'friends' relationship.
        // Given ProfileViewPage uses it as getFriendStories(user.id), 
        // and expects stories grouped by userId.

        const { data: profile } = await insforge.database
            .from('profiles')
            .select('campus_id')
            .eq('id', userId)
            .single();

        if (!profile?.campus_id) return { data: {}, error: null };

        const stories = await this.getCampusStories(profile.campus_id);
        return { data: stories, error: null };
    },

    async markViewed(userId: string, storyId: string) {
        return insforge.database.from('story_views').upsert({
            viewer_id: userId,
            story_id: storyId,
            viewed_at: new Date().toISOString()
        });
    },

    async createStory(userId: string, campusId: string, payload: { type: 'text' | 'image' | 'video', content: string, media_url?: string }) {
        try {
            const { data, error } = await insforge.database
                .from('stories')
                .insert({
                    user_id: userId,
                    campus_id: campusId,
                    type: payload.type,
                    content: payload.content,
                    media_url: payload.media_url || null,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    visibility: 'contacts'
                }).select().single();

            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    },

    async reactToStory(userId: string, storyId: string, reaction: string) {
        try {
            // First, get the story to know the owner
            const { data: story } = await insforge.database
                .from('stories')
                .select('user_id')
                .eq('id', storyId)
                .single();

            if (!story) throw new Error('Story not found');

            // Record reaction
            const { error } = await insforge.database
                .from('story_reactions')
                .insert({
                    user_id: userId,
                    story_id: storyId,
                    reaction: reaction,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            // Notify owner
            await insforge.database.from('notifications').insert({
                user_id: story.user_id,
                type: 'story_reaction',
                content: `reacted to your story with ${reaction}`,
                sender_id: userId,
                is_read: false,
                created_at: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('Reaction Error:', error);
            return false;
        }
    }
};
