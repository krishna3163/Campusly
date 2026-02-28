import { useState, useEffect } from 'react';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { Assignment, Exam, Note, Conversation } from '../../types';
import { useAppStore } from '../../stores/appStore';
import {
    Plus,
    CheckCircle2,
    X,
    Search,
} from 'lucide-react';
import { RankingEngine } from '../../services/rankingService';

export default function StudyDashboard() {
    const { user } = useUser();
    const { examMode, setExamMode, showToast } = useAppStore();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [myGroups, setMyGroups] = useState<Conversation[]>([]);
    const [showAddModal, setShowAddModal] = useState<'assignment' | 'exam' | null>(null);
    const [searchNotes, setSearchNotes] = useState('');

    useEffect(() => {
        if (user?.id) loadData();
    }, [user?.id]);

    const loadData = async () => {
        if (!user?.id) return;
        try {
            // Get joined groups for Add Task/Exam scope
            const { data: mData } = await insforge.database.from('conversation_members').select('conversation_id').eq('user_id', user.id);
            const groupIds = mData?.map(m => m.conversation_id) || [];

            // Fetch by user_id only (notes/assignments/exams may not have conversation_id in schema)
            const [assignRes, examRes, noteRes, groupRes] = await Promise.all([
                insforge.database.from('assignments').select('*').eq('user_id', user.id),
                insforge.database.from('exams').select('*').eq('user_id', user.id),
                insforge.database.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                groupIds.length > 0 ? insforge.database.from('conversations').select('*').in('id', groupIds) : Promise.resolve({ data: [] })
            ]);

            if (assignRes.data) {
                const ranked = RankingEngine.rankStudyItems(assignRes.data as Assignment[], examRes.data as Exam[] || []);
                setAssignments(ranked.filter(i => 'status' in i) as Assignment[]);
                setExams(ranked.filter(i => 'exam_type' in i) as Exam[]);
            }
            if (noteRes.data) setNotes(noteRes.data as Note[]);
            if (groupRes.data) setMyGroups(RankingEngine.rankGroups(groupRes.data as Conversation[]));
        } catch (err) { }
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


    return (
        <div className="h-full bg-campus-darker overflow-y-auto px-6 py-10">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Good Morning, {(user?.profile?.display_name as string)?.split(' ')[0] || 'Student'}</h1>
                        <p className="text-campus-muted text-sm mt-1 font-medium">Ready to conquer your tasks today?</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setExamMode(!examMode)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${examMode ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-campus-card border-campus-border text-campus-muted hover:border-brand-500/30'}`}
                        >
                            <span className="text-sm font-bold">Exam Mode</span>
                            <div className={`w-11 h-6 rounded-full transition-colors ${examMode ? 'bg-amber-500' : 'bg-campus-darker'}`}>
                                <div className={`w-5 h-5 mt-0.5 rounded-full bg-white transition-transform ${examMode ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'}`} />
                            </div>
                        </button>
                        <button onClick={() => setShowAddModal('assignment')} className="btn-primary px-5 py-2.5 rounded-2xl flex items-center gap-2 text-sm shadow-glow font-bold active:scale-95">
                            <Plus size={18} strokeWidth={2.5} /> Add Task
                        </button>
                    </div>
                </header>

                {/* Middle: 3 stat cards (removed CGPA) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                    <div className="bg-campus-card rounded-[16px] overflow-hidden border border-campus-border shadow-card hover:-translate-y-1 transition-transform">
                        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                        <div className="p-6 flex flex-col items-center justify-center text-center">
                            <p className="text-4xl font-black text-white mb-2 tracking-tight">{assignments.filter(a => a.status !== 'completed').length}</p>
                            <p className="text-[11px] font-bold text-campus-muted uppercase tracking-wider">Pending Tasks</p>
                        </div>
                    </div>
                    <div className="bg-campus-card rounded-[16px] overflow-hidden border border-campus-border shadow-card hover:-translate-y-1 transition-transform">
                        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-amber-600"></div>
                        <div className="p-6 flex flex-col items-center justify-center text-center">
                            <p className="text-4xl font-black text-white mb-2 tracking-tight">{exams.length}</p>
                            <p className="text-[11px] font-bold text-campus-muted uppercase tracking-wider">Upcoming Exams</p>
                        </div>
                    </div>
                    <div className="bg-campus-card rounded-[16px] overflow-hidden border border-campus-border shadow-card hover:-translate-y-1 transition-transform">
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                        <div className="p-6 flex flex-col items-center justify-center text-center">
                            <p className="text-4xl font-black text-white mb-2 tracking-tight">{notes.length}</p>
                            <p className="text-[11px] font-bold text-campus-muted uppercase tracking-wider">Study Notes</p>
                        </div>
                    </div>
                </div>

                {/* Exam Mode ON: Pomodoro */}
                {examMode && <PomodoroWidget />}

                {/* Notes search & list */}
                <div className="mb-8">
                    <div className="relative mb-4">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-campus-muted" />
                        <input type="text" value={searchNotes} onChange={e => setSearchNotes(e.target.value)} placeholder="Search notes from groups & channels..." className="w-full bg-campus-card/50 border border-campus-border/50 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-campus-muted/60 outline-none focus:border-brand-500" />
                    </div>
                    {notes.length > 0 && (
                        <div className="bg-campus-card rounded-[20px] p-5 border border-campus-border shadow-card">
                            <h3 className="font-bold text-white mb-4">Study Notes</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {notes
                                    .filter(n => {
                                        if (!searchNotes.trim()) return true;
                                        const q = searchNotes.toLowerCase();
                                        const title = (n.title || '').toLowerCase();
                                        const content = (n.content || '').toLowerCase();
                                        const subject = (n.subject || '').toLowerCase();
                                        const tags = (n.tags || []).join(' ').toLowerCase();
                                        return title.includes(q) || content.includes(q) || subject.includes(q) || tags.includes(q);
                                    })
                                    .map(n => (
                                        <div key={n.id} className="flex items-center justify-between p-3 rounded-xl bg-campus-darker/50 border border-white/[0.03] hover:border-brand-500/30 transition-all">
                                            <div>
                                                <p className="font-bold text-white text-sm">{n.title}</p>
                                                <p className="text-xs text-campus-muted">{n.subject || n.type}</p>
                                            </div>
                                            <span className="text-[10px] font-bold text-campus-muted uppercase">{n.type}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom: Upcoming tasks list */}
                <div className="bg-campus-card rounded-[24px] p-6 lg:p-8 border border-campus-border shadow-card mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-white">Upcoming Tasks</h3>
                        <button onClick={() => setShowAddModal('exam')} className="text-sm font-bold text-brand-400 hover:text-brand-300 transition-colors">Add Exam</button>
                    </div>
                    <div className="space-y-3">
                        {assignments.length > 0 ? assignments.map(a => (
                            <div key={a.id} className="flex items-center justify-between p-4 rounded-[16px] bg-campus-darker/50 border border-white/[0.03] hover:border-brand-500/30 hover:bg-white/[0.02] transition-all group">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => handleToggleTask(a)} className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-all ${a.status === 'completed' ? 'bg-brand-500 text-white' : 'border-2 border-campus-muted/50 hover:border-brand-500 group-hover:bg-white/5'}`}>
                                        {a.status === 'completed' && <CheckCircle2 size={16} strokeWidth={3} />}
                                    </button>
                                    <div>
                                        <h4 className={`font-bold text-[15px] transition-colors tracking-tight ${a.status === 'completed' ? 'text-campus-muted line-through' : 'text-white'}`}>{a.title}</h4>
                                        <p className="text-xs font-medium text-campus-muted mt-0.5">{a.subject} <span className="mx-1">•</span> {a.conversation_id ? 'Group' : 'Personal'}</p>
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <div className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full uppercase tracking-wide">{getDaysUntil(a.due_date || '')}</div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 opacity-50">
                                <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500 opacity-60" strokeWidth={1.5} />
                                <p className="font-bold text-white text-lg tracking-tight">All caught up!</p>
                                <p className="text-sm font-medium text-campus-muted mt-1">You have no pending tasks to conquer.</p>
                            </div>
                        )}
                    </div>
                </div>

                {showAddModal && <AddDialog type={showAddModal} onClose={() => setShowAddModal(null)} onCreated={loadData} userId={user?.id || ''} groups={myGroups} showToast={showToast} />}
            </div>
        </div>
    );
}

function PomodoroWidget() {
    const [totalSeconds, setTotalSeconds] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    useEffect(() => {
        if (!isRunning) return;
        const t = setInterval(() => setTotalSeconds(s => s <= 0 ? 25 * 60 : s - 1), 1000);
        return () => clearInterval(t);
    }, [isRunning]);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return (
        <div className="mb-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-6">
            <div>
                <h3 className="font-bold text-amber-400">Pomodoro Focus</h3>
                <p className="text-sm text-campus-muted">25 min work • 5 min break</p>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-3xl font-mono font-black text-white">{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>
                <button onClick={() => setIsRunning(!isRunning)} className={`px-4 py-2 rounded-xl text-sm font-bold ${isRunning ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-500 text-white'}`}>{isRunning ? 'Pause' : 'Start'}</button>
                <button onClick={() => { setTotalSeconds(25 * 60); setIsRunning(false); }} className="px-3 py-2 rounded-xl bg-white/5 text-campus-muted hover:text-white text-sm">Reset</button>
            </div>
        </div>
    );
}

function AddDialog({ type, onClose, onCreated, userId, groups, showToast }: { type: 'assignment' | 'exam', onClose: () => void, onCreated: () => void, userId: string, groups: Conversation[], showToast: (m: string, t: 'success'|'error'|'info') => void }) {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState('');
    const [selectedScope, setSelectedScope] = useState('personal');

    const handleSave = async () => {
        if (!title.trim()) return;
        try {
            const payload = { user_id: userId, title, subject, conversation_id: selectedScope === 'personal' ? null : selectedScope };
            if (type === 'assignment') {
                const { error } = await insforge.database.from('assignments').insert([{ ...payload, due_date: date || null, status: 'pending', priority: 'medium' }]);
                if (error) throw error;
            } else {
                const { error } = await insforge.database.from('exams').insert([{ ...payload, exam_date: date || new Date().toISOString(), exam_type: 'internal' }]);
                if (error) throw error;
            }
            showToast(`${type === 'assignment' ? 'Task' : 'Exam'} added!`, 'success');
            onCreated();
            onClose();
        } catch (err) {
            showToast('Failed to add. Try again.', 'error');
        }
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
