import { useState } from 'react';
import { insforge } from '../../lib/insforge';
import { useAppStore } from '../../stores/appStore';
import { X } from 'lucide-react';

const BRANCH_TAGS = ['CSE', 'BTech', 'BCA', 'MCA', 'Mechanical', 'ECE', 'EEE', 'Civil', 'MBA'];
const CUSTOM_TAG = 'Custom';

export default function JobListingForm({
    onClose,
    onSaved,
    userId,
    campusId,
}: {
    onClose: () => void;
    onSaved: () => void;
    userId: string;
    campusId?: string;
}) {
    const { showToast } = useAppStore();
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [description, setDescription] = useState('');
    const [applyLink, setApplyLink] = useState('');
    const [startDate, setStartDate] = useState('');
    const [lastDate, setLastDate] = useState('');
    const [experienceRequired, setExperienceRequired] = useState('');
    const [branchEligibility, setBranchEligibility] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState('');

    const toggleBranch = (tag: string) => {
        if (tag === CUSTOM_TAG) return;
        setBranchEligibility(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const addCustomTag = () => {
        if (customTag.trim() && !branchEligibility.includes(customTag.trim())) {
            setBranchEligibility(prev => [...prev, customTag.trim()]);
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
            const { error } = await insforge.database.from('placement_jobs').insert({
                author_id: userId,
                campus_id: campusId || null,
                title: title.trim(),
                company_name: companyName.trim(),
                description: description.trim() || null,
                apply_link: applyLink.trim() || null,
                start_date: startDate || null,
                last_date: lastDate || null,
                experience_required: experienceRequired.trim() || null,
                branch_eligibility: branchEligibility,
                hashtags: branchEligibility,
                is_active: true,
                updated_at: new Date().toISOString(),
            });
            if (error) throw error;
            showToast('Job listing posted successfully!', 'success');
            onSaved();
        } catch (err) {
            console.error(err);
            showToast('Failed to post job. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-lg glass-card p-6 animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Add Job Listing</h2>
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
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-field py-3" placeholder="Job details..." />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Apply Link</label>
                        <input value={applyLink} onChange={e => setApplyLink(e.target.value)} type="url" className="input-field py-3" placeholder="https://..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Start Date</label>
                            <input value={startDate} onChange={e => setStartDate(e.target.value)} type="date" className="input-field py-3" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Last Date</label>
                            <input value={lastDate} onChange={e => setLastDate(e.target.value)} type="date" className="input-field py-3" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Experience (optional)</label>
                        <input value={experienceRequired} onChange={e => setExperienceRequired(e.target.value)} className="input-field py-3" placeholder="e.g. 0-2 years" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-campus-muted uppercase mb-1 block">Branch eligibility / Hashtags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {BRANCH_TAGS.map(t => (
                                <button key={t} type="button" onClick={() => toggleBranch(t)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${branchEligibility.includes(t) ? 'bg-brand-500/30 text-brand-400 border border-brand-500/50' : 'bg-white/5 text-campus-muted hover:text-white border border-transparent'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={customTag} onChange={e => setCustomTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                                className="input-field py-2 flex-1" placeholder="Custom tag" />
                            <button type="button" onClick={addCustomTag} className="btn-secondary py-2 px-4 text-sm">Add</button>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-4 rounded-2xl font-bold mt-4 disabled:opacity-50">
                        {saving ? 'Posting...' : 'Post Job'}
                    </button>
                </div>
            </div>
        </div>
    );
}
