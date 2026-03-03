import React from 'react';
import { Check, X, Flame, Calendar as LucideCalendar } from 'lucide-react';

export default function StreakCalendar() {
    // Generate dates for last 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
            date: d.getDate(),
            solved: Math.random() > 0.4, // Mock data for now
            isToday: i === 29
        };
    });

    return (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <LucideCalendar className="text-[#5856D6]" size={20} />
                    <h3 className="font-bold text-[15px]">Challenge Streak</h3>
                </div>
            </div>

            <div className="p-4">
                <div className="grid grid-cols-7 gap-1.5">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-[#8E8E93] uppercase py-1">{d}</div>
                    ))}
                    {days.map((d, i) => (
                        <div
                            key={i}
                            className={`aspect-square flex flex-col items-center justify-center rounded-lg border text-[11px] font-bold transition-all relative
                                ${d.isToday ? 'border-[#007AFF] bg-blue-50/10' : 'border-[var(--border)]'}
                                ${d.solved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-[var(--background)]/50 text-[#8E8E93] opacity-60'}
                            `}
                        >
                            {d.date}
                            {d.solved && <Check size={8} strokeWidth={4} className="mt-0.5" />}
                            {!d.solved && !d.isToday && <X size={6} strokeWidth={4} className="mt-0.5 opacity-20" />}
                            {d.isToday && <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#007AFF] rounded-full border-2 border-white" />}
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Flame size={16} fill="currentColor" className="text-orange-500" />
                        <span className="text-[14px] font-black text-black tracking-tight">7 Day Streak</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">04 Solved / 07 Days</span>
                </div>
            </div>
        </div>
    );
}
