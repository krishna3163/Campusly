import { useState, useEffect, useRef } from 'react';
import { insforge } from '../../lib/insforge';
import type { InterviewExperience } from '../../types';
import {
    TrendingUp,
    Building2,
    Users,
    ChevronRight,
    Award,
    MessageSquare,
    Sparkles,
    Brain,
    Globe,
    Zap,
    X,
    Briefcase,
    Plus,
} from 'lucide-react';
import { RankingEngine } from '../../services/rankingService';
import { resumeService, ResumeExtractedData } from '../../services/resumeService';
import { useUser } from '@insforge/react';
import JobListingForm from '../../components/placement/JobListingForm';
import JobListingsSection from '../../components/placement/JobListingsSection';

export default function PlacementHub() {
    const { user } = useUser();
    const [experiences, setExperiences] = useState<InterviewExperience[]>([]);
    const [activeSection, setActiveSection] = useState<'overview' | 'experiences' | 'jobs' | 'resume'>('overview');
    const [showJobForm, setShowJobForm] = useState(false);
    const [selectedExp, setSelectedExp] = useState<InterviewExperience | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [extractedData, setExtractedData] = useState<ResumeExtractedData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadExperiences();
    }, []);

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
                        <button onClick={() => window.open('https://linkedin.com/jobs', '_blank')} className="glass-card flex items-center gap-2 px-5 py-3 hover:bg-white/5 transition-all text-white">
                            <Globe size={18} className="text-brand-400" />
                            <span className="text-sm font-bold">External Jobs</span>
                        </button>
                    </div>
                </header>

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
                                {/* Cleaned Up Stats */}
                                <div className="grid grid-cols-2 gap-4 md:gap-6">
                                    <div className="bg-campus-card rounded-[16px] p-6 lg:p-8 border border-campus-border shadow-card hover:-translate-y-1 transition-transform">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Award size={20} className="text-brand-400" />
                                            <h4 className="text-xs font-bold text-campus-muted uppercase tracking-wider">Highest Package</h4>
                                        </div>
                                        <p className="text-4xl font-black text-white tracking-tight">45.5 <span className="text-sm text-campus-muted font-bold">LPA</span></p>
                                    </div>
                                    <div className="bg-campus-card rounded-[16px] p-6 lg:p-8 border border-campus-border shadow-card hover:-translate-y-1 transition-transform">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Users size={20} className="text-purple-400" />
                                            <h4 className="text-xs font-bold text-campus-muted uppercase tracking-wider">Placed Students</h4>
                                        </div>
                                        <p className="text-4xl font-black text-white tracking-tight">420<span className="text-brand-400">+</span></p>
                                    </div>
                                </div>

                                {/* Top Companies Horizontal Scroll */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-black text-white tracking-tight">Top Companies</h3>
                                        <button className="text-sm font-bold text-brand-400 hover:text-brand-300 transition-colors">View All</button>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 snap-x">
                                        {['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Apple'].map((company) => (
                                            <div key={company} className="shrink-0 snap-start bg-campus-card border border-campus-border rounded-[20px] p-6 w-[160px] h-[160px] flex flex-col items-center justify-center gap-4 hover:border-brand-500/30 hover:bg-white/[0.02] hover:shadow-card-hover transition-all cursor-pointer group">
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Building2 size={24} className="text-campus-muted group-hover:text-brand-400 transition-colors" />
                                                </div>
                                                <p className="font-bold text-sm text-center text-white/90">{company}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Active Opportunities Grid */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-black text-white tracking-tight">Active Opportunities</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {[1, 2, 3, 4].map(job => (
                                            <div key={job} className="bg-campus-card border border-campus-border rounded-[16px] p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all flex flex-col group">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-[12px] bg-brand-500/10 flex items-center justify-center border border-brand-500/20 group-hover:bg-brand-500/20 transition-colors">
                                                            <Building2 size={20} className="text-brand-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white tracking-tight leading-tight">Software Developer</h4>
                                                            <p className="text-xs font-medium text-campus-muted mt-1">TechCorp Inc.</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full">New</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-auto pt-5 border-t border-white/[0.04]">
                                                    <div className="flex-1">
                                                        <p className="text-[10px] text-campus-muted font-bold uppercase tracking-widest mb-1">Package</p>
                                                        <p className="text-sm font-black text-white">12-15 LPA</p>
                                                    </div>
                                                    <a href="https://www.linkedin.com/jobs/" target="_blank" rel="noopener noreferrer" className="btn-primary py-2.5 px-6 rounded-[12px] text-sm font-bold shadow-glow hover:scale-105 active:scale-95 transition-all inline-block text-center">
                                                        Apply Now
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
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
