import { insforge } from '../lib/insforge';

export const CodingService = {
    // Proxy through backend/edge function to avoid CORS
    async fetchFromLeetCode(username: string) {
        try {
            const { data, error } = await insforge.functions.invoke('sync-leetcode', {
                body: { username }
            });
            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async getDailyGoals(userId: string) {
        const today = new Date().toISOString().split('T')[0];
        return insforge.database
            .from('leetcode_goals')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle();
    },

    async updateDailyGoal(userId: string, target: number, solved: number) {
        const today = new Date().toISOString().split('T')[0];
        return insforge.database
            .from('leetcode_goals')
            .upsert({
                user_id: userId,
                date: today,
                target_questions: target,
                solved_today: solved
            });
    },

    async getRevisionList(userId: string) {
        return insforge.database
            .from('leetcode_solved_history')
            .select('*')
            .eq('user_id', userId)
            .eq('marked_for_revision', true)
            .order('solved_at', { ascending: false });
    },

    async addToRevision(userId: string, question: any) {
        return insforge.database
            .from('leetcode_solved_history')
            .upsert({
                user_id: userId,
                question_slug: question.titleSlug,
                question_title: question.title,
                difficulty: question.difficulty,
                tags: question.topicTags,
                marked_for_revision: true
            });
    },

    async getLeaderboardFriends(userId: string) {
        return insforge.database
            .from('leetcode_leaderboard_friends')
            .select('*, friend:profiles!friend_id(*, leetcode:leetcode_profiles!id(*))')
            .eq('user_id', userId);
    },

    async addFriendToLeaderboard(userId: string, friendId: string) {
        return insforge.database
            .from('leetcode_leaderboard_friends')
            .insert({ user_id: userId, friend_id: friendId });
    },

    async removeFriendFromLeaderboard(userId: string, friendId: string) {
        return insforge.database
            .from('leetcode_leaderboard_friends')
            .delete()
            .eq('user_id', userId)
            .eq('friend_id', friendId);
    },

    async getUpcomingContests() {
        // Since we can't easily fetch all sites without multiple proxies, 
        // we use a curated / cached list or a specialized edge function
        // For now, let's return a realistic mock that we'll later connect to a function
        return [
            { platform: 'LeetCode', title: 'Weekly Contest 438', time: 'Sunday 8:00 AM', link: 'https://leetcode.com/contest/' },
            { platform: 'Codeforces', title: 'Round 992 (Div. 2)', time: 'Monday 8:35 PM', link: 'https://codeforces.com/contests' },
            { platform: 'CodeChef', title: 'Starters 175', time: 'Wednesday 8:00 PM', link: 'https://www.codechef.com/contests' },
            { platform: 'AtCoder', title: 'ABC 395', time: 'Saturday 5:30 PM', link: 'https://atcoder.jp/contests/' },
            { platform: 'GfG', title: 'Weekly Contest', time: 'Sunday 7:00 PM', link: 'https://practice.geeksforgeeks.org/events' },
        ];
    },

    async getSwipeQuestions(userId: string, limit = 10) {
        // Fetch random questions that user hasn't swiped on yet
        // For now returning curated placeholder list to demonstrate UI
        return [
            { title: 'Subsets', titleSlug: 'subsets', difficulty: 'Medium', tags: ['Array', 'Backtracking'] },
            { title: 'Word Search', titleSlug: 'word-search', difficulty: 'Medium', tags: ['Array', 'DFS'] },
            { title: 'Valid Sudoku', titleSlug: 'valid-sudoku', difficulty: 'Medium', tags: ['Matrix'] },
            { title: 'Climbing Stairs', titleSlug: 'climbing-stairs', difficulty: 'Easy', tags: ['DP'] },
            { title: 'Kth Smallest Element in a BST', titleSlug: 'kth-smallest-element-in-a-bst', difficulty: 'Medium', tags: ['Tree'] },
        ];
    },

    async saveSwipeAction(userId: string, slug: string, status: 'solved' | 'to-do' | 'never') {
        return insforge.database
            .from('leetcode_swipe_preferences')
            .upsert({ user_id: userId, question_slug: slug, status });
    }
};
