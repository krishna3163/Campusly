import React from 'react';
import { UserProfile } from '../../types';

interface StoryCircleProps {
    user: UserProfile;
    isViewed?: boolean;
    hasStatus?: boolean;
    size?: number;
    onClick?: () => void;
}

export const StoryCircle: React.FC<StoryCircleProps> = ({
    user,
    isViewed = false,
    hasStatus = true,
    size = 64,
    onClick
}) => {
    // Premium Instagram-style gradient for new stories
    const gradient = "bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]";
    const viewedBorder = "border-[2px] border-white/20";
    const newBorder = `p-[2px] ${gradient}`;

    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 focus:outline-none group transition-transform active:scale-95"
            style={{ width: size + 16 }}
        >
            <div className={`relative rounded-full ${hasStatus ? (isViewed ? viewedBorder : newBorder) : ''}`}>
                <div
                    className="rounded-full bg-campus-dark border-[3px] border-campus-darker overflow-hidden"
                    style={{ width: size, height: size }}
                >
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.display_name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-xl font-bold">
                            {user.display_name.charAt(0)}
                        </div>
                    )}
                </div>

                {!isViewed && hasStatus && (
                    <div className="absolute inset-0 rounded-full animate-pulse ring-2 ring-brand-500/20 pointer-events-none"></div>
                )}
            </div>
            <span className="text-[11px] font-medium text-campus-muted truncate w-full text-center group-hover:text-white transition-colors">
                {user.id === 'me' ? 'My Story' : user.display_name.split(' ')[0]}
            </span>
        </button>
    );
};
