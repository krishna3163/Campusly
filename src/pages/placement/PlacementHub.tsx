import { useState, useEffect, useRef } from 'react';
import { insforge } from '../../lib/insforge';
import type { InterviewExperience } from '../../types';
import {
    TrendingUp,
    Building2,
    ChevronRight,
    MessageSquare,
    Sparkles,
    Brain,
    Globe,
    Zap,
    X,
    Briefcase,
    Plus,
    MapPin,
    DollarSign,
    Filter,
    Search as SearchIcon
} from 'lucide-react';
import { RankingEngine } from '../../services/rankingService';
import { resumeService, ResumeExtractedData } from '../../services/resumeService';
import { useUser } from '@insforge/react';
import JobListingForm from '../../components/placement/JobListingForm';
import JobListingsSection from '../../components/placement/JobListingsSection';
import { PlacementService, JobListing } from '../../services/PlacementService';

export default function PlacementHub() {
    const { user } = useUser();
    const [experiences, setExperiences] = useState<InterviewExperience[]>([]);
    const [activeSection, setActiveSection] = useState<'overview' | 'experiences' | 'jobs' | 'resume'>('overview');
    const [showJobForm, setShowJobForm] = useState(false);
    const [selectedExp, setSelectedExp] = useState<InterviewExperience | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [extractedData, setExtractedData] = useState<ResumeExtractedData | null>(null);
    const [smartJobs, setSmartJobs] = useState<JobListing[]>([]);
    const [jobFilter, setJobFilter] = useState<'all' | 'internship' | 'full-time' | 'remote'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadExperiences();
        if (user?.id) loadSmartJobs();
    }, [user?.id, jobFilter]);

    const loadSmartJobs = async () => {
        const results = await PlacementService.getSmartJobs({
            type: jobFilter === 'all' ? undefined : jobFilter,
            skills: (user?.profile as any)?.skills || [],
        });

        // Apply client-side ranking
        const ranked = results.map(j => ({
            ...j,
            match_score: PlacementService.calculateJobScore(j, user?.profile || {})
        })).sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

        setSmartJobs(ranked);
    };

    const loadExperiences = async () => {
        try {
            const { data } = await insforge.database.from('interview_experiences').select('*');
            if (data && user?.profile) {
                const ranked = RankingEngine.rankInterviews(data as InterviewExperience[], (user.profile as any));
                setExperiences(ranked);
            }
        } catch (err) { }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && user?.id) {
            setIsUploading(true);
            try {
                const data = await resumeService.extractDetails(file);
                setExtractedData(data);
                await resumeService.updateProfileFromResume(user.id, data);
                setActiveSection('resume');
                alert("Resume analyzed! Your profile has been automatically updated with your skills and experience.");
            } catch (err) {
                console.error(err);
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div className="h-full bg-campus-darker overflow-y-auto px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />

                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-brand-400 mb-4">
                            <Zap size={12} className="fill-current" />
                            <span>Recruitment Season 2026</span>
                        </div>
                        <h1 className="text-4xl font-black text-white leading-tight">Your Career Gateway.</h1>
                        <p className="text-campus-muted text-lg mt-2">Connecting students with top-tier opportunities and alumni wisdom.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowJobForm(true)} className="btn-primary flex items-center gap-2 px-5 py-3 rounded-xl">
                            <Plus size={18} strokeWidth={2} />
                            <span className="text-sm font-bold">Add Job</span>
                        </button>
                        <button onClick={loadSmartJobs} className="glass-card flex items-center gap-2 px-5 py-3 hover:bg-brand-500/10 transition-all text-white border-brand-500/20">
                            <Zap size={18} className="text-brand-400" />
                            <span className="text-sm font-bold uppercase tracking-widest italic">Sync Jobs</span>
                        </button>
                        <button onClick={() => window.open('https://linkedin.com/jobs', '_blank')} className="glass-card flex items-center gap-2 px-5 py-3 hover:bg-white/5 transition-all text-white">
                            <Globe size={18} className="text-blue-500" />
                            <span className="text-sm font-bold">External Jobs</span>
                        </button>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-4 mb-10">
                    <div className="flex-1 relative group">
                        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-campus-muted group-focus-within:text-brand-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search roles, companies, or tech stacks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:border-brand-500/50 focus:bg-white/10 transition-all outline-none"
                        />
                    </div>
                    <button className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-campus-muted hover:text-white transition-all flex items-center gap-3 text-sm font-bold active:scale-95">
                        <Filter size={18} /> Advanced Filter
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="glass-card p-1">
                            <nav className="flex flex-col">
                                {[
                                    { id: 'overview', label: 'Career Overview', icon: TrendingUp },
                                    { id: 'experiences', label: 'Interview Archive', icon: MessageSquare },
                                    { id: 'jobs', label: 'Job Listings', icon: Briefcase },
                                    { id: 'resume', label: 'Resume Builder', icon: Sparkles },
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id as any)}
                                        className={`flex items-center justify-between group px-5 py-4 rounded-2xl transition-all ${activeSection === item.id ? 'bg-white/5 text-white' : 'text-campus-muted hover:text-white hover:bg-white/2'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <item.icon size={20} className={activeSection === item.id ? 'text-brand-400' : 'opacity-50'} />
                                            <span className="font-bold">{item.label}</span>
                                        </div>
                                        <ChevronRight size={16} className={`transition-all ${activeSection === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="glass-card p-6 bg-gradient-to-br from-emerald-600/10 to-transparent border-emerald-500/20 group relative overflow-hidden">
                            <h3 className="font-bold text-white mb-2">Resume Review</h3>
                            <p className="text-sm text-campus-muted mb-6">Let our AI model review your resume before you apply.</p>
                            <button
                                onClick={handleUploadClick}
                                disabled={isUploading}
                                className="w-full btn-primary bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isUploading ? 'Analyzing...' : 'Upload PDF'}
                            </button>
                        </div>
                    </aside>

                    <main className="lg:col-span-8 space-y-8">
                        {activeSection === 'overview' ? (
                            <div className="space-y-10 animate-fade-in">
                                {/* Active Opportunities Grid (Section 1) */}
                                <section>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <h3 className="text-xl font-black text-white tracking-tight">Personalized Opportunities</h3>
                                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                                            {['all', 'internship', 'full-time', 'remote'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setJobFilter(f as any)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${jobFilter === f ? 'bg-brand-500 text-white shadow-glow' : 'bg-white/5 text-campus-muted hover:text-white'}`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {smartJobs.length > 0 ? smartJobs.map(job => (
                                            <div key={job.id} className="bg-campus-card border border-campus-border rounded-[24px] p-6 hover:border-brand-500/30 hover:shadow-card-hover transition-all flex flex-col group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-500 text-white text-[10px] font-black italic rounded-bl-2xl shadow-glow">
                                                    {job.match_score}% Match
                                                </div>

                                                <div className="flex items-start gap-4 mb-6 pt-2">
                                                    <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 group-hover:scale-110 transition-transform">
                                                        <Building2 size={24} className="text-brand-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-white tracking-tight leading-tight">{job.title}</h4>
                                                        <p className="text-sm font-medium text-campus-muted mt-1">{job.company}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="flex items-center gap-2 text-campus-muted">
                                                        <MapPin size={14} className="text-brand-400" />
                                                        <span className="text-[11px] font-bold uppercase">{job.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-campus-muted">
                                                        <DollarSign size={14} className="text-emerald-400" />
                                                        <span className="text-[11px] font-bold uppercase">{job.salary_range}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-8">
                                                    {job.skills_required.slice(0, 3).map(s => (
                                                        <span key={s} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-bold text-campus-muted uppercase">{s}</span>
                                                    ))}
                                                </div>

                                                <div className="mt-auto pt-6 border-t border-white/[0.04] flex items-center justify-between">
                                                    <div className="text-[10px] text-campus-muted font-bold uppercase tracking-widest">
                                                        Posted {new Date(job.posted_date).toLocaleDateString()}
                                                    </div>
                                                    <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="btn-primary py-3 px-8 rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow hover:scale-105 active:scale-95 transition-all">
                                                        Intelligence Apply
                                                    </a>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-2 glass-card p-12 text-center">
                                                <Briefcase size={48} className="mx-auto mb-4 text-campus-muted opacity-20" />
                                                <p className="text-campus-muted font-bold tracking-tight">No personalized matches found.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        ) : activeSection === 'jobs' ? (
                            <JobListingsSection userId={user?.id || ''} campusId={(user?.profile as any)?.campus_id} />
                        ) : activeSection === 'experiences' ? (
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black">Archive</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {experiences.map(exp => (
                                        <button key={exp.id} onClick={() => setSelectedExp(exp)} className="glass-card p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                                                    <Building2 size={28} className="text-brand-400" />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-lg font-bold text-white">{exp.company}</h4>
                                                    <p className="text-xs text-campus-muted uppercase">{exp.role || 'SDE-1'}</p>
                                                </div>
                                            </div>
                                            <ChevronRight />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-fade-in">
                                <div className="glass-card p-12 text-center border-emerald-500/10 bg-emerald-500/[0.02] relative min-h-[300px] flex flex-col items-center justify-center">
                                    <Sparkles size={48} className="text-emerald-400 mb-6" />
                                    <h2 className="text-2xl font-black">AI Resume Expert</h2>
                                    <p className="text-sm text-campus-muted max-w-sm mt-2">Upload your resume to get automated insights and profile updates.</p>
                                    <button onClick={handleUploadClick} className="btn-primary bg-emerald-600 mt-8 px-8 py-3 rounded-xl font-bold">Upload Resume</button>
                                </div>

                                {extractedData && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                                        <div className="glass-card p-8">
                                            <h3 className="font-bold flex items-center gap-2 mb-6"><Brain size={20} className="text-emerald-400" /> Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {extractedData.skills.map(s => <span key={s} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-campus-muted">{s}</span>)}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 glass-card p-8">
                                            <h3 className="font-bold mb-6">Extracted Exp</h3>
                                            <div className="space-y-4">
                                                {extractedData.experience.map((ex, i) => (
                                                    <div key={i} className="p-4 bg-white/5 rounded-xl">
                                                        <h4 className="font-bold">{ex.role}</h4>
                                                        <p className="text-xs text-campus-muted">{ex.company} • {ex.duration}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {showJobForm && <JobListingForm onClose={() => setShowJobForm(false)} onSaved={() => { setShowJobForm(false); setActiveSection('jobs'); }} userId={user?.id || ''} campusId={(user?.profile as any)?.campus_id} />}
            {selectedExp && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="glass-card p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
                        <button onClick={() => setSelectedExp(null)} className="absolute top-6 right-6 text-campus-muted hover:text-white bg-white/5 p-2 rounded-xl"><X size={20} /></button>
                        <h1 className="text-3xl font-black text-white mb-8">{selectedExp.company}</h1>
                        <p className="text-campus-muted leading-relaxed whitespace-pre-wrap">{selectedExp.preparation_tips}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
