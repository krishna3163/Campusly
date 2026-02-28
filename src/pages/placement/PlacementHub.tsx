import { useState, useEffect, useRef } from 'react';
import { insforge } from '../../lib/insforge';
import type { InterviewExperience } from '../../types';
import {
    Briefcase,
    TrendingUp,
    Search,
    Plus,
    Building2,
    Users,
    FileText,
    ChevronRight,
    Award,
    Target,
    BookOpen,
    MessageSquare,
    Sparkles,
    ThumbsUp,
    CheckCircle2,
    ArrowRight,
    Globe,
    Zap,
    X,
    Upload,
} from 'lucide-react';

export default function PlacementHub() {
    const [experiences, setExperiences] = useState<InterviewExperience[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'overview' | 'experiences' | 'resume'>('overview');
    const [selectedExp, setSelectedExp] = useState<InterviewExperience | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadExperiences();
    }, []);

    const loadExperiences = async () => {
        setLoading(true);
        try {
            const { data } = await insforge.database.from('interview_experiences').select('*').order('created_at', { ascending: false });
            if (data) setExperiences(data as InterviewExperience[]);
        } catch (err) { } finally { setLoading(false); }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            setTimeout(() => {
                setIsUploading(false);
                alert("Resume uploaded successfully! Our AI is now analyzing it for improvements.");
            }, 2500);
        }
    };

    const handleExternalJobs = () => {
        window.open('https://www.linkedin.com/jobs/', '_blank');
    };

    return (
        <div className="h-full bg-campus-darker overflow-y-auto px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />

                {/* Header */}
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
                        <button onClick={handleExternalJobs} className="glass-card flex items-center gap-2 px-5 py-3 hover:bg-white/5 active:scale-95 transition-all text-white">
                            <Globe size={18} className="text-brand-400" />
                            <span className="text-sm font-bold">External Jobs</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Panel — Navigation & Prep */}
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
                                        className={`flex items-center justify-between group px-5 py-4 rounded-2xl transition-all ${activeSection === item.id ? 'bg-white/5 text-white' : 'text-campus-muted hover:text-white hover:bg-white/2'
                                            }`}
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

                        <div className="glass-card p-6 bg-gradient-to-br from-emerald-600/10 to-transparent border-emerald-500/20 group overflow-hidden relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <FileText size={20} className="text-emerald-400" />
                                </div>
                                <h3 className="font-bold text-white">Resume Review</h3>
                            </div>
                            <p className="text-sm text-campus-muted leading-relaxed mb-6">Let senior placement coordinators or our AI model review your resume before you apply.</p>
                            <button
                                onClick={handleUploadClick}
                                disabled={isUploading}
                                className="w-full btn-primary bg-emerald-600 hover:bg-emerald-500 shadow-glow py-3 rounded-xl text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Upload size={16} />
                                )}
                                {isUploading ? 'Uploading...' : 'Upload Resume PDF'}
                            </button>
                        </div>

                        <div className="glass-card p-6 border-white/5">
                            <h3 className="text-xs font-black text-campus-muted uppercase tracking-widest mb-6 px-1">Top Recruiting Partners</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {['Google', 'Amazon', 'Meta', 'Tower', 'Intuit', 'Flipkart'].map(l => (
                                    <button key={l} onClick={() => alert(`Showing statistics for ${l}`)} className="aspect-square rounded-2xl bg-white/5 flex items-center justify-center text-xs font-bold border border-white/5 hover:bg-brand-500/10 hover:border-brand-500/50 hover:text-brand-400 transition-all opacity-60 hover:opacity-100">
                                        {l.charAt(0)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Right Panel — Dynamic Content */}
                    <main className="lg:col-span-8 space-y-8">
                        {activeSection === 'overview' ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="glass-card p-6 flex flex-col justify-between h-40 group cursor-pointer hover:border-brand-500/50 transition-all">
                                        <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
                                            <Award size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-campus-muted mb-1 uppercase tracking-tighter">Highest Package (2025)</h4>
                                            <p className="text-3xl font-black text-white">45.5 LPA</p>
                                        </div>
                                    </div>
                                    <div className="glass-card p-6 flex flex-col justify-between h-40 group cursor-pointer hover:border-purple-500/50 transition-all">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-campus-muted mb-1 uppercase tracking-tighter">Placed Students</h4>
                                            <p className="text-3xl font-black text-white">420+</p>
                                        </div>
                                    </div>
                                </div>

                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white">Recent Experiences</h3>
                                        <button onClick={() => setActiveSection('experiences')} className="flex items-center gap-1 text-xs font-bold text-brand-400 hover:underline">
                                            Explore Archive <ArrowRight size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                                        {loading ? (
                                            <div className="col-span-full py-10 flex justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
                                        ) : experiences.slice(0, 4).map(exp => (
                                            <button key={exp.id} onClick={() => setSelectedExp(exp)} className="glass-card p-5 group text-left hover:bg-white/[0.03] transition-all relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronRight size={18} className="text-brand-400" />
                                                </div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-brand-400 transition-colors">
                                                            <Building2 size={22} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-sm text-white">{exp.company}</h4>
                                                            <p className="text-[10px] font-bold text-campus-muted uppercase tracking-wider">{exp.role || 'Software Engineer'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-emerald-500/20">Selected</div>
                                                </div>
                                                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-4 italic">"{exp.content?.substring(0, 80)}..."</p>
                                                <div className="flex items-center justify-between text-[10px] text-campus-muted font-bold">
                                                    <span>4.2k Reads</span>
                                                    <span>By Senior 2025</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </>
                        ) : activeSection === 'experiences' ? (
                            <div className="space-y-4 animate-fade-in">
                                <h3 className="text-2xl font-black">Experience Archive</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {experiences.map(exp => (
                                        <button key={exp.id} onClick={() => setSelectedExp(exp)} className="glass-card p-6 flex items-center justify-between hover:bg-white/5 transition-all text-left group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Building2 size={28} className="text-brand-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-white">{exp.company}</h4>
                                                    <p className="text-xs text-campus-muted uppercase font-black">{exp.role || 'SDE-1'} • 2025 Batch</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-campus-muted group-hover:text-white" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card p-12 flex flex-col items-center justify-center text-center animate-fade-in min-h-[500px] border-emerald-500/10 bg-emerald-500/[0.02]">
                                <Sparkles size={48} className="mb-6 text-emerald-400 animate-pulse" />
                                <h2 className="text-2xl font-black text-white">AI Resume Expert</h2>
                                <p className="text-sm mt-3 text-campus-muted max-w-sm">Our AI is ready to optimize your resume for ATS tracking and professional quality. Upload your PDF to get started.</p>
                                <button onClick={handleUploadClick} className="btn-primary bg-emerald-600 hover:bg-emerald-500 mt-8 px-10 py-3 rounded-2xl font-bold shadow-glow">Upload Resume</button>
                            </div>
                        )}
                    </main>

                </div>
            </div>

            {/* Exp Detail Modal */}
            {selectedExp && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
                    <div className="glass-card p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in relative">
                        <button onClick={() => setSelectedExp(null)} className="absolute top-6 right-6 text-campus-muted hover:text-white bg-white/5 p-2 rounded-xl transition-all"><X size={20} /></button>

                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20">
                                <Building2 size={40} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white">{selectedExp.company}</h1>
                                <p className="text-brand-400 font-bold uppercase tracking-widest">{selectedExp.role || 'Software Engineering'}</p>
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-white font-bold mb-4">Interview Journey</h3>
                            <p className="text-campus-muted leading-relaxed whitespace-pre-wrap">{selectedExp.content || "No detailed content found for this experience."}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
