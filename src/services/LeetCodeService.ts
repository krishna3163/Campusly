import { insforge } from '../lib/insforge';

export interface LeetCodeProfile {
    user_id: string;
    username: string;
    total_solved: number;
    easy_count: number;
    medium_count: number;
    hard_count: number;
    ranking: number;
    rating: number;
    streak_days: number;
    longest_streak: number;
    badges: any[];
    recent_activity: any[];
    privacy_mode: 'public' | 'friends' | 'private';
    last_synced: string;
}

export const LeetCodeService = {
    async syncProfile(userId: string, username: string) {
        try {
            // Frontend validation before submission
            if (!username || username.length < 3) throw new Error('Invalid LeetCode identity signature');

            const { data, error } = await insforge.functions.invoke('sync-leetcode', {
                body: { userId, username }
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            const { error: dbError } = await insforge.database
                .from('leetcode_profiles')
                .upsert({
                    user_id: userId,
                    username: data.username,
                    total_solved: data.total_solved || 0,
                    easy_count: data.easy_count || 0,
                    medium_count: data.medium_count || 0,
                    hard_count: data.hard_count || 0,
                    ranking: data.ranking || 0,
                    rating: data.rating || 0,
                    streak_days: data.streak_days || 0,
                    longest_streak: data.longest_streak || 0,
                    badges: data.badges || [],
                    last_synced: data.last_synced || new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (dbError) throw dbError;

            return { data, error: null };
        } catch (err: any) {
            console.error('[LeetCode Sync Collision]', err);
            return { data: null, error: err };
        }
    },

    async getProfile(userId: string) {
        const { data, error } = await insforge.database
            .from('leetcode_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        return { data: data as LeetCodeProfile | null, error };
    },

    async getFriendsProfiles(userId: string) {
        try {
            // Get friends from friendships table (user can be in either column)
            const [{ data: friends1 }, { data: friends2 }] = await Promise.all([
                insforge.database
                    .from('friendships')
                    .select('user_id_2')
                    .eq('user_id_1', userId),
                insforge.database
                    .from('friendships')
                    .select('user_id_1')
                    .eq('user_id_2', userId)
            ]);

            const ids = [
                ...(friends1 || []).map(f => f.user_id_2),
                ...(friends2 || []).map(f => f.user_id_1)
            ];

            if (ids.length === 0) return [];

            const { data, error } = await insforge.database
                .from('leetcode_profiles')
                .select('*, profile:profiles!user_id(display_name, avatar_url)')
                .in('user_id', ids)
                .order('total_solved', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('LC Social Lookup Failure:', err);
            return [];
        }
    },

    async updatePrivacy(userId: string, mode: 'public' | 'friends' | 'private') {
        const { error } = await insforge.database
            .from('leetcode_profiles')
            .update({ privacy_mode: mode })
            .eq('user_id', userId);
        return { error };
    },

    shouldSync(lastSynced: string | null): boolean {
        if (!lastSynced) return true;
        const last = new Date(lastSynced).getTime();
        const now = new Date().getTime();
        return (now - last) >= (6 * 60 * 60 * 1000); // 6 hours cache
    }
};
