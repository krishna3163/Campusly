import React from 'react';
import { UserProfile } from '../../types';

interface StatusAvatarProps {
    user: UserProfile;
    hasStatus?: boolean;
    isViewed?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onClick?: (e: React.MouseEvent) => void;
}

export const StatusAvatar: React.FC<StatusAvatarProps> = ({
    user,
    hasStatus = false,
    isViewed = false,
    size = 'md',
    onClick
}) => {
    const dim = size === 'sm' ? 40 : size === 'md' ? 56 : 72;
    const ringWidth = size === 'sm' ? 2 : 3;

    // Instagram style gradient for unviewed
    const activeGradient = "bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]";
    const viewedBorder = "border-[2px] border-white/20";

    return (
        <div
            className={`relative rounded-full flex items-center justify-center p-[2px] cursor-pointer active:scale-95 transition-all ${hasStatus && !isViewed ? activeGradient : (hasStatus ? viewedBorder : '')}`}
            style={{ width: dim + 4, height: dim + 4 }}
            onClick={onClick}
        >
            <div className={`w-full h-full rounded-full bg-campus-dark border-${ringWidth} border-campus-darker overflow-hidden shadow-elevation-2`}>
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-xs font-bold uppercase text-campus-muted tracking-widest">
                        {(user.display_name || 'U').charAt(0)}
                    </div>
                )}
            </div>

            {/* Online Indicator if needed, else maybe a 'Live' badge for stories */}
            {hasStatus && !isViewed && (
                <div className="absolute inset-0 rounded-full animate-pulse-slow border-2 border-brand-500/20 pointer-events-none"></div>
            )}
        </div>
    );
};
