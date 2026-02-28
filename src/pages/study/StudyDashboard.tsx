import { useState, useEffect } from 'react';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { Assignment, Exam, Note } from '../../types';
import {
    FileText,
    Calendar,
    Plus,
    FolderOpen,
    Brain,
    Users,
    Lightbulb,
    GraduationCap,
    CheckCircle2,
    Timer,
    TrendingUp,
    ChevronRight,
    Search,
    Mic,
    Sparkles,
    Trophy,
    Trash2,
    X,
} from 'lucide-react';

export default function StudyDashboard() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'assignments' | 'exams'>('overview');
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState<'assignment' | 'exam' | null>(null);
    const [isAiSummarizing, setIsAiSummarizing] = useState(false);

    useEffect(() => {
        if (user?.id) loadData();
    }, [user?.id]);

    const loadData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [assignRes, examRes, noteRes] = await Promise.all([
                insforge.database.from('assignments').select('*').eq('user_id', user.id).order('due_date', { ascending: true }),
                insforge.database.from('exams').select('*').eq('user_id', user.id).order('exam_date', { ascending: true }),
                insforge.database.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            ]);
            if (assignRes.data) setAssignments(assignRes.data as Assignment[]);
            if (examRes.data) setExams(examRes.data as Exam[]);
            if (noteRes.data) setNotes(noteRes.data as Note[]);
        } catch (err) { } finally { setLoading(false); }
    };

    const getDaysUntil = (dateStr: string) => {
        if (!dateStr) return 'No date';
        const diff = new Date(dateStr).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0) return 'Passed';
        if (days === 0) return 'Today!';
        if (days === 1) return 'Tomorrow';
        return `${days} days`;
    };

    const handleToggleTask = async (task: Assignment) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        setAssignments(prev => prev.map(a => a.id === task.id ? { ...a, status: newStatus } : a));
        await insforge.database.from('assignments').update({ status: newStatus }).eq('id', task.id);
    };

    const handleDeleteNote = async (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        await insforge.database.from('notes').delete().eq('id', id);
    };

    const handleAiSummary = () => {
        setIsAiSummarizing(true);
        setTimeout(() => {
            setIsAiSummarizing(false);
            alert("AI Analysis Complete: 3 core concepts identified in 'Data Structures' notes.");
        }, 2000);
    };

    return (
        <div className="h-full bg-campus-darker overflow-y-auto px-6 py-10">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-2 text-brand-400">
                            <Sparkles size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Academic Companion</span>
                        </div>
                        <h1 className="text-3xl font-black text-white">Study Dashboard</h1>
                        <p className="text-campus-muted text-sm mt-1">Track your progress, manage notes, and ace your exams.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="btn-secondary px-5 py-2.5 rounded-2xl flex items-center gap-2 text-sm border-white/5 hover:bg-white/10 transition-all">
                            <Search size={18} />
                            <span className="hidden sm:inline">Search Hub</span>
                        </button>
                        <button
                            onClick={() => setShowAddModal('assignment')}
                            className="btn-primary animate-glow px-6 py-2.5 rounded-2xl flex items-center gap-2 text-sm active:scale-95 transition-all"
                        >
                            <Plus size={18} />
                            <span>Quick Action</span>
                        </button>
                    </div>
                </header>

                {/* Main Desktop Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column — Navigation & Stats */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="glass-card p-6 bg-gradient-to-br from-brand-600/10 to-transparent">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm text-white">Target GPA</h3>
                                <Trophy size={16} className="text-amber-400" />
                            </div>
                            <div className="text-4xl font-black text-white mb-1">9.2<span className="text-sm font-medium text-campus-muted">/10</span></div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-500 w-[92%]"></div>
                            </div>
                            <p className="text-[10px] text-campus-muted mt-3">You're in the top 5% of your branch. Keep it up!</p>
                        </div>

                        <nav className="flex flex-col gap-1">
                            {[
                                { id: 'overview', label: 'Overview', icon: TrendingUp },
                                { id: 'notes', label: 'Study Vault', icon: FolderOpen },
                                { id: 'assignments', label: 'Assignments', icon: CheckCircle2 },
                                { id: 'exams', label: 'Exam Tracker', icon: GraduationCap },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm ${activeTab === tab.id ? 'bg-white/10 text-white border border-white/10 shadow-sm' : 'text-campus-muted hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        <div className="glass-card p-5 border-purple-500/20 bg-purple-500/5 group relative overflow-hidden">
                            <h4 className="text-xs font-bold text-purple-400 uppercase mb-3">AI Study Buddy</h4>
                            <p className="text-xs text-white/70 leading-relaxed mb-4">Summarize your 20-page PDF note into 5 bullet points instantly.</p>
                            <button
                                onClick={handleAiSummary}
                                disabled={isAiSummarizing}
                                className="w-full py-2.5 rounded-xl bg-purple-600/20 text-purple-400 text-xs font-bold border border-purple-600/30 hover:bg-purple-600/30 transition-all disabled:opacity-50"
                            >
                                {isAiSummarizing ? 'Analyzing...' : 'Try AI Summary'}
                            </button>
                        </div>
                    </div>

                    {/* Middle Column — Dynamic Content */}
                    <div className="lg:col-span-6 space-y-6">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center p-20">
                                <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : activeTab === 'overview' ? (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    <button onClick={() => setActiveTab('assignments')} className="glass-card p-5 text-center transition-all hover:scale-105 hover:bg-white/5 group">
                                        <p className="text-3xl font-black text-brand-400 group-hover:scale-110 transition-transform">{assignments.filter(a => a.status !== 'completed').length}</p>
                                        <p className="text-[11px] font-bold text-campus-muted uppercase mt-1">Pending</p>
                                    </button>
                                    <button onClick={() => setActiveTab('exams')} className="glass-card p-5 text-center transition-all hover:scale-105 hover:bg-white/5 group">
                                        <p className="text-3xl font-black text-amber-500 group-hover:scale-110 transition-transform">{exams.length}</p>
                                        <p className="text-[11px] font-bold text-campus-muted uppercase mt-1">Exams</p>
                                    </button>
                                    <button onClick={() => setActiveTab('notes')} className="glass-card p-5 text-center transition-all hover:scale-105 hover:bg-white/5 group">
                                        <p className="text-3xl font-black text-emerald-500 group-hover:scale-110 transition-transform">{notes.length}</p>
                                        <p className="text-[11px] font-bold text-campus-muted uppercase mt-1">Notes</p>
                                    </button>
                                </div>

                                <div className="glass-card p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-white">Upcoming Milestones</h3>
                                        <button onClick={() => setActiveTab('assignments')} className="text-xs text-brand-400 font-bold hover:underline">View All</button>
                                    </div>
                                    <div className="space-y-4">
                                        {assignments.length > 0 ? (
                                            assignments.slice(0, 4).map(a => (
                                                <div key={a.id} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleToggleTask(a); }}
                                                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${a.status === 'completed' ? 'bg-brand-500 text-white' : 'bg-white/5 border border-white/10 text-transparent'}`}
                                                        >
                                                            <CheckCircle2 size={14} className={a.status === 'completed' ? 'opacity-100' : 'opacity-0'} />
                                                        </button>
                                                        <div>
                                                            <h4 className={`font-bold text-sm ${a.status === 'completed' ? 'text-campus-muted line-through' : 'text-white/90'}`}>{a.title}</h4>
                                                            <p className="text-[10px] text-campus-muted font-bold uppercase">{a.subject}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-amber-500">{getDaysUntil(a.due_date || '')}</div>
                                                        <div className="text-[10px] text-campus-muted">{a.due_date ? new Date(a.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '--'}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center py-10 text-sm text-campus-muted">No upcoming milestones. Add one!</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : activeTab === 'notes' ? (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Study Vault</h3>
                                    <button onClick={() => alert("Note uploading coming soon!")} className="btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5">
                                        <Plus size={14} /> Add Note
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {notes.map(note => (
                                        <div key={note.id} className="glass-card p-4 group hover:bg-white/5 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                                                    <FileText size={20} />
                                                </div>
                                                <button onClick={() => handleDeleteNote(note.id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-campus-muted hover:text-red-400 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <h4 className="font-bold text-sm mb-1">{note.title}</h4>
                                            <p className="text-[10px] font-medium text-campus-muted uppercase tracking-wider">{note.subject}</p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-[10px] text-campus-muted">{new Date(note.created_at).toLocaleDateString()}</span>
                                                <button className="text-[10px] font-bold text-brand-400 flex items-center gap-1">Open <ChevronRight size={10} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {notes.length === 0 && <div className="col-span-full py-20 text-center text-campus-muted">No notes yet. Start building your vault.</div>}
                                </div>
                            </div>
                        ) : activeTab === 'assignments' ? (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Assignments</h3>
                                    <button onClick={() => setShowAddModal('assignment')} className="btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5">
                                        <Plus size={14} /> New Task
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {assignments.map(a => (
                                        <div key={a.id} className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-all">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleToggleTask(a)}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${a.status === 'completed' ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 border border-white/10 text-white/20'}`}
                                                >
                                                    <CheckCircle2 size={24} />
                                                </button>
                                                <div>
                                                    <h4 className={`font-bold ${a.status === 'completed' ? 'text-campus-muted line-through' : 'text-white'}`}>{a.title}</h4>
                                                    <p className="text-xs text-campus-muted">{a.subject}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-amber-500">{getDaysUntil(a.due_date || '')}</p>
                                                <p className="text-[10px] text-campus-muted">{a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No date'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Exam Tracker</h3>
                                    <button onClick={() => setShowAddModal('exam')} className="btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5">
                                        <Plus size={14} /> Add Exam
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {exams.map(e => (
                                        <div key={e.id} className="glass-card p-5 flex items-center justify-between border-l-4 border-amber-500">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <GraduationCap size={16} className="text-amber-400" />
                                                    <h4 className="font-bold">{e.title}</h4>
                                                </div>
                                                <p className="text-sm text-campus-muted">{e.subject} • {e.exam_type}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-amber-400">{getDaysUntil(e.exam_date)}</p>
                                                <p className="text-xs text-campus-muted">{new Date(e.exam_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column — Schedule */}
                    <div className="lg:col-span-3 space-y-6">
                        <section className="glass-card p-6">
                            <h3 className="font-bold text-sm mb-5 flex items-center gap-2 text-white">
                                <Timer size={18} className="text-brand-400" />
                                Today's Schedule
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { time: '09:00', label: 'Data Structures', color: 'bg-blue-500' },
                                    { time: '11:00', label: 'Cloud Computing', color: 'bg-purple-500' },
                                    { time: '14:30', label: 'Lab Experiment', color: 'bg-emerald-500' },
                                ].map(s => (
                                    <div key={s.time} className="flex gap-4 group cursor-pointer">
                                        <div className="text-xs font-bold text-campus-muted py-1 w-10">{s.time}</div>
                                        <div className="flex-1 border-l-2 border-white/5 pl-4 pb-2 group-hover:border-white/10 transition-all">
                                            <div className={`px-3 py-1.5 rounded-lg ${s.color}/10 text-white text-xs font-bold border border-${s.color}/20 hover:bg-${s.color}/20 transition-all`}>
                                                {s.label}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="glass-card p-6 border-brand-500/20 bg-brand-500/5 overflow-hidden">
                            <div className="flex items-center gap-2 mb-4">
                                <Lightbulb size={18} className="text-brand-400" />
                                <h3 className="text-sm font-bold text-white">Study Tip</h3>
                            </div>
                            <p className="text-xs italic text-brand-200/80 leading-relaxed">"The Feynman Technique: Try explaining your current topic to a 10-year old. If you can't, you don't understand it well enough yet."</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modals */}
            {showAddModal && <AddDialog type={showAddModal} onClose={() => setShowAddModal(null)} onCreated={loadData} userId={user?.id || ''} />}
        </div>
    );
}

function AddDialog({ type, onClose, onCreated, userId }: { type: 'assignment' | 'exam', onClose: () => void, onCreated: () => void, userId: string }) {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState('');

    const handleSave = async () => {
        if (!title.trim()) return;
        if (type === 'assignment') {
            await insforge.database.from('assignments').insert({ user_id: userId, title, subject, due_date: date || null, status: 'pending', priority: 'medium' });
        } else {
            await insforge.database.from('exams').insert({ user_id: userId, title, subject, exam_date: date || new Date().toISOString(), exam_type: 'internal' });
        }
        onCreated();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-card p-8 w-full max-w-md animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black">Add {type}</h2>
                    <button onClick={onClose} className="text-campus-muted hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-brand-500" />
                    <input type="text" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-brand-500" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-brand-500" />
                    <button onClick={handleSave} className="btn-primary w-full py-3 rounded-2xl font-bold">Save {type}</button>
                </div>
            </div>
        </div>
    );
}
