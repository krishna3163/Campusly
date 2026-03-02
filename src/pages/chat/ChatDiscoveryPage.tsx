import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Globe,
    Users,
    Radio,
    ArrowLeft,
    UserPlus,
    Check,
    X,
    User as UserIcon,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import { insforge } from '../../lib/insforge';
import type { Conversation, UserProfile } from '../../types';
import { useUser } from '@insforge/react';
import { FriendService } from '../../services/friendService';
import { ChannelService } from '../../services/ChannelService';
import { GroupService } from '../../services/GroupService';
import { useAppStore } from '../../stores/appStore';

export default function ChatDiscoveryPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { showToast } = useAppStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [trending, setTrending] = useState<Conversation[]>([]);
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [processingFriendId, setProcessingFriendId] = useState<string | null>(null);

    useEffect(() => {
        loadDiscovery();
        if (user?.id) {
            loadRequests();
        }
    }, [user?.id]);

    const loadDiscovery = async () => {
        try {
            // Load trending conversations
            const { data: convs } = await insforge.database
                .from('conversations')
                .select('*')
                .eq('is_public', true)
                .order('member_count', { ascending: false })
                .limit(10);

            if (convs) setTrending(convs as Conversation[]);

            // Load some students (excluding self)
            const { data: profiles } = await insforge.database
                .from('profiles')
                .select('*')
                .neq('id', user?.id)
                .limit(10);

            if (profiles) setStudents(profiles as UserProfile[]);
        } catch (err) {
            console.error(err);
        }
    };

    const loadRequests = async () => {
        const { data } = await insforge.database
            .from('friend_requests')
            .select('*, sender:profiles!sender_id(*)')
            .eq('receiver_id', user?.id)
            .eq('status', 'pending');
        if (data) setIncomingRequests(data);
    };

    const handleJoin = async (conv: Conversation) => {
        if (!user?.id || joiningId) return;
        setJoiningId(conv.id);
        try {
            if (conv.type === 'channel') {
                await ChannelService.joinChannel(conv.id, user.id);
            } else {
                const { error } = await insforge.database
                    .from('conversation_members')
                    .insert({
                        conversation_id: conv.id,
                        user_id: user.id,
                        role: 'member'
                    });
                if (error) throw error;
            }

            showToast(`Welcome to ${conv.name}!`, 'success');
            navigate(`/app/chats/${conv.id}`);
        } catch (err: any) {
            console.error(err);
            showToast(err.message || 'Mesh encryption rejection.', 'error');
        } finally {
            setJoiningId(null);
        }
    };

    const handleSendRequest = async (targetId: string) => {
        if (!user?.id || processingFriendId) return;
        setProcessingFriendId(targetId);
        try {
            await FriendService.sendRequest(user.id, targetId);
            showToast('Friend request sent!', 'success');
            loadDiscovery();
        } catch (err: any) {
            showToast(err.message || 'Transmission failed.', 'error');
        } finally {
            setProcessingFriendId(null);
        }
    };

    const handleAcceptRequest = async (requestId: string, senderId: string) => {
        if (!user?.id) return;
        try {
            await FriendService.acceptRequest(requestId, user.id);
            showToast('Request accepted! Say hi 👋', 'success');
            loadRequests();
            loadDiscovery();
        } catch (err: any) {
            showToast(err.message || 'Failed to approve.', 'error');
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            await FriendService.rejectRequest(requestId, user?.id || '');
            showToast('Request ignored.', 'info');
            loadRequests();
        } catch (err: any) {
            showToast('Mesh rejection.', 'error');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-campus-darker overflow-hidden">
            {/* Header */}
            <header className="px-6 py-8 safe-top bg-campus-dark/40 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-campus-muted">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2 uppercase italic tracking-tighter">
                        Discovery <Sparkles size={20} className="text-brand-500 animate-pulse" />
                    </h1>
                </div>

                <div className="relative group max-w-2xl mx-auto">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-campus-muted/60 group-focus-within:text-brand-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search for channels, groups, or topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-campus-card/40 border border-campus-border/40 group-focus-within:border-brand-500/60 rounded-2xl pl-12 pr-4 py-4 text-[16px] focus:ring-0 transition-all placeholder:text-campus-muted/50 font-medium"
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-12 pb-20">

                    {/* Pending Requests */}
                    {incomingRequests.length > 0 && (
                        <section className="bg-brand-500/5 border border-brand-500/10 rounded-[32px] p-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-brand-400 mb-6 flex items-center gap-2">
                                <ShieldCheck size={16} /> Incoming Requests
                            </h2>
                            <div className="flex flex-col gap-3">
                                {incomingRequests.map(req => (
                                    <div key={req.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center overflow-hidden">
                                                {req.sender?.avatar_url ? (
                                                    <img src={req.sender.avatar_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon size={20} className="text-brand-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{req.sender?.display_name}</p>
                                                <p className="text-[10px] uppercase font-black tracking-widest text-campus-muted">{req.sender?.branch || 'Campus Resident'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleAcceptRequest(req.id, req.sender_id)}
                                                className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-glow-brand/20 active:scale-90 transition-all"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req.id)}
                                                className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 active:scale-90 transition-all"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Trending Channels */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <Radio size={16} className="text-brand-500" /> Trending Channels
                            </h2>
                            <button className="text-[10px] font-black uppercase tracking-widest text-brand-500 hover:underline">Sync All</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trending.filter(c => c.type === 'channel').map(channel => (
                                <ChatCard key={channel.id} conv={channel} onJoin={() => handleJoin(channel)} isJoining={joiningId === channel.id} />
                            ))}
                        </div>
                    </section>

                    {/* Communities */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <Users size={16} className="text-purple-500" /> Campus Communities
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trending.filter(c => c.type === 'group' || c.type === 'supergroup').map(group => (
                                <ChatCard key={group.id} conv={group} onJoin={() => handleJoin(group)} isJoining={joiningId === group.id} />
                            ))}
                        </div>
                    </section>

                    {/* Explore Students */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <UserIcon size={16} className="text-emerald-500" /> Explore Students
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {students.map(student => (
                                <StudentCard
                                    key={student.id}
                                    profile={student}
                                    onAdd={() => handleSendRequest(student.id)}
                                    isProcessing={processingFriendId === student.id}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

function ChatCard({ conv, onJoin, isJoining }: { conv: Conversation; onJoin: () => void; isJoining: boolean }) {
    return (
        <div className="bg-campus-dark border border-white/5 rounded-[24px] p-5 hover:border-brand-500/30 transition-all group flex flex-col h-full shadow-lg">
            <div className="flex gap-4 mb-4">
                <div className="relative shrink-0">
                    {conv.avatar_url ? (
                        <img src={conv.avatar_url} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                    ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-xl font-black text-white uppercase italic">
                            {conv.name?.charAt(0)}
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-campus-dark border border-white/5 flex items-center justify-center text-[10px]">
                        {conv.type === 'channel' ? <Radio size={12} className="text-brand-400" /> : <Users size={12} className="text-purple-400" />}
                    </div>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[15px] truncate text-white uppercase tracking-tight">{conv.name}</h3>
                    <p className="text-[10px] text-brand-400 font-black uppercase tracking-widest mt-0.5 opacity-80">
                        {conv.type === 'channel' ? `${conv.subscriber_count || 0} Followers` : `${conv.member_count || 0} Residents`}
                    </p>
                </div>
            </div>
            <p className="text-[12px] text-gray-400 line-clamp-2 mb-6 flex-1 font-medium leading-relaxed">
                {conv.description || 'No description provided for this community.'}
            </p>
            <button
                onClick={onJoin}
                disabled={isJoining}
                className="w-full py-3.5 rounded-2xl bg-white/[0.03] hover:bg-brand-500 text-gray-400 hover:text-white border border-white/5 hover:border-brand-500 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm"
            >
                {isJoining ? 'Linking...' : 'Join Pulse'}
            </button>
        </div>
    );
}

function StudentCard({ profile, onAdd, isProcessing }: { profile: UserProfile; onAdd: () => void; isProcessing: boolean }) {
    return (
        <div className="bg-campus-dark border border-white/5 rounded-[24px] p-5 hover:border-emerald-500/30 transition-all group flex flex-col h-full shadow-lg">
            <div className="flex items-center gap-4 mb-5">
                {profile.avatar_url ? (
                    <img src={profile.avatar_url} className="w-12 h-12 rounded-full object-cover border border-white/10" alt="" />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg font-black text-emerald-400">
                        {profile.display_name?.charAt(0)}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[14px] truncate text-white">{profile.display_name}</h3>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{profile.branch || 'Student'}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-6 flex-1">
                {profile.interests?.slice(0, 3).map((interest, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                        #{interest}
                    </span>
                )) || <span className="text-[10px] text-gray-600 italic">No tags listed</span>}
            </div>
            <button
                onClick={onAdd}
                disabled={isProcessing}
                className="w-full py-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isProcessing ? 'Syncing...' : <><UserPlus size={14} /> Send Request</>}
            </button>
        </div>
    );
}
