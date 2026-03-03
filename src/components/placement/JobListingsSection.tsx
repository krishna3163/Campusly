import { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { Building2, ExternalLink, MapPin, Briefcase, Trash2, Pencil, X } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import JobListingForm from './JobListingForm';
import { JobService } from '../../services/JobService';

interface Job {
    id: string;
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
    created_at: string;
}

export default function JobListingsSection({ userId, campusId }: { userId?: string; campusId?: string }) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const { showToast } = useAppStore();

    useEffect(() => {
        loadJobs();
    }, [campusId]);

    const loadJobs = async () => {
        setLoading(true);
        try {
            let query = insforge.database.from('placement_jobs').select('*').eq('is_active', true).order('created_at', { ascending: false });
            if (campusId) query = query.eq('campus_id', campusId);
            const { data } = await query.limit(20);
            setJobs((data as Job[]) || []);
        } catch {
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (jobId: string) => {
        if (!confirm('Are you sure you want to delete this job listing?')) return;
        try {
            const { error } = await JobService.deleteJob(jobId);
            if (error) throw new Error(error);
            setJobs(prev => prev.filter(j => j.id !== jobId));
            showToast('Job listing removed', 'success');
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const handleApply = (job: Job) => {
        if (job.apply_link) {
            let url = job.apply_link;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            showToast('No application link provided for this listing', 'info');
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h3 className="text-xl font-bold text-[var(--foreground)]">Job Listings</h3>
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card p-6 animate-pulse">
                            <div className="h-4 w-1/2 bg-white/10 rounded mb-4" />
                            <div className="h-3 w-1/3 bg-white/5 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-[var(--foreground)]">Job Listings</h3>
            {jobs.length === 0 ? (
                <div className="glass-card p-12 text-center text-campus-muted">
                    <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No job listings yet. Be the first to add one!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {jobs.map(job => (
                        <div key={job.id} className="glass-card p-6 hover:bg-[var(--surface)] transition-all rounded-2xl border border-[var(--border)]">
                            <div className="flex justify-between items-start gap-4 mb-3">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[var(--foreground)] text-lg">{job.title}</h4>
                                    <p className="text-sm text-[var(--foreground-muted)]">{job.company_name}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleApply(job)}
                                        className="btn-primary py-2 px-5 text-sm flex items-center gap-2 rounded-xl"
                                    >
                                        <ExternalLink size={14} /> Apply
                                    </button>

                                    {userId && (job.posted_by === userId || !job.posted_by) && (
                                        <div className="flex items-center gap-1 ml-2">
                                            <button
                                                onClick={() => setEditingJob(job)}
                                                className="p-2 text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all"
                                                title="Edit listing"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(job.id)}
                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Delete listing"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {job.description && <p className="text-sm text-[var(--foreground-muted)] line-clamp-2 mb-3">{job.description}</p>}

                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                {job.location && (
                                    <div className="flex items-center gap-1 text-[var(--foreground-muted)]">
                                        <MapPin size={12} className="text-brand-400" />
                                        <span className="text-[11px] font-bold">{job.location}</span>
                                    </div>
                                )}
                                {job.job_type && (
                                    <span className="px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 text-[10px] font-bold capitalize">{job.job_type}</span>
                                )}
                                {job.remote && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">Remote</span>
                                )}
                                {job.salary_range && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">{job.salary_range}</span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {job.branch_eligibility?.slice(0, 5).map(t => (
                                    <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 text-campus-muted text-[10px] font-bold">{t}</span>
                                ))}
                                {job.skills_required?.slice(0, 4).map(s => (
                                    <span key={s} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">{s}</span>
                                ))}
                            </div>

                            <div className="mt-3 text-[10px] text-[var(--foreground-muted)]">
                                Posted {new Date(job.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editingJob && (
                <JobListingForm
                    userId={userId || ''}
                    campusId={campusId}
                    editJob={editingJob}
                    onClose={() => setEditingJob(null)}
                    onSaved={() => {
                        setEditingJob(null);
                        loadJobs();
                    }}
                />
            )}
        </div>
    );
}
