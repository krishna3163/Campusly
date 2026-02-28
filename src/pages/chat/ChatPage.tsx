import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { Message, UserProfile } from '../../types';
import {
    ArrowLeft,
    Send,
    Paperclip,
    Mic,
    MoreVertical,
    Phone,
    Video,
    Pin,
    AlertCircle,
    Reply,
    CheckCheck,
    Search,
    Info,
} from 'lucide-react';

export default function ChatPage() {
    const { chatId } = useParams<{ chatId: string }>();
    const { user } = useUser();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [chatName, setChatName] = useState('');
    const [chatAvatar, setChatAvatar] = useState('');
    const [isOnline, setIsOnline] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!chatId || !user?.id) return;

        const loadChat = async () => {
            setLoading(true);
            try {
                const { data: conv } = await insforge.database
                    .from('conversations')
                    .select('*')
                    .eq('id', chatId)
                    .single();

                if (conv) {
                    if ((conv as any).type === 'direct') {
                        const { data: members } = await insforge.database
                            .from('conversation_members')
                            .select('user_id')
                            .eq('conversation_id', chatId)
                            .neq('user_id', user.id);

                        if (members?.[0]) {
                            const { data: profile } = await insforge.database
                                .from('profiles')
                                .select('*')
                                .eq('id', (members[0] as any).user_id)
                                .single();

                            if (profile) {
                                setChatName((profile as UserProfile).display_name);
                                setChatAvatar((profile as UserProfile).avatar_url || '');
                                setIsOnline(true);
                            }
                        }
                    } else {
                        setChatName((conv as any).name || 'Group Chat');
                        setChatAvatar((conv as any).avatar_url || '');
                    }
                }

                const { data: msgData } = await insforge.database
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', chatId)
                    .order('created_at', { ascending: true })
                    .limit(50);

                if (msgData) {
                    const senderIds = [...new Set((msgData as Message[]).map((m) => m.sender_id))];
                    const { data: profiles } = await insforge.database
                        .from('profiles')
                        .select('*')
                        .in('id', senderIds);

                    const profileMap = new Map<string, UserProfile>();
                    (profiles as UserProfile[] || []).forEach((p) => profileMap.set(p.id, p));

                    const enriched = (msgData as Message[]).map((m) => ({
                        ...m,
                        sender: profileMap.get(m.sender_id),
                    }));

                    setMessages(enriched);
                    setTimeout(scrollToBottom, 100);
                }
            } catch (err) {
                console.error('Error loading chat:', err);
            } finally {
                setLoading(false);
            }
        };

        loadChat();
    }, [chatId, user?.id]);

    useEffect(() => {
        if (!chatId || !user?.id) return;
        const setupRealtime = async () => {
            await insforge.realtime.connect();
            await insforge.realtime.subscribe(`chat:${chatId}`);
            insforge.realtime.on('new_message', async (payload: any) => {
                if (payload.conversation_id !== chatId) return;
                const { data: profile } = await insforge.database.from('profiles').select('*').eq('id', payload.sender_id).single();
                const newMsg = { ...payload, sender: profile };
                setMessages((prev) => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
                setTimeout(scrollToBottom, 50);
            });
        };
        setupRealtime();
        return () => { insforge.realtime.unsubscribe(`chat:${chatId}`); };
    }, [chatId, user?.id]);

    const handleSend = async () => {
        if (!newMessage.trim() || !chatId || !user?.id || sending) return;
        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);
        try {
            const { data } = await insforge.database.from('messages').insert({
                conversation_id: chatId,
                sender_id: user.id,
                content,
                type: 'text',
                reply_to: replyTo?.id
            }).select();
            setReplyTo(null);
            if (data?.[0]) {
                const newM = { ...data[0], sender: { id: user.id, display_name: user.profile?.display_name || 'You' } };
                setMessages(prev => [...prev, newM as any]);
                scrollToBottom();
            }
        } catch (err) { } finally { setSending(false); }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-campus-darker relative overflow-hidden">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

            {/* Header */}
            <header className="h-16 shrink-0 bg-campus-dark/80 backdrop-blur-3xl border-b border-white/[0.05] px-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/app/chats')} className="md:hidden p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>

                    <div className="relative group cursor-pointer">
                        {chatAvatar ? (
                            <img src={chatAvatar} className="w-10 h-10 rounded-full object-cover border border-white/[0.1] group-hover:scale-105 transition-transform" alt="" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                                {chatName.charAt(0)}
                            </div>
                        )}
                        {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-campus-dark" />}
                    </div>

                    <div className="min-w-0">
                        <h2 className="font-bold text-sm truncate leading-tight group-hover:text-brand-400 cursor-pointer transition-colors">{chatName || 'Loading Chat...'}</h2>
                        <p className="text-[10px] text-campus-muted font-medium uppercase tracking-wider">{isOnline ? 'Online now' : 'Away'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-campus-muted hover:text-white">
                        <Search size={18} />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-campus-muted hover:text-white">
                        <Video size={18} />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-campus-muted hover:text-white">
                        <Phone size={18} />
                    </button>
                    <div className="w-[1px] h-6 bg-white/[0.05] mx-1"></div>
                    <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-campus-muted hover:text-white">
                        <Info size={18} />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2 relative z-10 scroll-smooth">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center opacity-20">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 px-10">
                        <div className="w-16 h-16 rounded-3xl bg-white/[0.05] flex items-center justify-center mb-4">
                            <Send size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Encrypted Chat</h3>
                        <p className="text-xs max-w-[200px]">Messages are secured with end-to-end encryption. Start typing below.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender_id === user?.id;
                        const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;

                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} mb-1 animate-fade-in`}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden flex-shrink-0 mb-1 border border-white/[0.05]">
                                        {showAvatar && (
                                            msg.sender?.avatar_url ? <img src={msg.sender.avatar_url} className="w-full h-full object-cover" alt="" /> :
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-white/10">{msg.sender?.display_name?.charAt(0)}</div>
                                        )}
                                    </div>
                                )}
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] lg:max-w-[60%]`}>
                                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-campus-dark border border-white/[0.05] text-white rounded-bl-sm'
                                        }`}>
                                        {msg.reply_to && (
                                            <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-white/20 text-[11px] opacity-80 line-clamp-1">
                                                Replying to message...
                                            </div>
                                        )}
                                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 px-1 opacity-40">
                                        <span className="text-[9px] font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isMe && <CheckCheck size={12} />}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Wrapper — Instagram/Messenger style (floating) */}
            <div className="p-4 shrink-0 bg-transparent relative z-20">
                {replyTo && (
                    <div className="mx-auto max-w-4xl bg-campus-dark border border-white/[0.1] border-b-0 rounded-t-2xl px-4 py-2 flex items-center justify-between animate-slide-up">
                        <div className="flex items-center gap-2 min-w-0">
                            <Reply size={14} className="text-brand-400" />
                            <p className="text-xs text-campus-muted truncate">Replying to <span className="text-brand-400 font-bold">{replyTo.sender?.display_name}</span></p>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="text-campus-muted hover:text-white transition-colors">✕</button>
                    </div>
                )}
                <div className={`mx-auto max-w-4xl flex items-center gap-2 bg-campus-dark/95 backdrop-blur-2xl border border-white/[0.08] p-1.5 ${replyTo ? 'rounded-b-2xl' : 'rounded-2xl'} shadow-lg group focus-within:border-brand-500/50 transition-all`}>
                    <button className="p-2.5 hover:bg-white/5 rounded-xl text-campus-muted hover:text-white transition-colors">
                        <Paperclip size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 px-1 placeholder:text-campus-muted/50"
                        />
                    </div>
                    {newMessage.trim() ? (
                        <button onClick={handleSend} className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all active:scale-90 shadow-glow">
                            <Send size={18} />
                        </button>
                    ) : (
                        <div className="flex items-center mr-1">
                            <button className="p-2.5 hover:bg-white/5 rounded-xl text-campus-muted hover:text-white transition-colors">
                                <Mic size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
