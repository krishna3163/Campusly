import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Globe, ExternalLink, Zap, Timer, Flame } from 'lucide-react';
import { CodingService } from '../../services/codingService';

export default function UpcomingContests() {
    const [contests, setContests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContests();
    }, []);

    const loadContests = async () => {
        setLoading(true);
        const data = await CodingService.getUpcomingContests();
        setContests(data);
        setLoading(false);
    };

    const getColors = (platform: string) => {
        switch (platform) {
            case 'LeetCode': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'Codeforces': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'CodeChef': return 'text-amber-700 bg-amber-700/10 border-amber-700/20';
            case 'AtCoder': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
        }
    };

    if (loading) return <div className="p-4 bg-[var(--surface)] rounded-2xl animate-pulse h-40" />;

    return (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Timer className="text-[#007AFF]" size={20} />
                    <h3 className="font-bold text-[15px]">Upcoming Contests</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                    <Flame size={10} fill="currentColor" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Live Now</span>
                </div>
            </div>

            <div className="divide-y divide-[var(--border)] max-h-[400px] overflow-y-auto no-scrollbar">
                {contests.map((c, i) => (
                    <a
                        key={i}
                        href={c.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 flex items-center justify-between hover:bg-[var(--background)] transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-[12px] shadow-sm transform group-hover:scale-110 transition-transform ${getColors(c.platform)}`}>
                                {c.platform[0]}
                            </div>
                            <div>
                                <h4 className="text-[14px] font-bold text-[var(--foreground)] leading-tight group-hover:text-[#007AFF] transition-colors">{c.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] text-[#8E8E93] font-bold uppercase">{c.time}</span>
                                    <span className="text-[10px] text-[var(--border)]">•</span>
                                    <span className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-tight">{c.platform}</span>
                                </div>
                            </div>
                        </div>
                        <ExternalLink size={14} className="text-[#8E8E93] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                ))}
            </div>
        </div>
    );
}
