import { useState, useEffect } from 'react';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { Assignment, Exam, Note, Conversation } from '../../types';
import {
    FileText,
    Plus,
    FolderOpen,
    GraduationCap,
    CheckCircle2,
    Timer,
    TrendingUp,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import { RankingEngine } from '../../services/rankingService';

export default function StudyDashboard() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'assignments' | 'exams'>('overview');
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [myGroups, setMyGroups] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState<'assignment' | 'exam' | null>(null);

    useEffect(() => {
        if (user?.id) loadData();
    }, [user?.id]);

    const loadData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            // Get joined groups
            const { data: mData } = await insforge.database.from('conversation_members').select('conversation_id').eq('user_id', user.id);
            const groupIds = mData?.map(m => m.conversation_id) || [];

            // Build filter for personal + groups
            // In SQL: (user_id = ? OR conversation_id IN (...))
            const filter = groupIds.length > 0
                ? `user_id.eq.${user.id},conversation_id.in.(${groupIds.join(',')})`
                : `user_id.eq.${user.id}`;

            const [assignRes, examRes, noteRes, groupRes] = await Promise.all([
                insforge.database.from('assignments').select('*').or(filter),
                insforge.database.from('exams').select('*').or(filter),
                insforge.database.from('notes').select('*').or(filter).order('created_at', { ascending: false }),
                insforge.database.from('conversations').select('*').in('id', groupIds)
            ]);

            if (assignRes.data) {
                const ranked = RankingEngine.rankStudyItems(assignRes.data as Assignment[], examRes.data as Exam[] || []);
                setAssignments(ranked.filter(i => 'status' in i) as Assignment[]);
                setExams(ranked.filter(i => 'exam_type' in i) as Exam[]);
            }
            if (noteRes.data) setNotes(noteRes.data as Note[]);
            if (groupRes.data) setMyGroups(RankingEngine.rankGroups(groupRes.data as Conversation[]));
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

    return (
        <div className="h-full bg-campus-darker overflow-y-auto px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-brand-400">
                            <Sparkles size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Academic Companion</span>
                        </div>
                        <h1 className="text-3xl font-black text-white">Study Hub</h1>
                        <p className="text-campus-muted text-sm mt-1">Synced with your private study and group channels.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAddModal('assignment')}
                            className="btn-primary px-6 py-2.5 rounded-2xl flex items-center gap-2 text-sm active:scale-95 transition-all"
                        >
                            <Plus size={18} />
                            <span>Add Item</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="glass-card p-6 bg-gradient-to-br from-brand-600/10 to-transparent">
                            <h3 className="font-bold text-xs text-campus-muted uppercase mb-4 tracking-widest text-center">Semester Stats</h3>
                            <div className="text-center">
                                <p className="text-4xl font-black text-white">9.2</p>
                                <p className="text-[10px] text-campus-muted font-bold uppercase mt-1">Current CGPA</p>
                            </div>
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
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-sm ${activeTab === tab.id ? 'bg-white/10 text-white shadow-sm' : 'text-campus-muted hover:text-white hover:bg-white/5'}`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="lg:col-span-6 space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-20 animate-pulse"><div className="w-10 h-10 border-2 border-brand-500 rounded-full border-t-transparent animate-spin" /></div>
                        ) : activeTab === 'overview' ? (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="glass-card p-5 text-center">
                                        <p className="text-xl font-black text-brand-400">{assignments.filter(a => a.status !== 'completed').length}</p>
                                        <p className="text-[10px] text-campus-muted font-bold uppercase">Pending</p>
                                    </div>
                                    <div className="glass-card p-5 text-center">
                                        <p className="text-xl font-black text-amber-500">{exams.length}</p>
                                        <p className="text-[10px] text-campus-muted font-bold uppercase">Exams</p>
                                    </div>
                                    <div className="glass-card p-5 text-center">
                                        <p className="text-xl font-black text-emerald-500">{notes.length}</p>
                                        <p className="text-[10px] text-campus-muted font-bold uppercase">Notes</p>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <h3 className="font-bold mb-6">Upcoming Milestones</h3>
                                    <div className="space-y-4">
                                        {assignments.map(a => (
                                            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-brand-500/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${a.conversation_id ? 'bg-brand-400' : 'bg-campus-muted'}`} title={a.conversation_id ? 'Group Task' : 'Personal'}></div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-white/90">{a.title}</h4>
                                                        <p className="text-[10px] text-campus-muted uppercase italic">{a.conversation_id ? 'Class Group' : 'Personal'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-black text-amber-500">{getDaysUntil(a.due_date || '')}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : activeTab === 'notes' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                {notes.map(note => (
                                    <div key={note.id} className="glass-card p-5 group">
                                        <div className="flex justify-between items-start mb-4">
                                            <FileText className="text-brand-400" size={24} />
                                            <button onClick={() => handleDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-campus-muted hover:text-red-400 transition-opacity"><Trash2 size={16} /></button>
                                        </div>
                                        <h4 className="font-bold mb-1">{note.title}</h4>
                                        <p className="text-xs text-campus-muted">{note.subject}</p>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'assignments' ? (
                            <div className="space-y-2 animate-fade-in">
                                {assignments.map(a => (
                                    <div key={a.id} className="glass-card p-4 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => handleToggleTask(a)} className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${a.status === 'completed' ? 'bg-brand-500 border-brand-500 text-white' : 'border-white/20'}`}>
                                                {a.status === 'completed' && <CheckCircle2 size={14} />}
                                            </button>
                                            <div>
                                                <h4 className={`font-bold text-sm ${a.status === 'completed' ? 'text-campus-muted line-through' : 'text-white'}`}>{a.title}</h4>
                                                <p className="text-[10px] text-campus-muted">{a.subject}</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold text-amber-500">{getDaysUntil(a.due_date || '')}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3 animate-fade-in">
                                {exams.map(e => (
                                    <div key={e.id} className="glass-card p-5 flex items-center justify-between border-l-2 border-amber-500">
                                        <div>
                                            <h4 className="font-bold">{e.title}</h4>
                                            <p className="text-xs text-campus-muted">{e.subject} • {e.exam_type}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-amber-500">{getDaysUntil(e.exam_date)}</p>
                                            <p className="text-[10px] text-campus-muted">{new Date(e.exam_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                        <section className="glass-card p-6">
                            <h3 className="font-bold text-xs uppercase text-campus-muted mb-6 tracking-widest flex items-center gap-2">
                                <Timer size={14} className="text-brand-400" /> Today's Schedule
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { time: '09:00', label: 'Data Structures', color: 'bg-blue-500' },
                                    { time: '11:00', label: 'Cloud Computing', color: 'bg-purple-500' },
                                    { time: '14:30', label: 'Lab Experiment', color: 'bg-emerald-500' },
                                ].map(s => (
                                    <div key={s.time} className="flex gap-4">
                                        <div className="text-[10px] font-black text-campus-muted py-1">{s.time}</div>
                                        <div className="flex-1 border-l border-white/5 pl-4 pb-2">
                                            <div className={`px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white/90`}>{s.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {showAddModal && <AddDialog type={showAddModal} onClose={() => setShowAddModal(null)} onCreated={loadData} userId={user?.id || ''} groups={myGroups} />}
        </div>
    );
}

function AddDialog({ type, onClose, onCreated, userId, groups }: { type: 'assignment' | 'exam', onClose: () => void, onCreated: () => void, userId: string, groups: Conversation[] }) {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState('');
    const [selectedScope, setSelectedScope] = useState('personal');

    const handleSave = async () => {
        if (!title.trim()) return;
        const payload = {
            user_id: userId,
            title,
            subject,
            conversation_id: selectedScope === 'personal' ? null : selectedScope
        };
        if (type === 'assignment') {
            await insforge.database.from('assignments').insert({ ...payload, due_date: date || null, status: 'pending', priority: 'medium' });
        } else {
            await insforge.database.from('exams').insert({ ...payload, exam_date: date || new Date().toISOString(), exam_type: 'internal' });
        }
        onCreated();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card p-8 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white">Add {type}</h2>
                    <button onClick={onClose} className="text-campus-muted hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <input autoFocus placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white outline-none focus:border-brand-500" />
                    <input placeholder="Subject (e.g. CS201)" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white outline-none focus:border-brand-500" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-campus-muted ml-2 uppercase">Due Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-campus-muted ml-2 uppercase">Scope</label>
                            <select value={selectedScope} onChange={e => setSelectedScope(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs outline-none cursor-pointer">
                                <option value="personal">Personal</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name || 'Group'}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSave} className="w-full btn-primary py-4 rounded-2xl font-bold mt-4 shadow-glow">Create {type}</button>
                </div>
            </div>
        </div>
    );
}
