import { insforge } from '../lib/insforge';

export interface JobListing {
    id?: string;
    campus_id: string | null;
    posted_by?: string;
    title: string;
    company_name: string;
    location?: string;
    description?: string;
    apply_link?: string;
    salary_range?: string;
    job_type?: string;
    remote?: boolean;
    branch_eligibility?: string[];
    skills_required?: string[];
    is_active?: boolean;
}

export const JobService = {
    async postJob(jobData: JobListing) {
        try {
            if (!jobData.title?.trim()) throw new Error("Title is required");
            if (!jobData.company_name?.trim()) throw new Error("Company Name is required");

            const { data, error } = await insforge.database
                .from('placement_jobs')
                .insert({
                    campus_id: jobData.campus_id,
                    posted_by: jobData.posted_by,
                    title: jobData.title,
                    company_name: jobData.company_name,
                    location: jobData.location || null,
                    description: jobData.description || null,
                    apply_link: jobData.apply_link || null,
                    salary_range: jobData.salary_range || null,
                    job_type: jobData.job_type || null,
                    remote: jobData.remote || false,
                    branch_eligibility: jobData.branch_eligibility || null,
                    skills_required: jobData.skills_required || null,
                    is_active: true,
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
    },

    async updateJob(jobId: string, jobData: Partial<JobListing>) {
        try {
            const { data, error } = await insforge.database
                .from('placement_jobs')
                .update({
                    ...jobData,
                    // Prevent these from being updated if they shouldn't be
                    id: undefined,
                    created_at: undefined,
                    posted_by: undefined
                })
                .eq('id', jobId)
                .select()
                .single();

            if (error) {
                console.error('[Backend DB Error Update]', error);
                throw new Error("Failed to update job");
            }

            return { data, error: null };
        } catch (err: any) {
            console.error('[JobService] Failed to update job:', err);
            return { data: null, error: err.message || "Failed to update job" };
        }
    },

    async deleteJob(jobId: string) {
        try {
            // Soft delete
            const { error } = await insforge.database
                .from('placement_jobs')
                .update({ is_active: false })
                .eq('id', jobId);

            if (error) throw error;
            return { error: null };
        } catch (err: any) {
            console.error('[JobService] Failed to delete job:', err);
            return { error: err.message || "Failed to delete job" };
        }
    }
};
