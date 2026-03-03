import React, { useState, useEffect } from 'react';
import { StoryCircle } from './StoryCircle';
import { StoryViewer } from './StoryViewer';
import { StatusService } from '../../services/statusService';
import { UserProfile } from '../../types';
import { Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface StoryBarProps {
    campusId: string;
    currentUser: UserProfile;
}

export const StoryBar: React.FC<StoryBarProps> = ({ campusId, currentUser }) => {
    const navigate = useNavigate();
    const [storyGroups, setStoryGroups] = useState<any>(null);
    const [selectedUserStories, setSelectedUserStories] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStories();
    }, [campusId]);

    const loadStories = async () => {
        setLoading(true);
        try {
            const groups = await StatusService.getCampusStories(campusId);
            setStoryGroups(groups || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const sortedUserIds = storyGroups ? Object.keys(storyGroups).sort((a, b) => {
        if (a === currentUser.id) return -1;
        if (b === currentUser.id) return 1;
        return 0;
    }) : [];

    return (
        <div className="bg-white border-b border-[#E5E5EA]">
            <div className="flex items-center gap-4 px-4 py-4 overflow-x-auto no-scrollbar">
                {/* Add Story Button */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => navigate('/app/campus/story/new')}
                        className="relative w-16 h-16 rounded-full bg-[#F2F2F7] flex items-center justify-center border border-black/5 active:scale-95 transition-transform overflow-hidden"
                    >
                        {currentUser.avatar_url ? (
                            <img src={currentUser.avatar_url} className="w-full h-full object-cover opacity-60" />
                        ) : (
                            <div className="text-xl font-bold text-[#8E8E93]">{currentUser?.display_name?.charAt(0) || '?'}</div>
                        )}
                        <div className="absolute right-0 bottom-0 w-5 h-5 bg-[#007AFF] rounded-full border-2 border-white flex items-center justify-center text-white">
                            <Plus size={14} strokeWidth={3} />
                        </div>
                    </button>
                    <span className="text-[11px] font-medium text-[#8E8E93]">Your Story</span>
                </div>

                {sortedUserIds.map(uid => {
                    const group = storyGroups[uid];
                    if (uid === currentUser.id && group.items.length === 0) return null; // Already handled by "Add Story" for now

                    return (
                        <StoryCircle
                            key={uid}
                            user={group.user}
                            size={64}
                            onClick={() => setSelectedUserStories(group.items)}
                            hasStatus={group.items.length > 0}
                        />
                    );
                })}

                {loading && (
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-16 h-16 rounded-full bg-[#F2F2F7] animate-pulse" />
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedUserStories && (
                    <StoryViewer
                        stories={selectedUserStories}
                        currentUser={currentUser}
                        onClose={() => setSelectedUserStories(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
