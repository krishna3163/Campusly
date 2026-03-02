import React from 'react';
import {
    Flame,
    Trophy,
    Compass,
    TrendingUp,
    Users,
    Award,
    Hash,
    ChevronRight,
    Search,
    Filter,
} from 'lucide-react';
import { StatusStory } from '../../types';

interface TrendingStoriesProps {
    stories: StatusStory[];
    onSelect: (userId: string) => void;
}

export const TrendingStories: React.FC<TrendingStoriesProps> = ({ stories, onSelect }) => {
    // Simulated trending categories
    const categories = [
        { id: 'all', icon: <Compass size={16} />, name: 'All', color: 'bg-white/10' },
        { id: 'events', icon: <Flame size={16} />, name: 'Events', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
        { id: 'placement', icon: <Award size={16} />, name: 'Placement', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        { id: 'exam', icon: <Users size={16} />, name: 'Exam Info', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    ];

    return (
        <div className="flex flex-col gap-8 py-4 px-2">
            {/* Search and Filters */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-campus-muted group-focus-within:text-brand-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search trends..."
                        className="w-full bg-white/5 border border-white/5 group-focus-within:border-brand-500/30 rounded-full px-10 py-2.5 text-xs text-white focus:outline-none transition-all placeholder:text-campus-muted/50"
                    />
                </div>
                <button className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-campus-muted transition-all"><Filter size={16} /></button>
            </div>

            {/* Trending Categories */}
            <section className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${cat.color}`}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </section>

            {/* Campus Leaderboard (Most Viewed) */}
            <section className="space-y-4">
                <h4 className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-campus-muted px-2">
                    <div className="flex items-center gap-2"><Trophy size={14} className="text-yellow-500" /> Top Contributors</div>
                    <button className="hover:text-white transition-colors">See All</button>
                </h4>
                <div className="space-y-3">
                    {stories.slice(0, 3).map((s, idx) => (
                        <button
                            key={s.id}
                            onClick={() => onSelect(s.user_id)}
                            className="w-full flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 p-3 rounded-2xl transition-all group"
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] to-[#bc1888] p-[2px]">
                                    <div className="w-full h-full rounded-full bg-campus-dark border-2 border-campus-darker overflow-hidden">
                                        <img src={s.user?.avatar_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-campus-darker">
                                    {idx + 1}
                                </div>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors uppercase tracking-tight">{s.user?.display_name}</p>
                                <p className="text-[10px] text-campus-muted font-bold uppercase tracking-widest flex items-center gap-1">
                                    <TrendingUp size={10} className="text-brand-500" /> {s.view_count || 0} Views
                                </p>
                            </div>
                            <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                        </button>
                    ))}
                </div>
            </section>

            {/* Trending Tags */}
            <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-campus-muted px-2">
                    <Hash size={14} className="text-brand-400" /> Trending Moods
                </h4>
                <div className="flex flex-wrap gap-2 px-2">
                    {['#SemesterExams', '#PizzaParty', '#Hackathon2024', '#CampusLife', '#CSEDept', '#VibeCheck'].map(tag => (
                        <button
                            key={tag}
                            className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-xl text-[10px] font-bold text-brand-400 transition-all active:scale-95"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
};
