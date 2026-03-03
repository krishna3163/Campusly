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
    Pencil,
    Trash2,
    Clock,
    BookOpen,
    Trophy,
    Calendar,
    ChevronRight,
    Play,
    Pause,
    RotateCcw
} from 'lucide-react';
import { RankingEngine } from '../../services/rankingService';
import LeetCodeWidget from '../../components/study/LeetCodeWidget';
import LeetCodeComparison from '../../components/study/LeetCodeComparison';
import LeetCodeQOTD from '../../components/study/LeetCodeQOTD';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudyDashboard() {
    const { user } = useUser();
    const { examMode, setExamMode, showToast } = useAppStore();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [myGroups, setMyGroups] = useState<Conversation[]>([]);
    const [showAddModal, setShowAddModal] = useState<{ type: 'assignment' | 'exam', item?: any } | null>(null);
    const [searchNotes, setSearchNotes] = useState('');

    useEffect(() => {
        if (user?.id) loadData();
    }, [user?.id]);

    const loadData = async () => {
        if (!user?.id) return;
        try {
            const { data: mData } = await insforge.database.from('conversation_members').select('conversation_id').eq('user_id', user.id);
            const groupIds = mData?.map(m => m.conversation_id) || [];

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
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `${days}d left`;
    };

    const handleToggleTask = async (task: Assignment) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        setAssignments(prev => prev.map(a => a.id === task.id ? { ...a, status: newStatus } : a));
        await insforge.database.from('assignments').update({ status: newStatus }).eq('id', task.id);
    };

    const handleDeleteTask = async (id: string, type: 'assignment' | 'exam') => {
        const table = type === 'assignment' ? 'assignments' : 'exams';
        const { error } = await insforge.database.from(table).delete().eq('id', id);
        if (!error) {
            showToast('Deleted', 'success');
            loadData();
        }
    };

    return (
        <div className="h-full bg-[var(--background)] flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-[var(--surface)] px-5 pt-12 pb-5 border-b border-[var(--border)]">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <p className="text-[13px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-1">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <h1 className="text-[34px] font-bold text-[var(--foreground)] tracking-tight leading-tight">
                            Study Center
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowAddModal({ type: 'assignment' })}
                        className="w-10 h-10 bg-[var(--background)] rounded-full flex items-center justify-center text-[#007AFF] active:scale-90 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex items-center justify-between bg-[var(--background)] p-1 rounded-[10px]">
                    <button
                        onClick={() => setExamMode(false)}
                        className={`flex-1 py-1.5 text-[13px] font-semibold rounded-[8px] transition-all ${!examMode ? 'bg-[var(--surface)] shadow-sm text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}`}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => setExamMode(true)}
                        className={`flex-1 py-1.5 text-[13px] font-semibold rounded-[8px] transition-all ${examMode ? 'bg-[var(--surface)] shadow-sm text-[var(--foreground)]' : 'text-[var(--foreground-muted)]'}`}
                    >
                        Exam Mode
                    </button>
                </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                {/* 2x2 Stats Grid */}
                <div className="px-5 py-6 grid grid-cols-2 gap-4">
                    <div className="bg-[var(--surface)] p-4 rounded-[16px] shadow-sm border border-[var(--border)] active:scale-[0.98] transition-all">
                        <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] mb-3">
                            <BookOpen size={18} />
                        </div>
                        <p className="text-[28px] font-bold text-[var(--foreground)] leading-none">{assignments.filter(a => a.status !== 'completed').length}</p>
                        <p className="text-[14px] text-[var(--foreground-muted)] font-medium mt-1">Active Tasks</p>
                    </div>

                    <div className="bg-[var(--surface)] p-4 rounded-[16px] shadow-sm border border-[var(--border)] active:scale-[0.98] transition-all">
                        <div className="w-8 h-8 rounded-full bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500] mb-3">
                            <Calendar size={18} />
                        </div>
                        <p className="text-[28px] font-bold text-[var(--foreground)] leading-none">{exams.length}</p>
                        <p className="text-[14px] text-[var(--foreground-muted)] font-medium mt-1">Upcoming Exams</p>
                    </div>

                    <div className="bg-[var(--surface)] p-4 rounded-[16px] shadow-sm border border-[var(--border)] active:scale-[0.98] transition-all">
                        <div className="w-8 h-8 rounded-full bg-[#34C759]/10 flex items-center justify-center text-[#34C759] mb-3">
                            <CheckCircle2 size={18} />
                        </div>
                        <p className="text-[28px] font-bold text-[var(--foreground)] leading-none">{assignments.filter(a => a.status === 'completed').length}</p>
                        <p className="text-[14px] text-[var(--foreground-muted)] font-medium mt-1">Done Today</p>
                    </div>

                    <div className="bg-[var(--surface)] p-4 rounded-[16px] shadow-sm border border-[var(--border)] active:scale-[0.98] transition-all">
                        <div className="w-8 h-8 rounded-full bg-[#AF52DE]/10 flex items-center justify-center text-[#AF52DE] mb-3">
                            <Trophy size={18} />
                        </div>
                        <p className="text-[28px] font-bold text-[var(--foreground)] leading-none">12</p>
                        <p className="text-[14px] text-[var(--foreground-muted)] font-medium mt-1">Study Streak</p>
                    </div>
                </div>

                {/* Pomodoro Timer (if Exam Mode) */}
                <AnimatePresence>
                    {examMode && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            className="px-5 overflow-hidden"
                        >
                            <PomodoroWidget />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search & Secondary Content */}
                <div className="px-5 mb-8">
                    <div className="bg-[var(--border)] rounded-[10px] px-3 py-2 flex items-center gap-2 mb-6">
                        <Search size={18} className="text-[var(--foreground-muted)]" />
                        <input
                            type="text"
                            value={searchNotes}
                            onChange={e => setSearchNotes(e.target.value)}
                            placeholder="Search tasks or notes..."
                            className="bg-transparent w-full text-[17px] outline-none placeholder:text-[var(--foreground-muted)] text-[var(--foreground)]"
                        />
                    </div>

                    <div className="space-y-6 mb-8">
                        {user?.id && (
                            <>
                                <div className="bg-[var(--surface)] rounded-[16px] border border-[var(--border)] shadow-sm overflow-hidden p-2">
                                    <LeetCodeWidget userId={user.id} />
                                </div>
                                <div className="bg-[var(--surface)] rounded-[16px] border border-[var(--border)] shadow-sm overflow-hidden">
                                    <LeetCodeComparison userId={user.id} />
                                </div>
                                <LeetCodeQOTD />
                            </>
                        )}
                        {!user?.id && <div className="p-4 text-center text-[var(--foreground-muted)] bg-[var(--surface)] rounded-[16px] border border-[var(--border)] shadow-sm">Sign in to see stats</div>}
                    </div>
                </div>

                {/* Minimalist Task List */}
                <div className="px-5">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-[20px] font-bold text-[var(--foreground)]">Upcoming Tasks</h3>
                        <button
                            onClick={() => setShowAddModal({ type: 'assignment' })}
                            className="text-[15px] font-semibold text-[#007AFF]"
                        >
                            See All
                        </button>
                    </div>

                    <div className="bg-[var(--surface)] rounded-[20px] shadow-sm border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
                        {assignments.length > 0 ? (
                            assignments.slice(0, 5).map(a => (
                                <div key={a.id} className="flex items-center gap-4 p-4 active:bg-[var(--background)] transition-colors group">
                                    <button
                                        onClick={() => handleToggleTask(a)}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${a.status === 'completed'
                                            ? 'bg-[#34C759] border-[#34C759] text-white'
                                            : 'border-[var(--border)] bg-[var(--surface)]'
                                            }`}
                                    >
                                        {a.status === 'completed' && <CheckCircle2 size={14} strokeWidth={3} />}
                                    </button>
                                    <div className="flex-1 min-w-0" onClick={() => setShowAddModal({ type: 'assignment', item: a })}>
                                        <h4 className={`text-[17px] font-semibold truncate transition-all cursor-pointer ${a.status === 'completed' ? 'text-[var(--foreground-muted)] line-through' : 'text-[var(--foreground)]'}`}>
                                            {a.title}
                                        </h4>
                                        <p className="text-[13px] text-[var(--foreground-muted)]">{a.subject} • {getDaysUntil(a.due_date || '')}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setShowAddModal({ type: 'assignment', item: a })}
                                            className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-lg transition-all"
                                            title="Edit task"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await insforge.database.from('assignments').delete().eq('id', a.id);
                                                loadData();
                                                showToast('Task deleted', 'success');
                                            }}
                                            className="p-1.5 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-all"
                                            title="Delete task"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Trophy size={40} className="mx-auto mb-3 text-[#34C759] opacity-30" />
                                <p className="text-[17px] font-bold text-[var(--foreground)]">All Caught Up!</p>
                                <p className="text-[15px] text-[var(--foreground-muted)] px-8">You've completed all your tasks for now.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Task/Exam Dialog (iOS Sheet) */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowAddModal(null)}>
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-[430px] bg-[#F2F2F7] rounded-t-[20px] overflow-hidden flex flex-col h-[60vh] pb-safe"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1.5 bg-[#BCBCC0] rounded-full mx-auto my-3" />
                            <AddDialog
                                type={showAddModal.type}
                                item={showAddModal.item}
                                onClose={() => setShowAddModal(null)}
                                onCreated={loadData}
                                userId={user?.id || ''}
                                groups={myGroups}
                                showToast={showToast}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PomodoroWidget() {
    const [focusMinutes, setFocusMinutes] = useState(25);
    const [totalSeconds, setTotalSeconds] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('25');

    useEffect(() => {
        if (!isRunning) return;
        const t = setInterval(() => setTotalSeconds(s => {
            if (s <= 0) {
                setIsRunning(false);
                return focusMinutes * 60;
            }
            return s - 1;
        }), 1000);
        return () => clearInterval(t);
    }, [isRunning, focusMinutes]);

    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;

    const applyTime = () => {
        const mins = parseInt(editValue);
        if (mins > 0 && mins <= 120) {
            setFocusMinutes(mins);
            setTotalSeconds(mins * 60);
            setIsRunning(false);
        }
        setIsEditing(false);
    };

    const presets = [15, 25, 45, 60];

    return (
        <div className="bg-[var(--surface)] p-5 rounded-[16px] border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-[17px] font-bold text-[var(--foreground)] flex items-center gap-2">
                        Focus Timer
                    </h3>
                    <p className="text-[13px] text-[var(--foreground-muted)]">{focusMinutes}m focus session</p>
                </div>
                <div className="flex items-center gap-4">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyTime()}
                                min={1} max={120}
                                className="w-16 text-center text-[20px] font-mono font-bold bg-[var(--background)] border border-[var(--border)] rounded-lg py-1 text-[var(--foreground)] outline-none"
                                autoFocus
                            />
                            <span className="text-[13px] text-[var(--foreground-muted)] font-medium">min</span>
                            <button onClick={applyTime} className="text-[#007AFF] text-[15px] font-bold">Set</button>
                        </div>
                    ) : (
                        <button onClick={() => { setIsEditing(true); setEditValue(String(focusMinutes)); }} className="cursor-pointer">
                            <span className="text-[32px] font-mono font-bold text-[#FF9500]">
                                {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                            </span>
                        </button>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRunning ? 'bg-[#FF3B30] text-white' : 'bg-[#34C759] text-white'
                                }`}
                        >
                            {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                        </button>
                        <button
                            onClick={() => { setTotalSeconds(focusMinutes * 60); setIsRunning(false); }}
                            className="w-10 h-10 bg-[var(--border)] rounded-full flex items-center justify-center text-[var(--foreground-muted)]"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                {presets.map(p => (
                    <button
                        key={p}
                        onClick={() => { setFocusMinutes(p); setTotalSeconds(p * 60); setIsRunning(false); }}
                        className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all ${focusMinutes === p ? 'bg-[#FF9500]/15 text-[#FF9500] border border-[#FF9500]/30' : 'bg-[var(--background)] text-[var(--foreground-muted)] border border-[var(--border)]'}`}
                    >
                        {p}m
                    </button>
                ))}
            </div>
        </div>
    );
}

function AddDialog({ type, item, onClose, onCreated, userId, groups, showToast }: { type: 'assignment' | 'exam', item?: any, onClose: () => void, onCreated: () => void, userId: string, groups: Conversation[], showToast: (m: string, t: 'success' | 'error' | 'info') => void }) {
    const [title, setTitle] = useState(item?.title || '');
    const [subject, setSubject] = useState(item?.subject || '');
    const [date, setDate] = useState(item?.due_date || item?.exam_date || '');
    const [selectedScope, setSelectedScope] = useState(item?.conversation_id || 'personal');

    const handleSave = async () => {
        if (!title.trim()) return;
        try {
            const payload: any = {
                user_id: userId,
                title,
                subject,
                discussion_id: selectedScope === 'personal' ? null : selectedScope,
            };

            const table = type === 'assignment' ? 'assignments' : 'exams';
            const dateField = type === 'assignment' ? 'due_date' : 'exam_date';

            if (item?.id) {
                const { error } = await insforge.database
                    .from(table)
                    .update({ ...payload, [dateField]: date || null })
                    .eq('id', item.id);
                if (error) throw error;
                showToast(`Updated!`, 'success');
            } else {
                if (type === 'assignment') {
                    const { error } = await insforge.database
                        .from('assignments')
                        .insert([{ ...payload, [dateField]: date || null, status: 'pending', priority: 'medium' }]);
                    if (error) throw error;
                } else {
                    const { error } = await insforge.database
                        .from('exams')
                        .insert([{ ...payload, [dateField]: date || new Date().toISOString(), exam_type: 'internal' }]);
                    if (error) throw error;
                }
                showToast(`Saved!`, 'success');
            }
            onCreated();
            onClose();
        } catch (err) {
            showToast('Failed to save', 'error');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--surface)]">
            <div className="px-5 py-4 flex justify-between items-center border-b border-[var(--border)]">
                <button onClick={onClose} className="text-[#007AFF] text-[17px]">Cancel</button>
                <h3 className="text-[17px] font-bold text-[var(--foreground)]">{item?.id ? 'Edit' : 'New'} {type === 'assignment' ? 'Task' : 'Exam'}</h3>
                <button onClick={handleSave} className="text-[#007AFF] text-[17px] font-bold">Save</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[var(--background)]">
                <section className="bg-[var(--surface)] rounded-[12px] border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
                    <div className="px-4 py-3 flex gap-4">
                        <label className="text-[15px] font-medium text-[var(--foreground-muted)] w-20 pt-1">Title</label>
                        <input
                            autoFocus
                            placeholder="Homework, etc."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="flex-1 text-[15px] text-[var(--foreground)] bg-transparent outline-none"
                        />
                    </div>
                    <div className="px-4 py-3 flex gap-4">
                        <label className="text-[15px] font-medium text-[var(--foreground-muted)] w-20 pt-1">Subject</label>
                        <input
                            placeholder="CS101, Math..."
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="flex-1 text-[15px] text-[var(--foreground)] bg-transparent outline-none"
                        />
                    </div>
                </section>

                <section className="bg-[var(--surface)] rounded-[12px] border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
                    <div className="px-4 py-3 flex gap-4">
                        <label className="text-[15px] font-medium text-[var(--foreground-muted)] w-20 pt-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="flex-1 text-[15px] text-[var(--foreground)] bg-transparent outline-none cursor-pointer"
                        />
                    </div>
                    <div className="px-4 py-3 flex gap-4">
                        <label className="text-[15px] font-medium text-[var(--foreground-muted)] w-20 pt-1">Scope</label>
                        <select
                            value={selectedScope}
                            onChange={e => setSelectedScope(e.target.value)}
                            className="flex-1 bg-transparent text-[15px] text-[var(--foreground)] outline-none cursor-pointer"
                        >
                            <option value="personal">Personal</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name || 'Group'}</option>)}
                        </select>
                    </div>
                </section>
            </div>
        </div>
    );
}
