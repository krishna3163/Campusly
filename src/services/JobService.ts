import { insforge } from '../lib/insforge';

export interface JobListing {
    id?: string;
    author_id: string;
    campus_id: string | null;
    title: string;
    company_name: string;
    location: string;
    description?: string;
    apply_link?: string;
    start_date?: string;
    last_date?: string;
    experience_required?: string;
    branch_eligibility?: string[];
    hashtags?: string[];
    is_active?: boolean;
}

export const JobService = {
    async postJob(jobData: JobListing) {
        try {
            if (!jobData.title?.trim()) throw new Error("Title is required");
            if (!jobData.company_name?.trim()) throw new Error("Company Name is required");
            if (!jobData.location?.trim()) throw new Error("Location is required");

            const { data, error } = await insforge.database
                .from('placement_jobs')
                .insert({
                    ...jobData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error('[Backend DB Error]', error);
                throw new Error("Failed to post job due to server error");
            }

            return { data, error: null };
        } catch (err: any) {
            console.error('[JobService] Failed to post job:', err);
            return { data: null, error: err.message || "Failed to post job" };
        }
    }
};
