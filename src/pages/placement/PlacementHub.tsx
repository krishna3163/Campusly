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
} from 'lucide-react';
import { RankingEngine } from '../../services/rankingService';
import { resumeService, ResumeExtractedData } from '../../services/resumeService';
import { useUser } from '@insforge/react';

export default function PlacementHub() {
    const { user } = useUser();
    const [experiences, setExperiences] = useState<InterviewExperience[]>([]);
    const [activeSection, setActiveSection] = useState<'overview' | 'experiences' | 'resume'>('overview');
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
                                    { id: 'resume', label: 'AI Resume Expert', icon: Sparkles },
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
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="glass-card p-6 flex flex-col justify-between h-40">
                                        <Award size={20} className="text-brand-400" />
                                        <div>
                                            <h4 className="text-xs font-bold text-campus-muted uppercase">Highest Package</h4>
                                            <p className="text-3xl font-black text-white">45.5 LPA</p>
                                        </div>
                                    </div>
                                    <div className="glass-card p-6 flex flex-col justify-between h-40">
                                        <Users size={20} className="text-purple-400" />
                                        <div>
                                            <h4 className="text-xs font-bold text-campus-muted uppercase">Placed Students</h4>
                                            <p className="text-3xl font-black text-white">420+</p>
                                        </div>
                                    </div>
                                </div>

                                <section>
                                    <h3 className="text-xl font-bold mb-6">Recent Experiences</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {experiences.slice(0, 4).map(exp => (
                                            <button key={exp.id} onClick={() => setSelectedExp(exp)} className="glass-card p-5 text-left hover:bg-white/5 transition-all">
                                                <h4 className="font-bold text-white">{exp.company}</h4>
                                                <p className="text-[10px] text-campus-muted uppercase">{exp.role || 'SDE'}</p>
                                                <p className="text-xs text-white/60 mt-4 line-clamp-2">"{exp.preparation_tips}"</p>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </>
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
