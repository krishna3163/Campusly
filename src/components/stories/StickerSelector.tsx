import React from 'react';
import {
    MapPin,
    Clock,
    Users,
    Hash,
    BarChart2,
    Calendar,
    Flame,
    Smile,
    Award,
    Sparkles,
} from 'lucide-react';

interface StickerSelectorProps {
    onSelect: (sticker: any) => void;
    onClose?: () => void;
}

export const StickerSelector: React.FC<StickerSelectorProps> = ({ onSelect, onClose }) => {
    const categories = [
        {
            name: 'Campus Utils',
            stickers: [
                { id: 'branch', icon: <Award size={24} />, label: 'Branch Tag', type: 'branch' },
                { id: 'exam', icon: <Calendar size={24} />, label: 'Exam Countdown', type: 'exam' },
                { id: 'event', icon: <Flame size={24} />, label: 'Campus Event', type: 'event' },
            ]
        },
        {
            name: 'Interactive',
            stickers: [
                { id: 'poll', icon: <BarChart2 size={24} />, label: 'Live Poll', type: 'poll' },
                { id: 'location', icon: <MapPin size={24} />, label: 'Location', type: 'location' },
                { id: 'time', icon: <Clock size={24} />, label: 'Current Time', type: 'time' },
            ]
        },
        {
            name: 'Social',
            stickers: [
                { id: 'mention', icon: <Users size={24} />, label: '@Mention', type: 'mention' },
                { id: 'hashtag', icon: <Hash size={24} />, label: '#Hashtag', type: 'hashtag' },
                { id: 'vibe', icon: <Sparkles size={24} />, label: 'Vibe Check', type: 'vibe' },
            ]
        },
    ];

    return (
        <div className="flex flex-col h-[70vh] bg-campus-dark/95 backdrop-blur-3xl rounded-t-[40px] border-t border-white/10 p-8 overflow-hidden shadow-2xl">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8"></div>

            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <Smile className="text-brand-400" /> Creative Assets
                </h2>
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-brand-400">
                        <Sparkles size={16} />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-10 custom-scrollbar pb-12">
                {categories.map((cat, idx) => (
                    <section key={idx} className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-campus-muted px-2 italic">{cat.name}</h4>
                        <div className="grid grid-cols-3 gap-4">
                            {cat.stickers.map(sticker => (
                                <button
                                    key={sticker.id}
                                    onClick={() => onSelect(sticker)}
                                    className="aspect-square bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-500/30 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group"
                                >
                                    <div className="p-3 bg-white/5 rounded-2xl text-white group-hover:text-brand-400 group-hover:scale-110 transition-all">
                                        {sticker.icon}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-tighter text-campus-muted group-hover:text-white px-2 text-center line-clamp-1">{sticker.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};
