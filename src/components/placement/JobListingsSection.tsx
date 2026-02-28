import { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { Building2, ExternalLink } from 'lucide-react';

interface Job {
    id: string;
    title: string;
    company_name: string;
    description?: string;
    apply_link?: string;
    branch_eligibility?: string[];
    start_date?: string;
    last_date?: string;
    experience_required?: string;
    created_at: string;
}

export default function JobListingsSection({ campusId }: { userId?: string; campusId?: string }) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const BATCH = 20;

    useEffect(() => {
        loadJobs();
    }, [campusId]);

    const loadJobs = async () => {
        setLoading(true);
        try {
            let query = insforge.database.from('placement_jobs').select('*').eq('is_active', true).order('created_at', { ascending: false });
            if (campusId) query = query.eq('campus_id', campusId);
            const { data } = await query.range(0, BATCH - 1);
            setJobs((data as Job[]) || []);
        } catch {
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '—';

    if (loading) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h3 className="text-xl font-bold">Job Listings</h3>
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
            <h3 className="text-xl font-bold">Job Listings</h3>
            {jobs.length === 0 ? (
                <div className="glass-card p-12 text-center text-campus-muted">
                    <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No job listings yet. Be the first to add one!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {jobs.map(job => (
                        <div key={job.id} className="glass-card p-6 hover:bg-white/[0.06] transition-all rounded-2xl border border-campus-border/40">
                            <div className="flex justify-between items-start gap-4 mb-2">
                                <div>
                                    <h4 className="font-bold text-white text-lg">{job.title}</h4>
                                    <p className="text-sm text-campus-muted">{job.company_name}</p>
                                </div>
                                {job.apply_link && (
                                    <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="btn-secondary py-2 px-4 text-sm flex items-center gap-2 shrink-0">
                                        <ExternalLink size={14} /> Apply
                                    </a>
                                )}
                            </div>
                            {job.description && <p className="text-sm text-campus-muted line-clamp-2 mb-3">{job.description}</p>}
                            <div className="flex flex-wrap gap-2">
                                {job.branch_eligibility?.slice(0, 5).map(t => (
                                    <span key={t} className="px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 text-[10px] font-bold">{t}</span>
                                ))}
                                {job.experience_required && <span className="px-2 py-0.5 rounded-full bg-white/5 text-campus-muted text-[10px]">{job.experience_required}</span>}
                            </div>
                            <div className="flex gap-4 mt-3 text-[11px] text-campus-muted">
                                <span>Start: {formatDate(job.start_date)}</span>
                                <span>Last: {formatDate(job.last_date)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
