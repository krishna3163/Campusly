import { insforge } from '../lib/insforge';

export interface ConsistencyStats {
    user_id: string;
    leetcode_streak: number;
    github_streak: number;
    campus_streak: number;
    consistency_score: number;
    last_updated: string;
}

export const GamificationService = {
    async syncConsistency(userId: string) {
        try {
            // Fetch streaks from their profiles
            const [lc, gh] = await Promise.all([
                insforge.database.from('leetcode_profiles').select('streak_days').eq('user_id', userId).maybeSingle(),
                insforge.database.from('github_profiles').select('contribution_streak').eq('user_id', userId).maybeSingle(),
            ]);

            const lcStreak = lc.data?.streak_days || 0;
            const ghStreak = gh.data?.contribution_streak || 0;

            // Campus streak can be calculated from status/post activity (simulated for now)
            const campusStreak = 5;

            const score = (lcStreak * 3) + (ghStreak * 2) + (campusStreak * 5);

            const { error } = await insforge.database
                .from('user_consistency_stats')
                .upsert({
                    user_id: userId,
                    leetcode_streak: lcStreak,
                    github_streak: ghStreak,
                    campus_streak: campusStreak,
                    consistency_score: score,
                    last_updated: new Date().toISOString()
                });

            return { score, error };
        } catch (err) {
            return { score: 0, error: err };
        }
    },

    async getStats(userId: string) {
        return await insforge.database
            .from('user_consistency_stats')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
    },

    async awardXP(userId: string, action: string) {
        const xpMap: Record<string, number> = {
            'daily_login': 10,
            'message_sent': 2,
            'post_created': 15,
            'referral': 50
        };
        const amount = xpMap[action] || 5;

        return await insforge.database
            .from('xp_events')
            .insert({
                user_id: userId,
                action,
                xp_amount: amount,
                created_at: new Date().toISOString()
            });
    },

    generateReferralCode(userId: string) {
        return `CL-${userId.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
};
