import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { Conversation, UserProfile } from '../../types';
import {
    Search,
    Plus,
    Users,
    Megaphone,
    Bell,
    MoreVertical,
    CheckCheck,
    Image,
    Mic,
    FileText,
    MessageCircle,
} from 'lucide-react';

export default function ChatListPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { chatId } = useParams<{ chatId: string }>();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);

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

                setConversations(enriched as Conversation[]);
            }
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter((c) => {
        const name = c.type === 'direct' ? c.other_user?.display_name : c.name;
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
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
            <header className="px-5 py-4 safe-top bg-campus-dark/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold">Messages</h1>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowNewChat(true)}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <Plus size={20} className="text-brand-400" />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <MoreVertical size={20} className="text-campus-muted" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-campus-muted group-focus-within:text-brand-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-campus-card/40 border border-white/[0.05] focus:border-brand-500/50 rounded-full pl-9 pr-4 py-2 text-xs focus:ring-0 transition-all"
                    />
                </div>
            </header>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-0.5">
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
                                        <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-brand-400' : 'text-white'}`}>
                                            {getConversationName(conv)}
                                        </h3>
                                        <span className="text-[10px] text-campus-muted">
                                            {conv.last_message ? new Date(conv.last_message.created_at).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-campus-muted truncate max-w-[150px]">
                                            {getMessagePreview(conv)}
                                        </p>
                                        {conv.unread_count > 0 && (
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
                <NewChatModal onClose={() => setShowNewChat(false)} userId={user?.id || ''} onCreated={loadConversations} />
            )}
        </div>
    );
}

// Reuse NewChatModal logic...
function NewChatModal({ onClose, userId, onCreated }: { onClose: () => void; userId: string; onCreated: () => void }) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<UserProfile[]>([]);

    const handleSearch = async (val: string) => {
        setName(val);
        if (val.length < 2) { setResults([]); return; }
        setSearching(true);
        const { data } = await insforge.database.from('profiles').select('*').ilike('display_name', `%${val}%`).limit(5);
        if (data) setResults(data as UserProfile[]);
        setSearching(false);
    };

    const startChat = async (targetUser: UserProfile) => {
        if (targetUser.id === userId) return;
        const { data: conv } = await insforge.database.from('conversations').insert({ type: 'direct', created_by: userId }).select().single();
        if (conv) {
            await insforge.database.from('conversation_members').insert([
                { conversation_id: (conv as any).id, user_id: userId, role: 'admin' },
                { conversation_id: (conv as any).id, user_id: targetUser.id, role: 'member' }
            ]);
            onCreated();
            onClose();
            navigate(`/app/chats/${(conv as any).id}`);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-campus-dark border border-white/[0.05] rounded-3xl p-6 shadow-premium animate-scale-in">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold">New Message</h2>
                    <button onClick={onClose} className="p-1 text-campus-muted hover:text-white">✕</button>
                </div>
                <input
                    type="text"
                    placeholder="Search people..."
                    value={name}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-brand-500 transition-all mb-4"
                />
                <div className="space-y-2">
                    {searching ? <p className="text-center py-4 text-xs text-campus-muted">Searching...</p> :
                        results.map(u => (
                            <button key={u.id} onClick={() => startChat(u)} className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors">
                                <img src={u.avatar_url || ''} className="w-10 h-10 rounded-full bg-white/10" alt="" />
                                <div className="text-left">
                                    <p className="text-sm font-semibold">{u.display_name}</p>
                                    <p className="text-[10px] text-campus-muted">{u.branch || 'Student'}</p>
                                </div>
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
}
