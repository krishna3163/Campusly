import React from 'react';
import {
    Search,
    Plus,
    Megaphone,
    Globe,
    Users,
    Network as CommunityIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StickyHeaderProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    onNewChat: (type: any) => void;
    onDiscover: () => void;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({
    searchQuery,
    onSearchChange,
    onNewChat,
    onDiscover
}) => {
    return (
        <header className="sticky top-0 z-[60] pt-8 pb-4 bg-campus-darker/95 backdrop-blur-2xl border-b border-white/5 shadow-[0_2px_40px_rgb(0,0,0,0.5)] safe-top px-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                        Chats
                    </h1>
                    <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-slow"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-campus-muted opacity-60">Live Feed</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onNewChat('channel')}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-campus-muted hover:text-white border border-white/5 shadow-elevation-1 active:scale-95"
                        title="New Channel"
                    >
                        <Megaphone size={20} className="text-brand-400" />
                    </button>
                    <button
                        onClick={onDiscover}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-campus-muted hover:text-white border border-white/5 shadow-elevation-1 active:scale-95"
                        title="Discover"
                    >
                        <Globe size={22} className="text-indigo-400" />
                    </button>
                    <button
                        onClick={() => onNewChat('group')}
                        className="p-3 bg-brand-500 hover:bg-brand-600 rounded-2xl transition-all shadow-glow hover:shadow-glow-lg text-white active:scale-95"
                        title="New Group"
                    >
                        <Users size={22} />
                    </button>
                    <button
                        onClick={() => onNewChat('private')}
                        className="p-3 bg-indigo-500 hover:bg-indigo-600 rounded-2xl transition-all shadow-glow hover:shadow-glow-lg text-white active:scale-95"
                        title="New Chat"
                    >
                        <Plus size={22} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Premium Full-width Search */}
            <div className="relative group/search group focus-within:scale-[1.02] transition-all duration-500">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-campus-muted/40 group-focus-within/search:text-brand-400 group-focus-within/search:scale-110 transition-all duration-300" />
                <input
                    type="text"
                    placeholder="Search people & messages..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 group-focus-within/search:border-brand-500/40 group-focus-within/search:bg-white/[0.05] rounded-[24px] pl-14 pr-6 py-4.5 text-[16px] font-medium text-white focus:ring-0 transition-all duration-300 placeholder:text-campus-muted/30 shadow-inner"
                />

                {searchQuery && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-all"
                    >
                        {/* Clear icon or simple X could go here */}
                    </button>
                )}
            </div>
        </header>
    );
};
