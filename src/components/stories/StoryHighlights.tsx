import React from 'react';
import { Plus } from 'lucide-react';
import { StoryHighlight } from '../../types';

interface StoryHighlightsProps {
    highlights: StoryHighlight[];
    onSelect: (h: StoryHighlight) => void;
    onCreate?: () => void;
    isOwner?: boolean;
}

export const StoryHighlights: React.FC<StoryHighlightsProps> = ({
    highlights,
    onSelect,
    onCreate,
    isOwner = false
}) => {
    return (
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-4 px-2">
            {isOwner && (
                <button
                    onClick={onCreate}
                    className="flex flex-col items-center gap-2 group transition-all"
                >
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 group-hover:border-brand-500/50 flex items-center justify-center text-white/40 group-hover:text-brand-400 transition-all active:scale-90">
                        <Plus size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-campus-muted group-hover:text-white">New</span>
                </button>
            )}

            {highlights.map((h) => (
                <button
                    key={h.id}
                    onClick={() => onSelect(h)}
                    className="flex flex-col items-center gap-2 group transition-all"
                >
                    <div className="w-16 h-16 rounded-full border-2 border-white/10 group-hover:border-white/30 p-[2px] transition-all active:scale-95">
                        <div className="w-full h-full rounded-full bg-campus-darker overflow-hidden flex items-center justify-center">
                            {h.cover_url ? (
                                <img src={h.cover_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                    {h.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-campus-muted truncate w-16 text-center group-hover:text-white">
                        {h.name}
                    </span>
                </button>
            ))}
        </div>
    );
};
