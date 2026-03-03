import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import { motion } from 'framer-motion';
import {
    MessageCircle,
    Check,
    Loader2,
    Share2,
    BadgeCheck,
    ArrowLeft,
    Plus,
    Lock,
    Flame
} from 'lucide-react';
import type { UserProfile } from '../../types';
import { FriendService } from '../../services/friendService';
import { StatusService } from '../../services/statusService';
import { useAppStore } from '../../stores/appStore';
import { ConversationService } from '../../services/conversationService';
import { UserService } from '../../services/userService';
import ProfileIntegrations from '../../components/profile/ProfileIntegrations';

type FriendshipStatus = 'request_sent' | 'request_received' | 'accepted' | 'none' | 'self';

export default function ProfileViewPage() {
    const { userId } = useParams<{ userId: string }>();
    const { user } = useUser();
    const navigate = useNavigate();
    const { showToast } = useAppStore();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [friendship, setFriendship] = useState<FriendshipStatus>('none');
    const [loading, setLoading] = useState(true);
    const [hasActiveStatus, setHasActiveStatus] = useState(false);
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [mutualCount, setMutualCount] = useState(0);

    const isOwnProfile = user?.id === userId;

    const loadProfile = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            // Direct fetch of profile details (Service Layer for Profiles could be better, but staying atomic)
            const { data: pData, error: pError } = await insforge.database
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (pError) throw pError;
            if (pData) setProfile(pData as UserProfile);

            if (user?.id) {
                // Stabilized service calls
                const [status, countMutual] = await Promise.all([
                    FriendService.getFriendshipStatus(user.id, userId),
                    FriendService.getMutualFriendsCount(user.id, userId)
                ]);

                // Map service status to local state type
                let localStatus: FriendshipStatus = 'none';
                if (status === 'friends') localStatus = 'accepted';
                else if (status === 'requested') localStatus = 'request_sent';
                else if (status === 'pending') localStatus = 'request_received';

                setFriendship(localStatus);
                setMutualCount(countMutual);

                if (localStatus === 'accepted' || isOwnProfile) {
                    const [storyRes, postRes] = await Promise.all([
                        StatusService.getFriendStories(user.id),
                        UserService.getUserPosts(userId, 10, 0)
                    ]);

                    if (storyRes.data && storyRes.data[userId]?.length > 0) {
                        setHasActiveStatus(true);
                    }
                    setUserPosts(postRes.data || []);
                }
            }
        } catch (err: any) {
            console.error('[Profile Access Leak]', err);
            showToast('Unable to fetch campus profile', 'error');
        } finally {
            setLoading(false);
        }
    }, [userId, user?.id, isOwnProfile, showToast]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleAddFriend = async () => {
        if (!userId || !user?.id || friendship !== 'none') return;
        try {
            const { error } = await FriendService.sendFriendRequest(user.id, userId);
            if (!error) {
                setFriendship('request_sent');
                showToast('Connection request broadcasted!', 'success');
            }
        } catch { showToast('Network collision', 'error'); }
    };

    const handleAcceptRequest = async () => {
        if (!userId || !user?.id) return;
        try {
            const ok = await FriendService.approveFriendRequest(userId, user.id);
            if (ok) {
                setFriendship('accepted');
                showToast('Connection finalized!', 'success');
                loadProfile();
            }
        } catch { showToast('Approval failed', 'error'); }
    };

    const handleMessage = async () => {
        if (!userId || !user?.id) return;
        try {
            // Check for existing conversation (Production logic + Duplicate Prevention API)
            const existingId = await ConversationService.getPrivateChat(user.id, userId);

            if (existingId) {
                navigate(`/app/chats/${existingId}`);
                return;
            }

            const { data: conv } = await insforge.database.from('conversations').insert({
                type: 'direct',
                created_by: user.id,
                campus_id: (user?.profile as any)?.campus_id || null,
                visibility: 'private'
            }).select().single();

            if (conv) {
                await insforge.database.from('conversation_members').insert([
                    { conversation_id: (conv as any).id, user_id: user.id, role: 'owner' },
                    { conversation_id: (conv as any).id, user_id: userId, role: 'member' }
                ]);
                navigate(`/app/chats/${(conv as any).id}`);
            }
        } catch (e) {
            showToast('Communication channel failed', 'error');
        }
    };

    if (loading || !profile) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 size={40} className="animate-spin text-[#007AFF] drop-shadow-glow" />
            </div>
        );
    }

    return (
        <div className="h-screen bg-[var(--background)] overflow-y-auto pb-32 safe-top custom-scrollbar scroll-smooth">
            <div className="relative h-80 w-full overflow-hidden">
                <motion.div initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 bg-gradient-to-br from-brand-600 via-indigo-700 to-purple-800" />
                <div className="absolute inset-0 bg-black/20" />
                <header className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center z-50">
                    <button onClick={() => navigate(-1)} className="p-4 bg-black/30 backdrop-blur-3xl rounded-3xl text-white border border-white/10 active:scale-90"><ArrowLeft size={24} strokeWidth={3} /></button>
                    <div className="flex gap-4">
                        <button className="p-4 bg-black/30 backdrop-blur-3xl rounded-3xl text-white border border-white/10 active:scale-95"><Share2 size={24} /></button>
                    </div>
                </header>
            </div>

            <main className="max-w-4xl mx-auto px-6 -mt-32 relative z-10">
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-10 p-12 shadow-2xl overflow-hidden relative rounded-[64px] border border-[var(--border)] bg-[var(--surface)]">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-12 text-center md:text-left">
                        <div
                            onClick={() => hasActiveStatus && navigate(`/app/status/${userId}`)}
                            className={`relative shrink-0 w-52 h-52 rounded-[68px] p-2 transition-all duration-700 active:scale-95 ${hasActiveStatus ? 'bg-gradient-to-tr from-[#007AFF] via-indigo-500 to-purple-600 shadow-glow cursor-pointer ring-4 ring-[#007AFF]/30' : 'bg-[var(--surface-low)] border border-[var(--border)] shadow-sm'}`}
                        >
                            <div className="w-full h-full rounded-[62px] bg-[var(--surface-low)] border-4 border-[var(--surface)] overflow-hidden">
                                {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[84px] font-black text-[#007AFF]">{profile.display_name?.charAt(0)}</div>}
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 pt-4">
                            <div>
                                <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[var(--foreground)] mb-3 flex items-center justify-center md:justify-start gap-5">
                                    {profile.display_name} <BadgeCheck size={40} className="text-[#007AFF] drop-shadow-glow" />
                                </h1>
                                <p className="text-xl font-bold uppercase tracking-widest italic text-[var(--foreground-muted)]">{profile.branch} • SEM {profile.semester}</p>
                            </div>
                            <p className="text-xl text-[var(--foreground)] opacity-70 font-medium leading-relaxed italic">"{profile.bio || 'Campusly Innovator.'}"</p>
                            <div className="flex justify-center md:justify-start gap-10">
                                <div><p className="text-[10px] font-black uppercase tracking-widest text-[#007AFF] mb-2">Network</p><p className="text-3xl font-black text-[var(--foreground)] italic">1.2K</p></div>
                                <div><p className="text-[10px] font-black uppercase tracking-widest text-[#5856D6] mb-2">Mutual</p><p className="text-3xl font-black text-[var(--foreground)] italic">{mutualCount}</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col md:flex-row gap-6">
                        {!isOwnProfile ? (
                            <>
                                {friendship === 'accepted' ? (
                                    <>
                                        <button onClick={handleMessage} className="flex-1 py-6 rounded-3xl bg-[#007AFF] text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 shadow-glow active:scale-95"><MessageCircle size={24} /> Message</button>
                                        <button className="flex-1 py-6 rounded-3xl bg-[var(--surface-low)] border border-[var(--border)] text-[#007AFF] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4"><Check size={24} /> Connected</button>
                                    </>
                                ) : friendship === 'request_received' ? (
                                    <button onClick={handleAcceptRequest} className="flex-1 py-6 rounded-3xl bg-[#007AFF] text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 animate-glow">Accept Connection</button>
                                ) : friendship === 'request_sent' ? (
                                    <button disabled className="flex-1 py-6 rounded-3xl bg-[var(--surface-low)] border border-[var(--border)] text-[var(--foreground-muted)] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 italic italic">Awaiting Approval</button>
                                ) : (
                                    <button onClick={handleAddFriend} className="flex-1 py-6 rounded-3xl bg-[#007AFF] text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 shadow-glow animate-float active:scale-95"><Plus size={24} /> Add Friend</button>
                                )}
                            </>
                        ) : (
                            <button onClick={() => navigate('/app/settings')} className="flex-1 py-6 rounded-3xl bg-[#007AFF]/10 border border-[#007AFF]/30 text-[#007AFF] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 hover:bg-[#007AFF]/20 transition-all">Edit Global Profile</button>
                        )}
                    </div>
                </motion.div>

                {(isOwnProfile || friendship === 'accepted') ? (
                    <div className="space-y-12">
                        {userId && <ProfileIntegrations userId={userId} isOwnProfile={isOwnProfile} />}

                        {/* Recent Posts Section */}
                        <section className="space-y-6">
                            <h3 className="text-sm font-black text-[var(--foreground-muted)] uppercase tracking-[0.3em] flex items-center gap-3">
                                <Flame size={18} className="text-[#FF9500]" /> Recent Activity
                            </h3>
                            <div className="space-y-4">
                                {userPosts.length > 0 ? (
                                    userPosts.map(post => (
                                        <div key={post.id} className="bg-[var(--surface)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm">
                                            <p className="text-[15px] text-[var(--foreground)] leading-relaxed mb-4">{post.content}</p>
                                            <div className="flex items-center gap-4 text-[11px] text-[var(--foreground-muted)] font-bold">
                                                <span className="flex items-center gap-1.5"><Flame size={14} className="text-[#FF9500]" /> {post.likes_count || 0}</span>
                                                <span className="flex items-center gap-1.5"><MessageCircle size={14} /> {post.comments_count || 0}</span>
                                                <span className="ml-auto opacity-50">{new Date(post.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 bg-[var(--surface-low)] rounded-[32px] border border-dashed border-[var(--border)]">
                                        <p className="text-[var(--foreground-muted)] font-medium italic">Signal silence. No posts found.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-[var(--surface-low)] rounded-[48px] border border-[var(--border)] text-center my-10 relative overflow-hidden">
                        <Lock size={32} className="text-[var(--foreground-muted)] mb-4 drop-shadow-lg" />
                        <h3 className="text-xl font-black uppercase text-[var(--foreground)] opacity-50 tracking-widest mb-2 italic">Campus Security</h3>
                        <p className="text-sm font-semibold max-w-[280px] text-[var(--foreground-muted)]">Full profile integrity and historical data view requires an established connection.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
