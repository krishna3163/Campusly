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
        <div className="h-full bg-[#F2F2F7] flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-white px-5 pt-12 pb-5 border-b border-[#E5E5EA]">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <p className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-widest mb-1">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <h1 className="text-[34px] font-bold text-black tracking-tight leading-tight">
                            Study Center
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowAddModal({ type: 'assignment' })}
                        className="w-10 h-10 bg-[#F2F2F7] rounded-full flex items-center justify-center text-[#007AFF] active:scale-90 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex items-center justify-between bg-[#F2F2F7] p-1 rounded-[10px]">
                    <button
                        onClick={() => setExamMode(false)}
                        className={`flex-1 py-1.5 text-[13px] font-semibold rounded-[8px] transition-all ${!examMode ? 'bg-white shadow-sm text-black' : 'text-[#8E8E93]'}`}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => setExamMode(true)}
                        className={`flex-1 py-1.5 text-[13px] font-semibold rounded-[8px] transition-all ${examMode ? 'bg-white shadow-sm text-black' : 'text-[#8E8E93]'}`}
                    >
                        Exam Mode
                    </button>
                </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                {/* 2x2 Stats Grid */}
                <div className="px-5 py-6 grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-[16px] shadow-sm border border-black/5 active:scale-[0.98] transition-all">
                        <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] mb-3">
                            <BookOpen size={18} />
                        </div>
                        <p className="text-[28px] font-bold text-black leading-none">{assignments.filter(a => a.status !== 'completed').length}</p>
                        <p className="text-[14px] text-[#8E8E93] font-medium mt-1">Active Tasks</p>
                    </div>

                    <div className="bg-white p-4 rounded-[16px] shadow-sm border border-black/5 active:scale-[0.98] transition-all">
                        <div className="w-8 h-8 rounded-full bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500] mb-3">
                            <Calendar size={18} />
                        </div>
                        <p className="text-[28px] font-bold text-black leading-none">{exams.length}</p>
                        <p className="text-[14px] text-[#8E8E93] font-medium mt-1">Upcoming Exams</p>
                    </div>

                    <div className="bg-white p-4 rounded-[16px] shadow-sm border border-black/5 active:scale-[0.98] transition-all">
                        <div className="w-8 h-8 rounded-full bg-[#34C759]/10 flex items-center justify-center text-[#34C759] mb-3">
                            <CheckCircle2 size={18} />
                        </div>
                        <p className="text-[28px] font-bold text-black leading-none">{assignments.filter(a => a.status === 'completed').length}</p>
                        <p className="text-[14px] text-[#8E8E93] font-medium mt-1">Done Today</p>
                    </div>

                    <div className="bg-white p-4 rounded-[16px] shadow-sm border border-black/5 active:scale-[0.98] transition-all">
                        <div className="w-8 h-8 rounded-full bg-[#AF52DE]/10 flex items-center justify-center text-[#AF52DE] mb-3">
                            <Trophy size={18} />
                        </div>
                        <p className="text-[28px] font-bold text-black leading-none">12</p>
                        <p className="text-[14px] text-[#8E8E93] font-medium mt-1">Study Streak</p>
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
                    <div className="bg-[#E5E5EA]/50 rounded-[10px] px-3 py-2 flex items-center gap-2 mb-6">
                        <Search size={18} className="text-[#8E8E93]" />
                        <input
                            type="text"
                            value={searchNotes}
                            onChange={e => setSearchNotes(e.target.value)}
                            placeholder="Search tasks or notes..."
                            className="bg-transparent w-full text-[17px] outline-none placeholder:text-[#8E8E93] text-black"
                        />
                    </div>

                    <div className="space-y-6 mb-8">
                        {user?.id && (
                            <>
                                <div className="bg-white rounded-[16px] border border-black/5 shadow-sm overflow-hidden p-2">
                                    <LeetCodeWidget userId={user.id} />
                                </div>
                                <div className="bg-white rounded-[16px] border border-black/5 shadow-sm overflow-hidden">
                                    <LeetCodeComparison userId={user.id} />
                                </div>
                            </>
                        )}
                        {!user?.id && <div className="p-4 text-center text-[#8E8E93] bg-white rounded-[16px] border border-black/5 shadow-sm">Sign in to see stats</div>}
                    </div>
                </div>

                {/* Minimalist Task List */}
                <div className="px-5">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-[20px] font-bold text-black">Upcoming Tasks</h3>
                        <button
                            onClick={() => setShowAddModal({ type: 'assignment' })}
                            className="text-[15px] font-semibold text-[#007AFF]"
                        >
                            See All
                        </button>
                    </div>

                    <div className="bg-white rounded-[20px] shadow-sm border border-black/5 divide-y divide-[#E5E5EA] overflow-hidden">
                        {assignments.length > 0 ? (
                            assignments.slice(0, 5).map(a => (
                                <div key={a.id} className="flex items-center gap-4 p-4 active:bg-[#F2F2F7] transition-colors group">
                                    <button
                                        onClick={() => handleToggleTask(a)}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${a.status === 'completed'
                                            ? 'bg-[#34C759] border-[#34C759] text-white'
                                            : 'border-[#C6C6C8] bg-white'
                                            }`}
                                    >
                                        {a.status === 'completed' && <CheckCircle2 size={14} strokeWidth={3} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-[17px] font-semibold truncate transition-all ${a.status === 'completed' ? 'text-[#8E8E93] line-through' : 'text-black'}`}>
                                            {a.title}
                                        </h4>
                                        <p className="text-[13px] text-[#8E8E93]">{a.subject} • {getDaysUntil(a.due_date || '')}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-[#C4C4C6] flex-shrink-0" />
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Trophy size={40} className="mx-auto mb-3 text-[#34C759] opacity-30" />
                                <p className="text-[17px] font-bold text-black">All Caught Up!</p>
                                <p className="text-[15px] text-[#8E8E93] px-8">You've completed all your tasks for now.</p>
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
        <div className="bg-white p-5 rounded-[16px] border border-[#E5E5EA] shadow-sm flex items-center justify-between">
            <div>
                <h3 className="text-[17px] font-bold text-black flex items-center gap-2">
                    Focus Timer
                </h3>
                <p className="text-[13px] text-[#8E8E93]">25m work • 5m break</p>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-[32px] font-mono font-bold text-[#FF9500]">
                    {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRunning ? 'bg-[#FF3B30] text-white' : 'bg-[#34C759] text-white'
                            }`}
                    >
                        {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>
                    <button
                        onClick={() => { setTotalSeconds(25 * 60); setIsRunning(false); }}
                        className="w-10 h-10 bg-[#E5E5EA] rounded-full flex items-center justify-center text-[#8E8E93]"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
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
            const payload = {
                user_id: userId,
                title,
                subject,
                conversation_id: selectedScope === 'personal' ? null : selectedScope,
                updated_at: new Date().toISOString()
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
        <div className="flex flex-col h-full bg-white">
            <div className="px-5 py-4 flex justify-between items-center border-b border-[#E5E5EA]">
                <button onClick={onClose} className="text-[#007AFF] text-[17px]">Cancel</button>
                <h3 className="text-[17px] font-bold">{item?.id ? 'Edit' : 'New'} {type === 'assignment' ? 'Task' : 'Exam'}</h3>
                <button onClick={handleSave} className="text-[#007AFF] text-[17px] font-bold">Save</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#F2F2F7]">
                <section className="bg-white rounded-[12px] border border-[#E5E5EA] divide-y divide-[#E5E5EA] overflow-hidden">
                    <div className="px-4 py-3 flex gap-4">
                        <label className="text-[15px] font-medium text-[#8E8E93] w-20 pt-1">Title</label>
                        <input
                            autoFocus
                            placeholder="Homework, etc."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="flex-1 text-[15px] text-black outline-none"
                        />
                    </div>
                    <div className="px-4 py-3 flex gap-4">
                        <label className="text-[15px] font-medium text-[#8E8E93] w-20 pt-1">Subject</label>
                        <input
                            placeholder="CS101, Math..."
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="flex-1 text-[15px] text-black outline-none"
                        />
                    </div>
                </section>

                <section className="bg-white rounded-[12px] border border-[#E5E5EA] divide-y divide-[#E5E5EA] overflow-hidden">
                    <div className="px-4 py-3 flex gap-4">
                        <label className="text-[15px] font-medium text-[#8E8E93] w-20 pt-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="flex-1 text-[15px] text-black outline-none cursor-pointer"
                        />
                    </div>
                    <div className="px-4 py-3 flex gap-4">
                        <label className="text-[15px] font-medium text-[#8E8E93] w-20 pt-1">Scope</label>
                        <select
                            value={selectedScope}
                            onChange={e => setSelectedScope(e.target.value)}
                            className="flex-1 bg-transparent text-[15px] text-black outline-none cursor-pointer"
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
