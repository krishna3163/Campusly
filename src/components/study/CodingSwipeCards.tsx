import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, Check, Bookmark, Flame, Zap, Trophy, Brain } from 'lucide-react';
import { CodingService } from '../../services/codingService';

interface QuestionCard {
    title: string;
    titleSlug: string;
    difficulty: string;
    tags: string[];
}

export default function CodingSwipeCards({ userId }: { userId: string }) {
    const [questions, setQuestions] = useState<QuestionCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        setLoading(true);
        const data = await CodingService.getSwipeQuestions(userId);
        setQuestions(data);
        setLoading(false);
    };

    const handleSwipe = async (slug: string, action: 'solved' | 'to-do' | 'never') => {
        await CodingService.saveSwipeAction(userId, slug, action);
        setCurrentIndex(prev => prev + 1);
        if (currentIndex >= questions.length - 2) {
            // Load more if near end
            const more = await CodingService.getSwipeQuestions(userId);
            setQuestions(prev => [...prev, ...more]);
        }
    };

    if (loading) return <div className="h-[400px] flex items-center justify-center bg-[var(--surface)] rounded-3xl animate-pulse">Loading Cards...</div>;
    if (currentIndex >= questions.length) return (
        <div className="h-[400px] flex flex-col items-center justify-center bg-[var(--surface)] rounded-3xl border-2 border-dashed border-[var(--border)] p-10 text-center">
            <Trophy size={48} className="text-amber-400 mb-4" />
            <h3 className="font-bold text-xl mb-2">You're on Fire!</h3>
            <p className="text-[var(--foreground-muted)] mb-6">No more questions for now. Come back tomorrow!</p>
            <button onClick={() => setCurrentIndex(0)} className="px-6 py-2 bg-[#007AFF] text-white rounded-full font-bold">Refresh Stack</button>
        </div>
    );

    return (
        <div className="relative w-full h-[450px] flex items-center justify-center select-none overflow-hidden">
            <AnimatePresence>
                {questions.slice(currentIndex, currentIndex + 3).reverse().map((q, i) => (
                    <TinderCard
                        key={q.titleSlug}
                        question={q}
                        isTop={i === (questions.slice(currentIndex, currentIndex + 3).length - 1)}
                        onSwipe={(status) => handleSwipe(q.titleSlug, status)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

function TinderCard({ question, onSwipe, isTop }: { question: QuestionCard, onSwipe: (s: 'solved' | 'to-do' | 'never') => void, isTop: boolean }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.x > 100) onSwipe('solved');
        else if (info.offset.x < -100) onSwipe('never');
    };

    if (!isTop) return (
        <div className="absolute w-[90%] h-[400px] bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-md flex flex-col p-8 opacity-40 scale-[0.95]" style={{ bottom: -10 }}>
            <div className="w-2/3 h-6 bg-[var(--background)] rounded-full mb-4 animate-pulse" />
            <div className="w-full h-32 bg-[var(--background)] rounded-2xl animate-pulse" />
        </div>
    );

    return (
        <motion.div
            style={{ x, rotate, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.05 }}
            className="absolute w-[95%] h-[400px] bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col p-8 cursor-grab active:cursor-grabbing z-50 touch-none"
        >
            {/* Visual Indicators */}
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 right-10 border-4 border-emerald-500 rounded-xl px-4 py-2 rotate-[20deg] text-emerald-500 text-3xl font-black z-50">SOLVE</motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 left-10 border-4 border-red-500 rounded-xl px-4 py-2 rotate-[-20deg] text-red-500 text-3xl font-black z-50">NAH</motion.div>

            <div className="flex items-center gap-2 mb-6">
                <Brain className="text-[#007AFF]" size={20} />
                <span className="text-[12px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">Random Challenge</span>
            </div>

            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-tight">{question.title}</h3>

            <div className="flex flex-wrap gap-2 mb-8">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border 
                    ${question.difficulty === 'Easy' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' :
                        question.difficulty === 'Medium' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' :
                            'text-red-500 border-red-500/20 bg-red-500/10'}`}>
                    {question.difficulty}
                </span>
                {question.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-[var(--background)] text-[var(--foreground-muted)] text-[11px] font-medium border border-[var(--border)]">
                        {tag}
                    </span>
                ))}
            </div>

            <div className="mt-auto space-y-4">
                <p className="text-[14px] text-[var(--foreground-muted)] italic">"Believe you can and you're halfway there." - T.R.</p>
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <button
                        onClick={() => onSwipe('never')}
                        className="w-14 h-14 rounded-full border-2 border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-50 transition-all active:scale-90"
                    >
                        <X size={28} />
                    </button>
                    <button
                        onClick={() => onSwipe('to-do')}
                        className="w-14 h-14 rounded-full border-2 border-[#007AFF]/20 flex items-center justify-center text-[#007AFF] hover:bg-blue-50 transition-all active:scale-90"
                    >
                        <Bookmark size={24} />
                    </button>
                    <button
                        onClick={() => onSwipe('solved')}
                        className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:scale-110 transition-all active:scale-90"
                    >
                        <Check size={32} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
