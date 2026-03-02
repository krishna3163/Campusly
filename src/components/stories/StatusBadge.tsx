import React from 'react';
import { Flame, Sparkles, TrendingUp } from 'lucide-react';

interface StatusBadgeProps {
    count: number;
    type?: 'story' | 'trend' | 'live';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ count, type = 'story' }) => {
    return (
        <div className="flex items-center gap-1.5 animate-bounce-slow">
            <div className={`px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-white/10 ${type === 'story' ? 'bg-gradient-to-r from-brand-500 to-indigo-600 shadow-glow-brand/20' : 'bg-white/10'}`}>
                {type === 'story' && <Flame size={10} className="text-white fill-white animate-pulse" />}
                {type === 'trend' && <TrendingUp size={10} className="text-yellow-400" />}
                {type === 'live' && <Sparkles size={10} className="text-purple-400 animate-spin" />}
                <span className="text-[9px] font-black uppercase text-white tracking-widest">{count} NEW</span>
            </div>
            {/* Pulsing Dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>
        </div>
    );
};
