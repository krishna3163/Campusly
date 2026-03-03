import React from 'react';
import { Target, CheckCircle2, Circle, TrendingUp, Zap, Hexagon, Brain, Hash } from 'lucide-react';

export default function DSAProgress() {
    const topics = [
        { name: 'Arrays & Hashing', solved: 45, total: 60, color: 'text-blue-500' },
        { name: 'Linked List', solved: 12, total: 20, color: 'text-purple-500' },
        { name: 'Dynamic Programming', solved: 28, total: 80, color: 'text-rose-500' },
        { name: 'Trees & Graphs', solved: 35, total: 100, color: 'text-emerald-500' },
        { name: 'Strings', solved: 50, total: 50, color: 'text-amber-500' },
    ];

    const totalSolved = topics.reduce((acc, t) => acc + t.solved, 0);
    const totalPotential = topics.reduce((acc, t) => acc + t.total, 0);
    const overallProgress = Math.round((totalSolved / totalPotential) * 100);

    return (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[var(--border)] bg-[var(--background)]/50">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Brain className="text-[#007AFF]" size={20} />
                        <h3 className="font-bold text-[15px]">DSA Mastery Plan</h3>
                    </div>
                    <span className="text-[14px] font-black text-[#007AFF] uppercase tracking-widest">{overallProgress}%</span>
                </div>
                <div className="w-full h-3 bg-[var(--background)] rounded-full border border-[var(--border)] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#007AFF] to-[#5856D6] transition-all duration-500" style={{ width: `${overallProgress}%` }} />
                </div>
                <p className="mt-3 text-[11px] text-[#8E8E93] font-bold uppercase tracking-tight">Total Solved: {totalSolved} / {totalPotential}</p>
            </div>

            <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto no-scrollbar">
                {topics.map((t, i) => (
                    <div key={i} className="flex flex-col gap-2 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg ${t.color.replace('text-', 'bg-')}/10 flex items-center justify-center font-black transition-transform group-hover:scale-110`}>
                                    <Hash className={t.color} size={14} />
                                </div>
                                <span className="text-[13px] font-bold text-[var(--foreground)]">{t.name}</span>
                            </div>
                            <span className="text-[12px] font-black text-[var(--foreground-muted)] uppercase">{t.solved}/{t.total}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]/10">
                            <div
                                className={`h-full ${t.color.replace('text-', 'bg-')} transition-all duration-700 delay-${i * 100}`}
                                style={{ width: `${(t.solved / t.total) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
