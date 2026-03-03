import { insforge } from '../lib/insforge';

export interface JobListing {
    id: string;
    title: string;
    company_name: string;
    location: string;
    description?: string;
    apply_link?: string;
    salary_range?: string;
    job_type?: string;
    remote?: boolean;
    branch_eligibility?: string[];
    skills_required?: string[];
    is_active?: boolean;
    created_at?: string;
    match_score?: number;
}

export const PlacementService = {
    /**
     * Fetch real jobs from placement_jobs table with optional filters
     */
    async getSmartJobs(filters: {
        skills?: string[];
        role?: string;
        location?: string;
        type?: string;
        batch?: string;
    }): Promise<JobListing[]> {
        try {
            let query = insforge.database
                .from('placement_jobs')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (filters.type === 'remote') {
                query = query.eq('remote', true);
            } else if (filters.type === 'internship' || filters.type === 'full-time') {
                query = query.eq('job_type', filters.type);
            }

            const { data, error } = await query.limit(50);
            if (error) throw error;
            return (data as JobListing[]) || [];
        } catch (err) {
            console.error('Job fetch failed:', err);
            return [];
        }
    },

    /**
     * Ranking algorithm logic — calculates match score based on user profile
     */
    calculateJobScore(job: JobListing, userProfile: any): number {
        let score = 0;

        // 1. Skill Match (+10 per skill)
        const jobSkills = job.skills_required || [];
        const userSkills: string[] = userProfile.skills || [];
        const commonSkills = jobSkills.filter(s =>
            userSkills.some((us: string) => us.toLowerCase() === s.toLowerCase())
        );
        score += commonSkills.length * 10;

        // 2. Branch Match (+15)
        const eligibility = job.branch_eligibility || [];
        if (eligibility.length === 0 || eligibility.some(b =>
            b.toLowerCase() === (userProfile.branch || '').toLowerCase()
        )) {
            score += 15;
        }

        // 3. Placement Status Match (+10)
        if (userProfile.placement_status === 'seeking') {
            score += 10;
        }

        // 4. Recency Weight (+5 if within 7 days)
        if (job.created_at) {
            const ageInDays = (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (ageInDays <= 7) score += 5;
        }

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
