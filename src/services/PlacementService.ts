import { insforge } from '../lib/insforge';

export interface JobListing {
    id: string;
    title: string;
    company: string;
    location: string;
    experience_required: string;
    salary_range: string;
    job_type: 'internship' | 'full-time' | 'remote';
    skills_required: string[];
    apply_url: string;
    posted_date: string;
    source: 'campus' | 'external';
    match_score?: number;
}

export const PlacementService = {
    /**
     * SECTION 1 — Fetch jobs with intelligent ranking
     */
    async getSmartJobs(filters: {
        skills?: string[];
        role?: string;
        location?: string;
        type?: 'internship' | 'full-time' | 'remote';
        batch?: string;
    }) {
        try {
            // Invokes Edge Function that proxies several job APIs (Adzuna, Jooble, etc)
            const { data, error } = await insforge.functions.invoke('fetch-jobs', {
                body: filters
            });
            if (error) throw error;
            return (data as JobListing[]) || [];
        } catch (err) {
            console.error('Job sync failed:', err);
            return [];
        }
    },

    /**
     * Ranking algorithm logic (can be run client-side for immediate sorting)
     */
    calculateJobScore(job: JobListing, userProfile: any): number {
        let score = 0;
        
        // 1. Skill Match (+10 per skill)
        const commonSkills = job.skills_required.filter(s => 
            userProfile.skills?.some((us: string) => us.toLowerCase() === s.toLowerCase())
        );
        score += commonSkills.length * 10;

        // 2. Location Match (+15)
        if (job.location.toLowerCase().includes(userProfile.location_preference?.toLowerCase() || '')) {
            score += 15;
        }

        // 3. Batch/Graduation Match (+10)
        if (job.title.toLowerCase().includes(userProfile.graduation_year?.toString() || '')) {
            score += 10;
        }

        // 4. Recency Weight (+5 if within 48h)
        const ageInDays = (Date.now() - new Date(job.posted_date).getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays <= 2) score += 5;

        return score;
    },

    async saveJob(userId: string, jobId: string) {
        return await insforge.database
            .from('user_job_interactions')
            .upsert({ user_id: userId, job_id: jobId, status: 'saved' });
    },

    async trackApplication(userId: string, jobId: string) {
        return await insforge.database
            .from('user_job_interactions')
            .upsert({ user_id: userId, job_id: jobId, status: 'applied' });
    },

    async getInteractions(userId: string) {
        const { data } = await insforge.database
            .from('user_job_interactions')
            .select('*')
            .eq('user_id', userId);
        return data || [];
    }
};
