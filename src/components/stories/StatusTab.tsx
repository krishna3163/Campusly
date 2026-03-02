import React, { useState } from 'react';
import { Plus, Camera, Clock, Sparkles } from 'lucide-react';
import { StatusAvatar } from './StatusAvatar';
import { StatusStory, UserProfile } from '../../types';
import { WhatsappService } from '../../services/whatsappService';

interface StatusTabProps {
    currentUser: UserProfile;
    myStories: StatusStory[];
    allStatuses: Record<string, StatusStory[]>;
    onStatusClick: (userId: string) => void;
    onAddStatus: () => void;
}

export const StatusTab: React.FC<StatusTabProps> = ({
    currentUser,
    myStories,
    allStatuses,
    onStatusClick,
    onAddStatus
}) => {
    const statusUsers = Object.keys(allStatuses).filter(id => id !== currentUser.id);
    const [vibePicker, setVibePicker] = useState(false);

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-3 pb-6 border-b border-white/5">
                {/* My Status */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 group">
                    <div className="relative">
                        <StatusAvatar
                            user={currentUser}
                            isViewed={false}
                            hasStatus={myStories.length > 0}
                            size="md"
                            onClick={() => myStories.length > 0 ? onStatusClick(currentUser.id) : onAddStatus()}
                        />
                        {myStories.length === 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddStatus(); }}
                                className="absolute bottom-2 right-1 w-6 h-6 rounded-full bg-brand-500 border-2 border-campus-dark flex items-center justify-center text-white shadow-glow group-hover:scale-110 transition-transform"
                            >
                                <Plus size={12} strokeWidth={4} />
                            </button>
                        )}
                        {/* Status Count Badge for My Story */}
                        {myStories.length > 0 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-[10px] font-black italic border-2 border-campus-darker text-white animate-bounce-slow">
                                {myStories.length}
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-campus-muted group-hover:text-white transition-colors">My Story</span>
                </div>

                {/* Friend Statuses */}
                {statusUsers.map(uid => {
                    const stories = allStatuses[uid];
                    const profile = (stories[0] as any).user || { id: uid, display_name: 'Friend' } as UserProfile;
                    return (
                        <div key={uid} className="flex flex-col items-center gap-1.5 shrink-0 group">
                            <StatusAvatar
                                user={profile}
                                isViewed={false} // Would check if all stories viewed
                                hasStatus={true}
                                size="md"
                                onClick={() => onStatusClick(uid)}
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-campus-muted group-hover:text-brand-400 truncate w-16 text-center transition-colors">
                                {profile.display_name.split(' ')[0]}
                            </span>
                        </div>
                    );
                })}

                {statusUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-1.5 px-4 opacity-30 text-campus-muted shrink-0 italic">
                        <Clock size={20} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">No Updates</span>
                    </div>
                )}
            </div>

        </div>
    );
};
