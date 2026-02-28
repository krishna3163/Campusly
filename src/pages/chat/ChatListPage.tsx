import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { Conversation, UserProfile } from '../../types';
import {
    Search,
    Plus,
    MessageCircle,
    CheckCheck,
    X,
    Archive,
} from 'lucide-react';
import { RankingEngine } from '../../services/rankingService';

export default function ChatListPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { chatId } = useParams<{ chatId: string }>();
    const location = useLocation();
    const initialTab = (location.state as { tab?: 'all' | 'unread' | 'groups' | 'channels' | 'archived' })?.tab;
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [statusUsers, setStatusUsers] = useState<{ profile: UserProfile; hasStatus: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups' | 'channels' | 'archived'>(initialTab || 'all');
    const [showNewChat, setShowNewChat] = useState<'direct' | 'group' | 'channel' | null>(null);

    useEffect(() => {
        if (user?.id) loadConversations();
    }, [user?.id]);

    useEffect(() => {
        if (initialTab) setFilterTab(initialTab);
    }, [initialTab]);

    const loadConversations = async () => {
        if (!user?.id) return;
        try {
            const { data: memberData } = await insforge.database
                .from('conversation_members')
                .select('conversation_id')
                .eq('user_id', user.id);

            if (!memberData?.length) {
                setConversations([]);
                setLoading(false);
                return;
            }

            const conversationIds = memberData.map((m: { conversation_id: string }) => m.conversation_id);

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
                        if (conv.type === 'direct') {
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
                        };
                    })
                );

                const ranked = RankingEngine.rankGroups(enriched as Conversation[]);
                setConversations(ranked);

                const directConvs = ranked.filter(c => c.type === 'direct');
                const otherIds = new Set<string>();
                for (const c of directConvs) {
                    const other = c.other_user?.id;
                    if (other) otherIds.add(other);
                }
                if (otherIds.size > 0) {
                    const { data: profiles } = await insforge.database.from('profiles').select('*').in('id', Array.from(otherIds));
                    setStatusUsers((profiles || []).map((p: UserProfile) => ({ profile: p, hasStatus: !!(p as any).activity_status })));
                }
            }
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter((c) => {
        const name = c.type === 'direct' ? c.other_user?.display_name : c.name;
        const matchesSearch = name?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (filterTab === 'unread') return (c.unread_count || 0) > 0;
        if (filterTab === 'groups') return c.type === 'group';
        if (filterTab === 'channels') return c.type === 'broadcast';
        if (filterTab === 'archived') return (c as any).is_archived === true;
        return !(c as any).is_archived;
    });

    const handleArchive = (e: React.MouseEvent, convId: string) => {
        e.stopPropagation();
        e.preventDefault();
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, is_archived: !(c as any).is_archived } : c));
    };

    const getConversationName = (conv: Conversation) => {
        if (conv.type === 'direct') return conv.other_user?.display_name || 'Unknown User';
        return conv.name || 'Unnamed Group';
    };

    const getConversationAvatar = (conv: Conversation) => {
        if (conv.type === 'direct' && conv.other_user?.avatar_url) {
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
            case 'voice_note': return '🎙️ Voice note';
            case 'document': return '📄 Document';
            default: return msg.content || '';
        }
    };

    return (
        <div className="h-full flex flex-col bg-campus-darker border-r border-campus-border/30">
            {/* Clean Header */}
            <header className="px-6 py-6 safe-top bg-campus-dark/40 backdrop-blur-sm sticky top-0 z-20 border-b border-campus-border/20">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-[24px] font-bold text-white">Chats</h1>
                    <button
                        onClick={() => setShowNewChat('direct')}
                        className="p-2.5 bg-brand-500 hover:bg-brand-600 rounded-[10px] transition-all duration-300 shadow-elevation-2 hover:shadow-elevation-3 text-white active:scale-95 animate-fade-in"
                        title="New Chat"
                    >
                        <Plus size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Full-width Search */}
                <div className="relative group mb-6 animate-fade-in">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-campus-muted/60 group-focus-within:text-brand-400 transition-colors duration-300" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-campus-card/40 border border-campus-border/40 group-focus-within:border-brand-500/60 group-focus-within:bg-campus-card/60 rounded-[12px] pl-12 pr-4 py-3.5 text-[16px] focus:ring-0 transition-all duration-300 placeholder:text-campus-muted/50"
                    />
                </div>

                {/* Status circles - below search bar */}
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 mb-3 -mx-1 px-1">
                    <button onClick={() => navigate('/app/status')} className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-campus-card/80 border-2 border-dashed border-campus-border group-hover:border-brand-500/60 flex items-center justify-center overflow-hidden">
                                {(user?.profile as any)?.avatar_url ? (
                                    <img src={(user?.profile as any).avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <span className="text-lg font-bold text-campus-muted">+</span>
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">+</div>
                        </div>
                        <span className="text-[10px] font-medium text-campus-muted truncate max-w-[52px]">My status</span>
                    </button>
                    {statusUsers.slice(0, 10).map(({ profile }) => (
                        <button key={profile.id} onClick={() => navigate('/app/status', { state: { viewUserId: profile.id } })} className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-br from-brand-500 to-purple-500 group-hover:scale-105 transition-transform">
                                    <div className="w-full h-full rounded-full bg-campus-dark flex items-center justify-center overflow-hidden border-2 border-campus-darker">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <span className="text-sm font-bold text-white">{profile.display_name?.charAt(0) || '?'}</span>
                                        )}
                                    </div>
                                </div>
                                {profile.activity_status && (
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-campus-darker" />
                                )}
                            </div>
                            <span className="text-[10px] font-medium text-campus-muted truncate max-w-[52px]">{profile.display_name?.split(' ')[0] || 'User'}</span>
                        </button>
                    ))}
                </div>

                {/* Filter Pills - Chats | Channels | Archived */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                    <button 
                        onClick={() => setFilterTab('all')} 
                        className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 whitespace-nowrap ${filterTab === 'all' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40' : 'bg-campus-border/20 hover:bg-campus-border/40 text-campus-muted hover:text-white border border-transparent'}`}
                    >
                        Chats
                    </button>
                    <button 
                        onClick={() => setFilterTab('groups')} 
                        className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 whitespace-nowrap ${filterTab === 'groups' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40' : 'bg-campus-border/20 hover:bg-campus-border/40 text-campus-muted hover:text-white border border-transparent'}`}
                    >
                        Channels
                    </button>
                    <button 
                        onClick={() => setFilterTab('archived')} 
                        className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${filterTab === 'archived' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40' : 'bg-campus-border/20 hover:bg-campus-border/40 text-campus-muted hover:text-white border border-transparent'}`}
                    >
                        <Archive size={14} /> Archived
                    </button>
                    <button 
                        onClick={() => setFilterTab('unread')} 
                        className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 whitespace-nowrap ${filterTab === 'unread' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40' : 'bg-campus-border/20 hover:bg-campus-border/40 text-campus-muted hover:text-white border border-transparent'}`}
                    >
                        Unread
                    </button>
                </div>
            </header>

            {/* Conversation List - Proper Spacing */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-2 custom-scrollbar">

                {loading ? (
                    <div className="px-3 py-4 space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex gap-3 animate-pulse p-4">
                                <div className="w-14 h-14 rounded-full bg-white/5" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 w-24 bg-white/5 rounded" />
                                    <div className="h-2.5 w-32 bg-white/5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 px-6 text-center opacity-50">
                        <MessageCircle size={40} className="mb-3" />
                        <p className="text-[14px] font-medium text-campus-muted">No chats found</p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => {
                        const isActive = chatId === conv.id;
                        const isArchived = (conv as any).is_archived === true;
                        return (
                            <div key={conv.id} className="mb-3 last:mb-0 group/conv">
                                <button
                                    onClick={() => navigate(`/app/chats/${conv.id}`)}
                                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-[14px] min-h-[72px] transition-all duration-300 animate-fade-in ${isActive
                                        ? 'bg-brand-500/12 border border-brand-500/20 shadow-elevation-2'
                                        : 'bg-campus-card/30 hover:bg-campus-card/50 border border-campus-border/20 hover:border-campus-border/40'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {getConversationAvatar(conv) ? (
                                            <img src={getConversationAvatar(conv)!} className="w-14 h-14 rounded-full object-cover shadow-elevation-1" alt="" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-[16px] shadow-elevation-2">
                                                {getConversationName(conv).charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-start gap-3 mb-2">
                                            <h3 className={`text-[16px] font-bold truncate ${isActive ? 'text-brand-400' : 'text-white'}`}>
                                                {getConversationName(conv)}
                                            </h3>
                                            <span className="text-[12px] text-campus-muted/70 font-medium shrink-0 whitespace-nowrap">
                                                {conv.last_message ? new Date(conv.last_message.created_at).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[14px] text-campus-muted/80 truncate w-[90%] font-normal">
                                                {getMessagePreview(conv)}
                                            </p>
                                            {/* Simple Unread Badge - Minimal circle */}
                                            {(conv.unread_count || 0) > 0 && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-elevation-2 shrink-0 animate-pulse"></div>
                                            )}
                                        </div>
                                    </div>
                                    {filterTab === 'archived' && isArchived && (
                                        <button onClick={(e) => { e.stopPropagation(); handleArchive(e, conv.id); }} className="ml-2 p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all shrink-0 opacity-0 group-hover/conv:opacity-100" title="Unarchive">
                                            <Archive size={16} />
                                        </button>
                                    )}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <NewChatModal
                    type={showNewChat}
                    onClose={() => setShowNewChat(null)}
                    userId={user?.id || ''}
                    userProfile={user?.profile as UserProfile | undefined}
                    onCreated={loadConversations}
                />
            )}
        </div>
    );
}

// New Chat Modal - Refined Design with full campus directory for direct
function NewChatModal({ onClose, userId, userProfile, onCreated, type }: { onClose: () => void; userId: string; userProfile?: UserProfile; onCreated: () => void; type: 'direct' | 'group' | 'channel' }) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [searchVal, setSearchVal] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<UserProfile[]>([]);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [suggested, setSuggested] = useState<UserProfile[]>([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filterChip, setFilterChip] = useState<'all' | 'same_branch' | 'same_semester' | 'seniors' | 'freshers'>('all');
    const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
    const [creating, setCreating] = useState(false);
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

    const loadSuggested = async () => {
        if (!userProfile) return;
        try {
            const { data } = await insforge.database.from('profiles').select('*').neq('id', userId).limit(15);
            const list = (data || []) as UserProfile[];
            const ranked = list.filter(p => 
                (userProfile.branch && p.branch === userProfile.branch) ||
                (userProfile.semester && p.semester === userProfile.semester) ||
                (p.placement_status && userProfile.placement_status && p.placement_status === userProfile.placement_status) ||
                (p.skills?.length && userProfile.skills?.length && (p.skills as string[]).some((s: string) => (userProfile.skills as string[] || []).includes(s)))
            );
            setSuggested(ranked.slice(0, 6));
        } catch {
            setSuggested([]);
        }
    };

    useEffect(() => {
        if (type === 'direct') {
            loadDirectory(0);
            loadSuggested();
        }
    }, [type, userId]);

    const handleSearch = async (val: string) => {
        setSearchVal(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        const { data } = await insforge.database.from('profiles').select('*').neq('id', userId).ilike('display_name', `%${val}%`).limit(10);
        if (data) setResults(data as UserProfile[]);
        setSearching(false);
    };

    const filteredAll = allUsers.filter(u => {
        if (filterChip === 'all') return true;
        if (filterChip === 'same_branch' && userProfile?.branch) return u.branch === userProfile.branch;
        if (filterChip === 'same_semester' && userProfile?.semester) return u.semester === userProfile.semester;
        if (filterChip === 'seniors') return (u as any).is_senior === true;
        if (filterChip === 'freshers') return (u.semester || 0) <= 2;
        return true;
    });

    const isOnline = (p: UserProfile) => {
        const lastSeen = (p as any).last_seen;
        if (!lastSeen) return false;
        const diff = Date.now() - new Date(lastSeen).getTime();
        return diff < 5 * 60 * 1000;
    };

    const toggleUser = (u: UserProfile) => {
        if (selectedUsers.some(s => s.id === u.id)) {
            setSelectedUsers(selectedUsers.filter(s => s.id !== u.id));
        } else {
            setSelectedUsers([...selectedUsers, u]);
        }
    };

    const startChat = async (targetUser?: UserProfile) => {
        if (creating) return;
        setCreating(true);
        try {
            if (type === 'direct' && targetUser) {
                const { data: conv } = await insforge.database.from('conversations').insert({ type: 'direct', created_by: userId }).select().single();
                if (conv) {
                    if (targetUser.id === userId) {
                        await insforge.database.from('conversation_members').insert([
                            { conversation_id: (conv as any).id, user_id: userId, role: 'admin' }
                        ]);
                    } else {
                        await insforge.database.from('conversation_members').insert([
                            { conversation_id: (conv as any).id, user_id: userId, role: 'admin' },
                            { conversation_id: (conv as any).id, user_id: targetUser.id, role: 'member' }
                        ]);
                    }
                    onCreated();
                    onClose();
                    navigate(`/app/chats/${(conv as any).id}`);
                }
            } else if (type !== 'direct') {
                if (!name.trim()) { alert(`Please enter a ${type} name`); return; }
                const { data: conv } = await insforge.database.from('conversations').insert({
                    type: type as any,
                    name: name.trim(),
                    created_by: userId
                }).select().single();

                if (conv) {
                    const members = [
                        { conversation_id: (conv as any).id, user_id: userId, role: 'admin' },
                        ...selectedUsers.map(u => ({ conversation_id: (conv as any).id, user_id: u.id, role: 'member' }))
                    ];
                    await insforge.database.from('conversation_members').insert(members);
                    onCreated();
                    onClose();
                    navigate(`/app/chats/${(conv as any).id}`);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const directUserList = type === 'direct' && !searchVal.trim() ? filteredAll : results;
    const showSuggested = type === 'direct' && !searchVal.trim() && suggested.length > 0 && filterChip === 'all';

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className={`w-full max-w-md glass-card p-6 animate-scale-in transition-smooth ${type === 'direct' ? 'max-h-[90vh] flex flex-col' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[20px] font-bold">New {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                    <button onClick={onClose} className="p-2 rounded-[10px] hover:bg-white/[0.1] text-campus-muted hover:text-white transition-all active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                {type !== 'direct' && (
                    <input
                        type="text"
                        placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} name...`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field mb-4 text-[16px]"
                    />
                )}

                <div className="relative mb-4">
                    <Search size={18} className="absolute left-4 top-3.5 text-campus-muted/60" />
                    <input
                        type="text"
                        placeholder={type === 'direct' ? "Search people (optional)..." : "Search people..."}
                        value={searchVal}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="input-field pl-12 text-[16px]"
                    />
                </div>

                {type === 'direct' && !searchVal.trim() && (
                    <div className="flex flex-wrap gap-2 mb-4 pb-2 overflow-x-auto scrollbar-hide">
                        {(['all', 'same_branch', 'same_semester', 'seniors', 'freshers'] as const).map(chip => (
                            <button
                                key={chip}
                                onClick={() => setFilterChip(chip)}
                                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-250 ${filterChip === chip ? 'bg-brand-500/25 text-brand-400 border border-brand-500/40' : 'bg-white/[0.05] text-campus-muted hover:text-white border border-transparent'}`}
                            >
                                {chip === 'all' ? 'All' : chip === 'same_branch' ? 'Same Branch' : chip === 'same_semester' ? 'Same Semester' : chip === 'seniors' ? 'Seniors' : 'Freshers'}
                            </button>
                        ))}
                    </div>
                )}

                {selectedUsers.length > 0 && type !== 'direct' && (
                    <div className="flex flex-wrap gap-2 mb-4 max-h-20 overflow-y-auto p-2 bg-white/[0.03] rounded-[10px] border border-campus-border/30">
                        {selectedUsers.map(u => (
                            <div key={u.id} className="flex items-center gap-2 bg-brand-500/20 border border-brand-500/40 rounded-full px-3 py-1 text-[12px] text-brand-400 font-medium">
                                <span>{u.display_name}</span>
                                <button onClick={() => toggleUser(u)} className="hover:text-brand-300 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {showSuggested && (
                    <div className="mb-4">
                        <p className="text-[11px] font-bold text-campus-muted uppercase tracking-wider mb-2">Suggested Connections</p>
                        <div className="flex flex-wrap gap-2">
                            {suggested.map(u => (
                                <button key={u.id} onClick={() => startChat(u)} className="flex items-center gap-2 p-2 rounded-[12px] bg-white/[0.05] hover:bg-brand-500/15 border border-transparent hover:border-brand-500/30 transition-all duration-250 active:scale-95">
                                    <div className="relative shrink-0">
                                        {u.avatar_url ? <img src={u.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" /> : <div className="w-9 h-9 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">{u.display_name?.charAt(0)}</div>}
                                        {isOnline(u) && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-campus-dark" />}
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="text-[13px] font-semibold truncate text-white">{u.display_name}</p>
                                        <p className="text-[11px] text-campus-muted truncate">{u.branch || '—'} • Sem {u.semester || '—'}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-1 mb-4 max-h-72">
                    {searching || loading ? (
                        <p className="text-center py-8 text-[13px] text-campus-muted">{searching ? 'Searching...' : 'Loading directory...'}</p>
                    ) : directUserList.length === 0 ? (
                        <p className="text-center py-8 text-[13px] text-campus-muted">{searchVal.trim() ? 'No matches found' : 'Search to find classmates or use filters'}</p>
                    ) : (
                        directUserList.map(u => (
                            <button
                                key={u.id}
                                onClick={() => type === 'direct' ? startChat(u) : toggleUser(u)}
                                className={`w-full flex items-center gap-3 p-3 rounded-[12px] transition-all duration-250 mb-2 card-hover-lift ${selectedUsers.some(s => s.id === u.id) ? 'bg-brand-500/15 border border-brand-500/30' : 'hover:bg-white/[0.05] border border-transparent'}`}
                            >
                                <div className="relative shrink-0">
                                    {u.avatar_url ? <img src={u.avatar_url} className="w-11 h-11 rounded-full object-cover" alt="" /> : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500/40 to-purple-500/40 flex items-center justify-center text-brand-400 font-bold">{u.display_name?.charAt(0)}</div>}
                                    {type === 'direct' && isOnline(u) && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-campus-dark" />}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-[14px] font-semibold truncate text-white">{u.display_name}</p>
                                    <p className="text-[12px] text-campus-muted truncate">{u.branch || 'Student'} • Sem {u.semester || '—'}</p>
                                </div>
                                {type !== 'direct' && (
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${selectedUsers.some(s => s.id === u.id) ? 'bg-brand-500 border-brand-500' : 'border-campus-border/50'}`}>
                                        {selectedUsers.some(s => s.id === u.id) && <CheckCheck size={12} className="text-white" />}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {type === 'direct' && allUsers.length >= BATCH_SIZE && !searchVal.trim() && (
                    <button onClick={() => { setPage(p => p + 1); loadDirectory(page + 1, true); }} disabled={loading} className="text-[12px] text-brand-400 hover:text-brand-300 font-medium mb-2 disabled:opacity-50">
                        Load more
                    </button>
                )}

                {type !== 'direct' && (
                    <button
                        disabled={selectedUsers.length === 0 || creating}
                        onClick={() => startChat()}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {creating ? 'Creating...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                    </button>
                )}
            </div>
        </div>
    );
}
