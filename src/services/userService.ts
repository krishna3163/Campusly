import { insforge } from '../lib/insforge';

export const UserService = {
    async searchProfiles(query: string, campusId?: string, limit = 20) {
        try {
            let q = insforge.database
                .from('profiles')
                .select('*')
                .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`);

            if (campusId) {
                q = q.eq('campus_id', campusId);
            }

            const { data, error } = await q.limit(limit);
            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async getUserPosts(userId: string, limit = 10, offset = 0) {
        try {
            const { data, error } = await insforge.database
                .from('posts')
                .select('*, author:profiles!user_id(*), original_post:posts!original_post_id(*, author:profiles!user_id(*))')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async getProfile(userId: string) {
        try {
            const { data, error } = await insforge.database
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    }
};
