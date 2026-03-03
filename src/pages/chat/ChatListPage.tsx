import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { Conversation, UserProfile } from '../../types';
import {
    MessageCircle,
    CheckCheck,
    Archive,
    Users,
    Megaphone as BroadcastIcon,
    Pin,
    VolumeX,
    Trash2,
    CheckCircle,
    SearchX,
    SquarePen,
    Edit2,
    Search,
    SlidersHorizontal,
    User as UserIcon,
    Plus,
    ChevronRight,
    Shield,
    UserMinus,
    ArrowLeft,
    Share2,
    Settings,
    Hash,
} from 'lucide-react';
import { RankingEngine } from '../../services/rankingService';
import { WhatsappService } from '../../services/whatsappService';
import { motion } from 'framer-motion';
import { StickyHeader } from '../../components/chat/StickyHeader';
import { StoriesSection } from '../../components/chat/StoriesSection';
import { ConversationService } from '../../services/conversationService';
import { FriendService } from '../../services/friendService';
import { ChannelService } from '../../services/ChannelService';
import { GroupService } from '../../services/GroupService';
import { useAppStore } from '../../stores/appStore';
import { SwipeArchive } from '../../components/gesture/SwipeArchive';
import { PullToRefresh } from '../../components/gesture/PullToRefresh';
import { BottomSheet, BottomSheetItem } from '../../components/ui/BottomSheet';

const ConversationItem = memo(({
    conv,
    isActive,
    onClick,
    onProfileClick,
    messagePreview,
    name,
    avatar,
}: any) => {
    const getTime = () => {
        if (!conv.updated_at) return '';
        const d = new Date(conv.updated_at);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all relative border-none m-1 rounded-xl group ${isActive ? 'bg-[#007AFF15]' : 'hover:bg-[#F2F2F7] active:scale-[0.99]'}`}
        >
            <div className="relative shrink-0" onClick={onProfileClick}>
                <div className="w-[54px] h-[54px] rounded-full overflow-hidden bg-[#F2F2F7] flex items-center justify-center border border-black/5 shadow-sm">
                    {avatar ? (
                        <img src={avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold bg-[#E5E5EA] text-[#8E8E93]">
                            {name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                {conv.unread_count > 0 && (
                    <div className="absolute top-0 -left-1 w-3.5 h-3.5 rounded-full bg-[#007AFF] border-2 border-white"></div>
                )}
            </div>

            <div className="flex-1 min-w-0 pb-1 h-full flex flex-col justify-center">
                <div className="flex justify-between items-center mb-0.5">
                    <h3 className="text-[16px] font-bold text-black truncate tracking-tight">{name}</h3>
                    <div className="flex items-center gap-1">
                        <span className="text-[14px] text-[#8E8E93] font-medium">{getTime()}</span>
                        <ChevronRight size={14} className="text-[#8E8E93] opacity-40 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-[14px] text-[#8E8E93] truncate leading-tight pr-4">
                        {messagePreview || 'No messages'}
                    </p>
                    {conv.unread_count > 0 && (
                        <div className="bg-[#007AFF] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                            {conv.unread_count}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
});

export default function ChatListPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { chatId } = useParams<{ chatId: string }>();
    const location = useLocation();
    const initialTab = (location.state as { tab?: 'all' | 'unread' | 'groups' | 'channels' | 'archived' })?.tab;
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups' | 'channels' | 'archived' | 'starred' | 'broadcast'>(initialTab || 'all');
    const [showNewChat, setShowNewChat] = useState<'private' | 'group' | 'channel' | 'supergroup' | 'broadcast' | 'community' | null>(null);
    const [activeStatuses, setActiveStatuses] = useState<Record<string, any[]>>({});
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    const [contextMenuConv, setContextMenuConv] = useState<Conversation | null>(null);

    const handleContextMenu = (e: React.MouseEvent, conv: Conversation) => {
        e.preventDefault();
        setContextMenuConv(conv);
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    };


    const handlePinChat = async (id: string, pinned: boolean) => {
        const conv = conversations.find(c => c.id === id);
        if (!conv) return;

        const field = conv.type === 'private' ? 'is_pinned_private' : 'is_pinned_group';

        // Optimistic UI
        setConversations(prev => prev.map(c => c.id === id ? { ...c, [field]: pinned } : c));

        try {
            await insforge.database.from('conversations').update({ [field]: pinned } as any).eq('id', id);
        } catch (e) {
            // Revert on error
            setConversations(prev => prev.map(c => c.id === id ? { ...c, [field]: !pinned } : c));
        }
    };

    const handleMuteChat = async (id: string, muted: boolean) => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, muted } : c));
        await WhatsappService.toggleMute(user?.id || '', id, muted);
    };

    const handleDeleteChat = async (id: string) => {
        setConversations(prev => prev.filter(c => c.id !== id));
        await insforge.database.from('conversation_members').delete().eq('conversation_id', id).eq('user_id', user?.id);
    };

    const handleArchiveChat = async (id: string) => {
        if (!user?.id) return;
        const conv = conversations.find(c => c.id === id);
        const newState = !(conv as any)?.is_archived;

        // Optimistic UI
        setConversations(prev => prev.map(c => c.id === id ? { ...c, is_archived: newState } : c));

        try {
            const { error } = await ConversationService.archiveConversation(id, user.id, newState);
            if (error) throw error;
        } catch (e) {
            // Revert
            setConversations(prev => prev.map(c => c.id === id ? { ...c, is_archived: !newState } : c));
        }
    };

    // Optimized Scroll Listener for Collapsible Stories
    useEffect(() => {
        const container = document.getElementById('chat-list-scroll');
        if (!container) return;

        let rafId: number;
        const handleScroll = (e: any) => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const currentScrollY = e.target.scrollTop;
                if (currentScrollY > 50 && currentScrollY > lastScrollY) {
                    setIsCollapsed(true);
                } else if (currentScrollY < 10) {
                    setIsCollapsed(false);
                }
                setLastScrollY(currentScrollY);
            });
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [lastScrollY]);

    const loadConversations = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data: memberData } = await insforge.database
                .from('conversation_members')
                .select('*')
                .eq('user_id', user.id);

            if (!memberData?.length) {
                setConversations([]);
                setLoading(false);
                return;
            }

            const conversationIds = memberData.map((m: any) => m.conversation_id);
            const memberMap = memberData.reduce((acc: any, m: any) => {
                acc[m.conversation_id] = m;
                return acc;
            }, {});

            const { data: convData } = await insforge.database
                .from('conversations')
                .select('*')
                .in('id', conversationIds)
                .order('updated_at', { ascending: false });

            if (convData) {
                const enriched = await Promise.all(
                    convData.map(async (conv: Conversation) => {
                        const { data: msgData } = await insforge.database
                            .from('messages')
                            .select('*')
                            .eq('conversation_id', conv.id)
                            .order('created_at', { ascending: false })
                            .limit(1);

                        let otherUser: UserProfile | undefined;
                        const isPrivate = conv.type === 'private' || conv.type === 'direct';
                        if (isPrivate) {
                            const { data: members } = await insforge.database
                                .from('conversation_members')
                                .select('user_id')
                                .eq('conversation_id', conv.id)
                                .neq('user_id', user.id)
                                .limit(1);

                            if (members?.[0]) {
                                const { data: profile } = await insforge.database
                                    .from('profiles')
                                    .select('*')
                                    .eq('id', members[0].user_id)
                                    .single();
                                otherUser = profile as UserProfile;
                            }
                        }

                        return {
                            ...conv,
                            last_message: msgData?.[0] || null,
                            other_user: otherUser,
                            is_starred: memberMap[conv.id]?.is_starred,
                            muted: memberMap[conv.id]?.muted,
                        };
                    })
                );

                const ranked = RankingEngine.rankGroups(enriched as Conversation[]);
                setConversations(ranked);

                // Fetch stories 
                try {
                    const stories = await WhatsappService.getActiveStories(user.id);
                    setActiveStatuses(stories);
                } catch (e) {
                    console.error('Story fetch failed', e);
                }
            }
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            loadConversations();
        }
    }, [user?.id, loadConversations]);

    const filteredConversations = useMemo(() => {
        return conversations.filter((c) => {
            const name = c.type === 'private' ? c.other_user?.display_name : c.name;
            const matchesSearch = name?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (filterTab === 'unread') return (c.unread_count || 0) > 0;
            if (filterTab === 'groups') return c.type === 'group' || c.type === 'supergroup';
            if (filterTab === 'channels') return c.type === 'channel' || c.type === 'subject_channel';
            if (filterTab === 'archived') return (c as any).is_archived === true;
            if (filterTab === 'starred') return (c as any).is_starred === true;
            if (filterTab === 'broadcast') return (c as any).is_broadcast === true;
            return !(c as any).is_archived;
        });
    }, [conversations, searchQuery, filterTab]);


    const getConversationName = (conv: Conversation) => {
        const isPrivate = conv.type === 'private' || conv.type === 'direct';
        if (isPrivate) return conv.other_user?.display_name || 'Unknown User';
        return conv.name || 'Unnamed';
    };

    const getConversationAvatar = (conv: Conversation) => {
        const isPrivate = conv.type === 'private' || conv.type === 'direct';
        if (isPrivate && conv.other_user?.avatar_url) {
            return conv.other_user.avatar_url;
        }
        return conv.avatar_url;
    };

    const getMessagePreview = (conv: Conversation) => {
        if (!conv.last_message) return 'No messages yet';
        const msg = conv.last_message;
        if (msg.is_deleted) return '🗑️ Message deleted';
        switch (msg.type) {
            case 'image': return '📷 Photo';
            case 'video': return '📽️ Video';
            case 'voice_note': return '🎙️ Voice note';
            case 'document': return '📄 Document';
            case 'poll': return '📊 Poll';
            default: return msg.content || '';
        }
    };

    return (
        <div className="h-full flex flex-col bg-white relative overflow-hidden font-sans">
            {/* iOS Header */}
            <header className="ios-header safe-top px-4 py-3 flex items-center justify-between">
                <div className="flex-1 flex justify-start">
                    <div className="relative group">
                        <button className="ios-btn-blue text-[17px] font-medium py-1">New +</button>
                        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-[#E5E5EA] overflow-hidden z-50 min-w-[200px] hidden group-focus-within:block group-hover:block animate-scale-in origin-top-left">
                            <button onClick={() => setShowNewChat('broadcast')} className="w-full px-4 py-3 text-left text-[15px] text-black hover:bg-[#F2F2F7] transition-colors border-b border-[#E5E5EA]/50 flex items-center gap-3">
                                <BroadcastIcon size={18} className="text-[#007AFF]" />
                                <span className="font-semibold">New Broadcast</span>
                            </button>
                            <button onClick={() => setShowNewChat('channel')} className="w-full px-4 py-3 text-left text-[15px] text-black hover:bg-[#F2F2F7] transition-colors flex items-center gap-3">
                                <Hash size={18} className="text-[#007AFF]" />
                                <span className="font-semibold">New Channel</span>
                            </button>
                        </div>
                    </div>
                </div>

                <h1 className="text-[17px] font-black text-black tracking-tight">Messages</h1>

                <div className="flex-1 flex justify-end">
                    <button
                        onClick={() => setShowNewChat('private')}
                        className="ios-btn-blue p-1 active:scale-90 transition-transform"
                    >
                        <SquarePen size={22} strokeWidth={2} />
                    </button>
                </div>
            </header>

            {/* iOS Search Bar */}
            <div className="ios-search-bar">
                <Search size={18} className="text-[#8E8E93]" />
                <input
                    type="text"
                    placeholder="Search"
                    className="ios-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                <PullToRefresh onRefresh={async () => { await loadConversations(); }}>
                    {/* Status Row */}
                    {!isCollapsed && (
                        <div className="mb-2">
                            <StoriesSection
                                isCollapsed={false}
                                currentUser={user as any}
                                myStories={activeStatuses[user?.id || ''] || []}
                                allStatuses={activeStatuses}
                                onStatusClick={(uid) => navigate('/app/status', { state: { viewUserId: uid } })}
                                onAddStatus={() => navigate('/app/status', { state: { openCamera: true } })}
                            />
                        </div>
                    )}

                    {/* Chat List */}
                    <div className="flex flex-col">
                        {loading && conversations.length === 0 ? (
                            <div className="flex flex-col gap-4 p-4">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-14 h-14 rounded-full bg-[#F2F2F7]"></div>
                                        <div className="flex-1 border-b border-[#E5E5EA] pb-3">
                                            <div className="h-4 w-32 bg-[#F2F2F7] rounded mb-2"></div>
                                            <div className="h-3 w-48 bg-[#F2F2F7] rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="px-10 py-20 text-center flex flex-col items-center gap-4">
                                <Search size={48} className="text-[#E5E5EA]" strokeWidth={1} />
                                <p className="text-[17px] text-[#8E8E93]">No Results</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv: any) => (
                                <SwipeArchive key={conv.id} onArchive={() => handleArchiveChat(conv.id)}>
                                    <ConversationItem
                                        conv={conv}
                                        isActive={conv.id === chatId}
                                        onClick={() => navigate(`/app/chats/${conv.id}`)}
                                        onProfileClick={(e: any) => { e.stopPropagation(); navigate(`/app/profile/${conv.other_user_id || conv.id}`); }}
                                        onArchive={handleArchiveChat}
                                        isArchived={conv.is_archived}
                                        messagePreview={getMessagePreview(conv)}
                                        name={getConversationName(conv)}
                                        avatar={getConversationAvatar(conv)}
                                    />
                                </SwipeArchive>
                            ))
                        )}
                    </div>
                </PullToRefresh>
            </div>

            {/* Bottom Sheet Context Menu */}
            <BottomSheet
                isOpen={!!contextMenuConv}
                onClose={() => setContextMenuConv(null)}
                title={contextMenuConv ? getConversationName(contextMenuConv) : ""}
            >
                <BottomSheetItem
                    icon={<Pin size={18} />}
                    label={contextMenuConv?.is_pinned_private || contextMenuConv?.is_pinned_group ? "Unpin Chat" : "Pin Chat"}
                    onClick={() => {
                        if (contextMenuConv) handlePinChat(contextMenuConv.id, !(contextMenuConv.is_pinned_private || contextMenuConv.is_pinned_group));
                        setContextMenuConv(null);
                    }}
                />
                <BottomSheetItem
                    icon={<VolumeX size={18} />}
                    label={contextMenuConv?.muted ? "Unmute Chat" : "Mute Notifications"}
                    onClick={() => {
                        if (contextMenuConv) handleMuteChat(contextMenuConv.id, !contextMenuConv.muted);
                        setContextMenuConv(null);
                    }}
                />
                <BottomSheetItem
                    icon={<CheckCircle size={18} />}
                    label="Mark as Read"
                    onClick={() => {
                        setContextMenuConv(null);
                    }}
                />
                <BottomSheetItem
                    icon={<Trash2 size={18} />}
                    label="Delete Chat"
                    variant="danger"
                    onClick={() => {
                        if (contextMenuConv) handleDeleteChat(contextMenuConv.id);
                        setContextMenuConv(null);
                    }}
                />
            </BottomSheet>

            {/* New Chat Modal */}
            {showNewChat && (
                <NewChatModal
                    type={showNewChat as any}
                    onClose={() => setShowNewChat(null)}
                    userId={user?.id || ''}
                    onCreated={loadConversations}
                />
            )}
        </div>
    );

}

function NewChatModal({ onClose, userId, onCreated, type }: { onClose: () => void; userId: string; onCreated: () => void; type: 'private' | 'group' | 'supergroup' | 'channel' | 'broadcast' | 'community' }) {
    const { user } = useUser();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [searchVal, setSearchVal] = useState('');
    const [results, setResults] = useState<UserProfile[]>([]);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const BATCH_SIZE = 20;

    const loadDirectory = async (pageNum: number, append = false) => {
        setLoading(true);
        try {
            const start = pageNum * BATCH_SIZE;
            const end = start + BATCH_SIZE - 1;
            const { data } = await insforge.database.from('profiles').select('*').neq('id', userId).order('display_name').range(start, end);
            const list = (data || []) as UserProfile[];
            setAllUsers(prev => append ? [...prev, ...list] : list);
        } catch (e) {
            setAllUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (type === 'private' || type === 'group') {
            loadDirectory(0);
        }
    }, [type, userId]);

    const handleSearch = async (val: string) => {
        setSearchVal(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
        const { data } = await insforge.database.from('profiles').select('*').neq('id', userId).ilike('display_name', `%${val}%`).limit(10);
        if (data) setResults(data as UserProfile[]);
    };

    const toggleUser = (u: UserProfile) => {
        if (selectedUsers.some(s => s.id === u.id)) {
            setSelectedUsers(selectedUsers.filter(s => s.id !== u.id));
        } else {
            if (type === 'private') {
                startChat(u);
            } else {
                setSelectedUsers([...selectedUsers, u]);
            }
        }
    };

    const startChat = async (targetUser?: UserProfile) => {
        if (creating) return;
        setCreating(true);
        try {
            const campusId = (user?.profile as any)?.campus_id || null;

            if (type === 'private' && targetUser) {
                const existingId = await ConversationService.getPrivateChat(userId, targetUser.id);
                if (existingId) {
                    onClose();
                    navigate(`/app/chats/${existingId}`);
                    return;
                }

                const { data: conv, error } = await insforge.database
                    .from('conversations')
                    .insert({
                        type: 'direct',
                        created_by: userId,
                        campus_id: campusId,
                        visibility: 'private'
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (conv) {
                    await insforge.database.from('conversation_members').insert([
                        { conversation_id: (conv as any).id, user_id: userId, role: 'owner' },
                        { conversation_id: (conv as any).id, user_id: targetUser.id, role: 'member' }
                    ]);
                    onCreated();
                    onClose();
                    navigate(`/app/chats/${(conv as any).id}`);
                }
            } else if (type === 'channel') {
                const channel = await ChannelService.createChannel(name, name, userId, campusId);
                onCreated();
                onClose();
                navigate(`/app/chats/${channel.id}`);
            } else if (type === 'broadcast') {
                if (!name.trim()) throw new Error('Enter a name for the broadcast list');
                const { data: convB, error: errorB } = await insforge.database
                    .from('conversations')
                    .insert({
                        type: 'broadcast',
                        name: name.trim(),
                        created_by: userId,
                        visibility: 'private'
                    }).select().single();

                if (errorB) throw errorB;
                if (convB) {
                    const members = [
                        { conversation_id: (convB as any).id, user_id: userId, role: 'owner' },
                        ...selectedUsers.map(u => ({ conversation_id: (convB as any).id, user_id: u.id, role: 'member' }))
                    ];
                    await insforge.database.from('conversation_members').insert(members);
                    onCreated();
                    onClose();
                    navigate(`/app/chats/${(convB as any).id}`);
                }
            } else {
                if (!name.trim()) throw new Error('Enter a name for the group');

                const { data: convGroup, error: errorGroup } = await insforge.database
                    .from('conversations')
                    .insert({
                        type: 'group',
                        name: name.trim(),
                        created_by: userId,
                        visibility: 'private',
                        is_public: false,
                        campus_id: campusId,
                        created_at: new Date().toISOString()
                    }).select().single();

                if (errorGroup) throw errorGroup;
                if (convGroup) {
                    const members = [
                        { conversation_id: (convGroup as any).id, user_id: userId, role: 'owner' },
                        ...selectedUsers.map(u => ({ conversation_id: (convGroup as any).id, user_id: u.id, role: 'member' }))
                    ];
                    await insforge.database.from('conversation_members').insert(members);
                    onCreated();
                    onClose();
                    navigate(`/app/chats/${(convGroup as any).id}`);
                }
            }
        } catch (err: any) {
            console.error('Chat creation error:', err);
            alert('Error: ' + (err.message || 'Unknown error.'));
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in flex items-end justify-center" onClick={onClose}>
            <div className="w-full max-w-[430px] bg-[#F2F2F7] rounded-t-[20px] pb-safe animate-slide-up h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1.5 bg-[#BCBCC0] rounded-full mx-auto my-3" />

                <div className="px-5 py-4 flex justify-between items-center bg-white border-b border-[#E5E5EA]">
                    <button onClick={onClose} className="ios-btn-blue text-[17px]">Cancel</button>
                    <h3 className="text-[17px] font-bold">New Message</h3>
                    {type !== 'private' ? (
                        <button
                            onClick={() => startChat()}
                            disabled={creating || !name.trim() || selectedUsers.length === 0}
                            className="ios-btn-blue text-[17px] font-semibold disabled:opacity-30"
                        >
                            {creating ? '...' : 'Create'}
                        </button>
                    ) : (
                        <div className="w-12" />
                    )}
                </div>

                <div className="bg-white px-4 py-2 border-b border-[#E5E5EA]">
                    {type !== 'private' && (
                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="Group Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full py-2 text-[17px] bg-white text-black placeholder:text-[#BBB] outline-none border-b border-[#E5E5EA]"
                            />
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-[15px] text-[#8E8E93]">To:</span>
                        <input
                            autoFocus
                            type="text"
                            value={searchVal}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="flex-1 py-1 text-[15px] bg-white text-black outline-none"
                        />
                        <button className="text-[#007AFF]">
                            <Plus size={22} strokeWidth={2} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white pt-2">
                    <div className="divide-y divide-[#E5E5EA]">
                        {(searchVal ? results : allUsers).map(u => (
                            <button
                                key={u.id}
                                onClick={() => toggleUser(u)}
                                className="w-full flex items-center gap-3 px-4 py-3 active:bg-[#F2F2F7] transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#F2F2F7] overflow-hidden border border-black/5 flex shrink-0">
                                    {u.avatar_url ? (
                                        <img src={u.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-[#E5E5EA] text-[#8E8E93]">
                                            {u.display_name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <span className="flex-1 text-left text-[17px] text-black">{u.display_name}</span>
                                {selectedUsers.some(s => s.id === u.id) && (
                                    <div className="w-5 h-5 rounded-full bg-[#007AFF] flex items-center justify-center">
                                        <Check size={12} className="text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    {allUsers.length === 0 && !loading && (
                        <div className="p-10 text-center text-[#8E8E93]">No users found</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Add these to types or local if not found
const Check = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
