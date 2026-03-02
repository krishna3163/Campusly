import { insforge } from '../lib/insforge';

export interface GitHubProfile {
    user_id: string;
    username: string;
    total_repos: number;
    total_stars: number;
    total_forks: number;
    total_contributions: number;
    contribution_streak: number;
    languages: any;
    pinned_projects: any[];
    last_synced: string;
}

export const GitHubService = {
    async syncProfile(userId: string, username: string) {
        try {
            if (!username) throw new Error('Invalid GitHub signature');

            const { data, error } = await insforge.functions.invoke('sync-github', {
                body: { userId, username }
            });
            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            console.error('[GitHub Sync Collision]', err);
            return { data: null, error: err };
        }
    },

    async getProfile(userId: string) {
        const { data, error } = await insforge.database
            .from('github_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        return { data: data as GitHubProfile | null, error };
    },

    async updatePinnedProjects(userId: string, projects: any[]) {
        const { error } = await insforge.database
            .from('github_profiles')
            .update({ pinned_projects: projects.slice(0, 3) })
            .eq('user_id', userId);
        return { error };
    },

    shouldSync(lastSynced: string | null): boolean {
        if (!lastSynced) return true;
        const last = new Date(lastSynced).getTime();
        const now = new Date().getTime();
        return (now - last) >= (6 * 60 * 60 * 1000);
    }
};
