import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { Conversation, UserProfile } from '../../types';
import {
    Search,
    Plus,
    MoreVertical,
    MessageCircle,
    Users,
    UsersRound,
    Settings,
    CheckCheck,
} from 'lucide-react';
import { RankingEngine } from '../../services/rankingService';

export default function ChatListPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { chatId } = useParams<{ chatId: string }>();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups' | 'channels'>('all');
    const [showNewChat, setShowNewChat] = useState<'direct' | 'group' | 'channel' | null>(null);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        if (user?.id) loadConversations();
    }, [user?.id]);

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
        if (filterTab === 'groups') return c.type !== 'direct';
        return true;
    });

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
        <div className="h-full flex flex-col bg-campus-dark border-r border-white/[0.05]">
            {/* Header */}
            <header className="px-4 py-3 safe-top bg-campus-dark/80 backdrop-blur-md sticky top-0 z-20 border-b border-white/[0.05]">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Chats</h1>
                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={() => setShowNewChat('direct')}
                            className="p-2 bg-white/[0.03] hover:bg-white/10 rounded-full transition-colors"
                            title="New Chat"
                        >
                            <Plus size={20} className="text-white" />
                        </button>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-2 rounded-full transition-colors ${showMenu ? 'bg-white/10 text-brand-400' : 'bg-white/[0.03] hover:bg-white/10 text-white'}`}
                        >
                            <MoreVertical size={20} />
                        </button>

                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-campus-dark border border-white/[0.08] rounded-2xl shadow-premium p-2 z-30 animate-scale-in">
                                    <button
                                        onClick={() => { setShowNewChat('group'); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 p-3 text-sm hover:bg-white/5 rounded-xl transition-colors"
                                    >
                                        <Users size={18} className="text-blue-400" /> Create Group
                                    </button>
                                    <button
                                        onClick={() => { setShowNewChat('channel'); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 p-3 text-sm hover:bg-white/5 rounded-xl transition-colors"
                                    >
                                        <UsersRound size={18} className="text-brand-400" /> Create Channel
                                    </button>
                                    <div className="h-[1px] bg-white/[0.05] my-1 mx-2"></div>
                                    <button className="w-full flex items-center gap-3 p-3 text-sm hover:bg-white/5 rounded-xl transition-colors">
                                        <Settings size={18} className="text-campus-muted" /> Chat Settings
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative group mb-3">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-campus-muted group-focus-within:text-brand-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search or start a new chat"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.05] group-focus-within:border-brand-500/30 group-focus-within:bg-black/20 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-0 transition-all placeholder:text-campus-muted/70"
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                    <button onClick={() => setFilterTab('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filterTab === 'all' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-white/[0.03] hover:bg-white/10 text-campus-muted hover:text-white border border-transparent'}`}>All</button>
                    <button onClick={() => setFilterTab('unread')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filterTab === 'unread' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-white/[0.03] hover:bg-white/10 text-campus-muted hover:text-white border border-transparent'}`}>Unread</button>
                    <button onClick={() => setFilterTab('groups')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filterTab === 'groups' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-white/[0.03] hover:bg-white/10 text-campus-muted hover:text-white border border-transparent'}`}>Groups</button>
                    <button onClick={() => setFilterTab('channels')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filterTab === 'channels' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-white/[0.03] hover:bg-white/10 text-campus-muted hover:text-white border border-transparent'}`}>Channels</button>
                </div>
            </header>

            {/* List */}
            <div className="flex-1 overflow-y-auto pt-2 pb-4 space-y-0.5 custom-scrollbar">

                {loading ? (
                    <div className="px-3 py-4 space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-white/5" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 w-24 bg-white/5 rounded" />
                                    <div className="h-2 w-32 bg-white/5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 px-6 text-center opacity-50">
                        <MessageCircle size={40} className="mb-3" />
                        <p className="text-sm font-medium">No chats found</p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => {
                        const isActive = chatId === conv.id;
                        return (
                            <button
                                key={conv.id}
                                onClick={() => navigate(`/app/chats/${conv.id}`)}
                                className={`w-full flex items-center gap-3 px-4 py-3 border-l-[3px] transition-all duration-200 ${isActive
                                    ? 'bg-brand-500/10 border-brand-500'
                                    : 'bg-transparent border-transparent hover:bg-white/[0.03]'
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    {getConversationAvatar(conv) ? (
                                        <img src={getConversationAvatar(conv)!} className="w-12 h-12 rounded-full object-cover shadow-sm" alt="" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                            {getConversationName(conv).charAt(0)}
                                        </div>
                                    )}
                                    {conv.type === 'direct' && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-campus-dark" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-brand-400' : 'text-white'} flex items-center gap-2`}>
                                            {getConversationName(conv)}
                                            {conv.is_important && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-glow" title="Academic Importance" />}
                                        </h3>
                                        <span className="text-[10px] text-campus-muted">
                                            {conv.last_message ? new Date(conv.last_message.created_at).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-campus-muted truncate max-w-[150px]">
                                            {getMessagePreview(conv)}
                                        </p>
                                        {(conv.unread_count || 0) > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Float Action for mobile handled in MainLayout but keeping consistency */}
            {showNewChat && (
                <NewChatModal
                    type={showNewChat}
                    onClose={() => setShowNewChat(null)}
                    userId={user?.id || ''}
                    onCreated={loadConversations}
                />
            )}
        </div>
    );
}

// Reuse NewChatModal logic...
function NewChatModal({ onClose, userId, onCreated, type }: { onClose: () => void; userId: string; onCreated: () => void; type: 'direct' | 'group' | 'channel' }) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<UserProfile[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
    const [creating, setCreating] = useState(false);

    const handleSearch = async (val: string) => {
        setName(val);
        if (val.length < 2) { setResults([]); return; }
        setSearching(true);
        const { data } = await insforge.database.from('profiles').select('*').ilike('display_name', `%${val}%`).limit(10);
        if (data) setResults(data as UserProfile[]);
        setSearching(false);
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
                // Determine membership payload based on self chat vs other chat
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

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-campus-dark border border-white/[0.05] rounded-3xl p-6 shadow-premium animate-scale-in">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold">New {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                    <button onClick={onClose} className="p-1 text-campus-muted hover:text-white">✕</button>
                </div>

                {type !== 'direct' && (
                    <input
                        type="text"
                        placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} name...`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-brand-500 transition-all mb-4"
                    />
                )}

                <div className="relative mb-4">
                    <Search size={16} className="absolute left-4 top-3.5 text-campus-muted" />
                    <input
                        type="text"
                        placeholder="Search people..."
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:border-brand-500 transition-all"
                    />
                </div>

                {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 max-h-24 overflow-y-auto p-1">
                        {selectedUsers.map(u => (
                            <div key={u.id} className="flex items-center gap-1 bg-brand-500/20 border border-brand-500/30 rounded-full px-2 py-1 text-[10px] text-brand-400">
                                <span>{u.display_name}</span>
                                <button onClick={() => toggleUser(u)}>✕</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {searching ? <p className="text-center py-4 text-xs text-campus-muted">Searching...</p> :
                        results.map(u => (
                            <button
                                key={u.id}
                                onClick={() => type === 'direct' ? startChat(u) : toggleUser(u)}
                                className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all ${selectedUsers.some(s => s.id === u.id) ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <img src={u.avatar_url || ''} className="w-10 h-10 rounded-full bg-white/10 object-cover" alt="" />
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{u.display_name}</p>
                                    <p className="text-[10px] text-campus-muted truncate">{u.branch || 'Student'}</p>
                                </div>
                                {type !== 'direct' && (
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedUsers.some(s => s.id === u.id) ? 'bg-brand-500 border-brand-500' : 'border-white/10'}`}>
                                        {selectedUsers.some(s => s.id === u.id) && <CheckCheck size={12} className="text-white" />}
                                    </div>
                                )}
                            </button>
                        ))}
                    {results.length === 0 && !searching && <p className="text-center py-8 text-xs text-campus-muted">Search for classmates to start chatting</p>}
                </div>

                {type !== 'direct' && (
                    <button
                        disabled={selectedUsers.length === 0 || creating}
                        onClick={() => startChat()}
                        className="w-full mt-6 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all shadow-glow flex items-center justify-center gap-2"
                    >
                        {creating ? 'Creating...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                    </button>
                )}
            </div>
        </div>
    );
}
