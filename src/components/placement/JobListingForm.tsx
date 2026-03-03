import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { X } from 'lucide-react';
import { JobService, JobListing } from '../../services/JobService';

const BRANCH_TAGS = ['CSE', 'BTech', 'BCA', 'MCA', 'Mechanical', 'ECE', 'EEE', 'Civil', 'MBA'];

export default function JobListingForm({
    onClose,
    onSaved,
    userId,
    campusId,
    editJob
}: {
    onClose: () => void;
    onSaved: () => void;
    userId: string;
    campusId?: string;
    editJob?: JobListing | null;
}) {
    const { showToast } = useAppStore();
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [applyLink, setApplyLink] = useState('');
    const [salaryRange, setSalaryRange] = useState('');
    const [jobType, setJobType] = useState('');
    const [remote, setRemote] = useState(false);
    const [branchEligibility, setBranchEligibility] = useState<string[]>([]);
    const [skillsRequired, setSkillsRequired] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState('');

    useEffect(() => {
        if (editJob) {
            setTitle(editJob.title || '');
            setCompanyName(editJob.company_name || '');
            setLocation(editJob.location || '');
            setDescription(editJob.description || '');
            setApplyLink(editJob.apply_link || '');
            setSalaryRange(editJob.salary_range || '');
            setJobType(editJob.job_type || '');
            setRemote(editJob.remote || false);
            setBranchEligibility(editJob.branch_eligibility || []);
            setSkillsRequired(editJob.skills_required || []);
        }
    }, [editJob]);

    const toggleBranch = (tag: string) => {
        setBranchEligibility(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const addCustomTag = () => {
        if (customTag.trim() && !skillsRequired.includes(customTag.trim())) {
            setSkillsRequired(prev => [...prev, customTag.trim()]);
            setCustomTag('');
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !companyName.trim()) {
            showToast('Title and Company are required.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                campus_id: campusId || null,
                posted_by: userId,
                title: title.trim(),
                company_name: companyName.trim(),
                location: location.trim() || '',
                description: description.trim() || undefined,
                apply_link: applyLink.trim() || undefined,
                salary_range: salaryRange.trim() || undefined,
                job_type: jobType || undefined,
                remote,
                branch_eligibility: branchEligibility.length > 0 ? branchEligibility : undefined,
                skills_required: skillsRequired.length > 0 ? skillsRequired : undefined,
            };

            let response;
            if (editJob?.id) {
                response = await JobService.updateJob(editJob.id, payload);
            } else {
                response = await JobService.postJob(payload);
            }

            if (response.error) {
                showToast(response.error, 'error');
                return;
            }

            showToast(editJob?.id ? 'Job listing updated!' : 'Job listing posted successfully!', 'success');
            onSaved();
        } catch (err) {
            console.error(err);
            showToast('Failed to save job. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-lg glass-card p-6 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{editJob ? 'Edit' : 'Add'} Job Listing</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-campus-muted"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Title *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="input-field py-3" placeholder="e.g. Software Developer" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Company Name *</label>
                        <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="input-field py-3" placeholder="e.g. TechCorp Inc." />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Location</label>
                        <input value={location} onChange={e => setLocation(e.target.value)} className="input-field py-3" placeholder="e.g. Remote, San Francisco, Bangalore" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-field py-3" placeholder="Job details..." />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Apply Link</label>
                        <input value={applyLink} onChange={e => setApplyLink(e.target.value)} type="url" className="input-field py-3" placeholder="https://..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Salary Range</label>
                            <input value={salaryRange} onChange={e => setSalaryRange(e.target.value)} className="input-field py-3" placeholder="e.g. 5-8 LPA" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Job Type</label>
                            <select value={jobType} onChange={e => setJobType(e.target.value)} className="input-field py-3 w-full">
                                <option value="">Select...</option>
                                <option value="full-time">Full Time</option>
                                <option value="part-time">Part Time</option>
                                <option value="internship">Internship</option>
                                <option value="contract">Contract</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={remote} onChange={e => setRemote(e.target.checked)} className="w-5 h-5 rounded" id="remote-check" />
                        <label htmlFor="remote-check" className="text-sm font-medium">Remote position</label>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Branch Eligibility</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {BRANCH_TAGS.map(t => (
                                <button key={t} type="button" onClick={() => toggleBranch(t)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${branchEligibility.includes(t) ? 'bg-brand-500/30 text-brand-400 border border-brand-500/50' : 'bg-white/5 text-campus-muted hover:text-white border border-transparent'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Skills Required</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {skillsRequired.map(s => (
                                <span key={s} className="px-3 py-1 bg-brand-500/20 text-brand-400 rounded-full text-xs font-bold flex items-center gap-1">
                                    {s}
                                    <button onClick={() => setSkillsRequired(prev => prev.filter(x => x !== s))} className="hover:text-red-400"><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={customTag} onChange={e => setCustomTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                                className="input-field py-2 flex-1" placeholder="e.g. React, Node.js" />
                            <button type="button" onClick={addCustomTag} className="btn-secondary py-2 px-4 text-sm">Add</button>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-4 rounded-2xl font-bold mt-4 disabled:opacity-50">
                        {saving ? 'Processing...' : (editJob ? 'Update Job' : 'Post Job')}
                    </button>
                </div>
            </div>
        </div>
    );
}
