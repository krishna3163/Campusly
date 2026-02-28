import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import { sendFriendRequest, getFriendshipStatus } from '../../services/friendService';
import type { UserProfile } from '../../types';
import {
    MessageCircle,
    UserPlus,
    Check,
    Loader2,
    Share2,
    Award,
    Code2,
    Zap,
} from 'lucide-react';

type FriendshipStatus = 'friends' | 'pending_sent' | 'pending_received' | 'none';

export default function UserProfilePage() {
    const { userId } = useParams<{ userId: string }>();
    const { user } = useUser();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [friendship, setFriendship] = useState<FriendshipStatus>('none');
    const [loading, setLoading] = useState(true);

    const isOwnProfile = user?.id === userId;

    useEffect(() => {
        if (userId && user?.id) loadProfile();
    }, [userId, user?.id]);

    const loadProfile = async () => {
        if (!userId || !user?.id) return;
        setLoading(true);
        try {
            const [profileRes, status] = await Promise.all([
                insforge.database.from('profiles').select('*').eq('id', userId).single(),
                getFriendshipStatus(user.id, userId),
            ]);
            if (profileRes.data) setProfile(profileRes.data as UserProfile);
            setFriendship(status);
        } catch (_) {}
        finally { setLoading(false); }
    };

    const handleMessage = () => {
        if (friendship === 'friends') {
            navigate('/app/chats');
        } else {
            navigate('/app/chats');
        }
    };

    const handleAddFriend = async () => {
        if (!userId || !user?.id || friendship !== 'none') return;
        const sent = await sendFriendRequest(user.id, userId);
        if (sent) setFriendship('pending_sent');
    };

    if (loading || !profile) {
        return (
            <div className="h-full flex items-center justify-center bg-campus-darker">
                <Loader2 size={32} className="animate-spin text-brand-500" />
            </div>
        );
    }

    if (isOwnProfile) {
        navigate('/app/profile', { replace: true });
        return null;
    }

    return (
        <div className="h-full bg-campus-darker overflow-y-auto pb-20">
            <div className="relative h-48 bg-gradient-to-br from-brand-600/40 via-purple-600/20 to-pink-600/10" />
            <main className="max-w-2xl mx-auto px-6 -mt-24 relative z-10">
                <div className="glass-card p-8 flex flex-col items-center text-center">
                    <div
                        onClick={() => navigate('/app/status', { state: { viewUserId: profile.id } })}
                        className="relative mb-6 cursor-pointer group"
                    >
                        <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-brand-500 to-purple-500 group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full bg-campus-dark flex items-center justify-center overflow-hidden border-4 border-campus-darker">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <span className="text-3xl font-black text-white">{profile.display_name?.charAt(0) || '?'}</span>
                                )}
                            </div>
                        </div>
                        {(profile as any).activity_status && (
                            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-campus-darker" title="Has status" />
                        )}
                    </div>

                    <h1 className="text-2xl font-black text-white mb-1">{profile.display_name}</h1>
                    <p className="text-sm text-campus-muted font-medium mb-4">{profile.branch || 'Campusly User'}</p>

                    {(profile as any).activity_status && (
                        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold">
                            {profile.activity_status}
                        </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {profile.branch && (
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-brand-400">
                                <Code2 size={12} className="inline mr-1" /> {profile.branch}
                            </span>
                        )}
                        {profile.semester && (
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-emerald-400">
                                <Zap size={12} className="inline mr-1" /> Sem {profile.semester}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3 w-full max-w-sm">
                        <button
                            onClick={handleMessage}
                            disabled={friendship !== 'friends'}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all ${
                                friendship === 'friends'
                                    ? 'bg-brand-500 hover:bg-brand-600 text-white'
                                    : 'bg-campus-card/50 border border-campus-border text-campus-muted cursor-not-allowed'
                            }`}
                        >
                            <MessageCircle size={20} />
                            {friendship === 'friends' ? 'Message' : 'Add to message'}
                        </button>
                        <button
                            onClick={handleAddFriend}
                            disabled={friendship !== 'none'}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all ${
                                friendship === 'none'
                                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                                    : friendship === 'pending_sent'
                                        ? 'bg-campus-card/50 text-campus-muted border border-campus-border'
                                        : 'bg-campus-card/50 text-campus-muted border border-campus-border'
                            }`}
                        >
                            {friendship === 'friends' && <Check size={20} />}
                            {friendship === 'pending_sent' && 'Request Sent'}
                            {friendship === 'pending_received' && 'Respond'}
                            {friendship === 'none' && <><UserPlus size={20} /> Add Friend</>}
                        </button>
                        <button className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-campus-muted hover:text-white transition-all">
                            <Share2 size={20} />
                        </button>
                    </div>

                    {friendship !== 'friends' && (
                        <p className="mt-4 text-xs text-campus-muted text-center max-w-xs">
                            Send a friend request to message. Only connected friends can chat directly.
                        </p>
                    )}
                </div>

                <div className="mt-6 glass-card p-6">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-white">
                        <Award size={18} className="text-brand-400" />
                        Bio
                    </h3>
                    <p className="text-sm text-campus-muted leading-relaxed">
                        {profile.bio || 'No bio yet.'}
                    </p>
                </div>
            </main>
        </div>
    );
}
