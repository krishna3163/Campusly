/**
 * Exam Mode Widget — Shows countdown and focus indicator in the top bar
 */

import { useExamMode } from '../../hooks/useExamMode';
import { Timer, X, Zap } from 'lucide-react';

export default function ExamModeWidget() {
    const { examMode, countdown, toggleExamMode } = useExamMode();

    if (!examMode) return null;

    return (
        <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-xl px-3 py-1.5 animate-fade-in">
            <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Focus</span>
            </div>
            {countdown && (
                <div className="flex items-center gap-1 bg-amber-500/10 rounded-lg px-2 py-0.5">
                    <Timer size={11} className="text-amber-300" />
                    <span className="text-[10px] font-mono font-bold text-amber-300">{countdown}</span>
                </div>
            )}
            <button
                onClick={toggleExamMode}
                className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center hover:bg-amber-500/40 transition-colors ml-1"
            >
                <X size={10} className="text-amber-400" />
            </button>
        </div>
    );
}
