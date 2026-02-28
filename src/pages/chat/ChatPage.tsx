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
    Reply,
    CheckCheck,
    Search,
    Info,
    MoreVertical,
    Smile,
    Trash2,
    ChevronDown,
    FileText,
    Image as ImageIcon,
    Camera as CameraIcon,
    Music,
    User,
    Calendar,
    Copy,
    Forward,
    Pin,
    Star,
    Flag,
    Link,
} from 'lucide-react';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

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
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { uploadFile, isUploading, uploads } = useMediaUpload();
    const uploading = isUploading;
    const progress = uploads[0]?.progress || 0;

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [openAttachmentMenu, setOpenAttachmentMenu] = useState(false);
    const { isRecording, formattedTime, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
    const [infoTab, setInfoTab] = useState<'info' | 'media' | 'docs' | 'links'>('info');
    const [messageInfoId, setMessageInfoId] = useState<string | null>(null);


    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
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
                    .limit(100);

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
                    setTimeout(() => scrollToBottom('auto'), 100);
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
                setTimeout(() => scrollToBottom(), 50);
            });

            insforge.realtime.on('message_update', (payload: any) => {
                setMessages(prev => prev.map(m => m.id === payload.id ? { ...m, ...payload } : m));
            });

            insforge.realtime.on('message_delete', (payload: any) => {
                setMessages(prev => prev.filter(m => m.id !== payload.id));
            });
        };
        setupRealtime();
        return () => { insforge.realtime.unsubscribe(`chat:${chatId}`); };
    }, [chatId, user?.id]);

    const handleSend = async () => {
        if (!newMessage.trim() || !chatId || !user?.id || sending) return;
        const content = newMessage.trim();

        if (editingMessage) {
            await updateMessage(editingMessage.id, content);
            setEditingMessage(null);
        } else {
            await sendMessage(content);
        }
        setNewMessage('');
    };

    const updateMessage = async (messageId: string, content: string) => {
        const { error } = await insforge.database.from('messages').update({ content, is_edited: true }).eq('id', messageId);
        if (!error) {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, is_edited: true } : m));
        }
    };

    const sendMessage = async (content: string, type: 'text' | 'image' | 'video' | 'document' | 'audio' = 'text', mediaUrl?: string) => {
        if (!chatId || !user?.id) return;
        setSending(true);
        try {
            const { data } = await insforge.database.from('messages').insert({
                conversation_id: chatId,
                sender_id: user.id,
                content,
                type,
                media_url: mediaUrl,
                reply_to: replyTo?.id
            }).select();
            setReplyTo(null);
            if (data?.[0]) {
                const newM = {
                    ...data[0],
                    sender: {
                        id: user.id,
                        display_name: user?.profile?.display_name || 'You',
                        avatar_url: user?.profile?.avatar_url
                    }
                };
                setMessages(prev => [...prev, newM as any] as Message[]);
                setTimeout(() => scrollToBottom(), 50);
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !chatId) return;

        const url = await uploadFile(file, 'chat-media');
        if (url) {
            const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'document';
            await sendMessage(file.name, type, url);
        }
    };

    const handleVoiceNoteStop = async () => {
        const file = await stopRecording();
        if (file) {
            const url = await uploadFile(file, 'chat-media');
            if (url) {
                await sendMessage('Voice note', 'audio', url);
            }
        }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        if (!user?.id) return;
        const { error } = await insforge.database.from('message_reactions').upsert({
            message_id: messageId,
            user_id: user.id,
            emoji
        });
        if (!error) {
            // Local update for immediate feedback
            setMessages(prev => prev.map(m => {
                if (m.id === messageId) {
                    const reactions = { ...(m.reactions as any) || {} };
                    reactions[emoji] = (reactions[emoji] || 0) + 1;
                    return { ...m, reactions };
                }
                return m;
            }));
        }
    };

    const deleteMessage = async (messageId: string) => {
        if (!window.confirm('Delete this message?')) return;
        await insforge.database.from('messages').delete().eq('id', messageId);
        setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const clearChat = async () => {
        if (!window.confirm('Are you sure you want to clear all messages in this chat?')) return;
        await insforge.database.from('messages').delete().eq('conversation_id', chatId);
        setMessages([]);
    };

    const deleteChat = async () => {
        if (!window.confirm('Are you sure you want to delete this chat entirely? This cannot be undone.')) return;
        await insforge.database.from('conversations').delete().eq('id', chatId);
        navigate('/app/chats');
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

                    <div className="relative group cursor-pointer" onClick={() => navigate(`/app/profile/${chatId}`)}>
                        {chatAvatar ? (
                            <img src={chatAvatar} className="w-10 h-10 rounded-full object-cover border border-white/[0.1] group-hover:scale-105 transition-transform" alt="" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">
                                {chatName.charAt(0)}
                            </div>
                        )}
                        {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-campus-dark" />}
                    </div>

                    <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/app/profile/${chatId}`)}>
                        <h2 className="font-bold text-sm truncate leading-tight group-hover:text-brand-400 transition-colors">{chatName || 'Loading Chat...'}</h2>
                        <p className="text-[10px] text-campus-muted font-medium uppercase tracking-wider">{isOnline ? 'Online now' : 'Away'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className={`p-2 rounded-xl transition-colors ${isSearchOpen ? 'bg-brand-500 text-white' : 'text-campus-muted hover:text-white hover:bg-white/5'}`}
                    >
                        <Search size={18} />
                    </button>
                    <div className="w-[1px] h-6 bg-white/[0.05] mx-1"></div>
                    <button
                        onClick={() => setIsInfoOpen(!isInfoOpen)}
                        className={`p-2 rounded-xl transition-colors ${isInfoOpen ? 'bg-brand-500 text-white' : 'text-campus-muted hover:text-white hover:bg-white/5'}`}
                    >
                        <Info size={18} />
                    </button>
                    <div className="relative group">
                        <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-campus-muted hover:text-white">
                            <MoreVertical size={18} />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-56 bg-campus-dark/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] py-1">
                            <button onClick={() => alert("Call feature coming soon")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">Call</button>
                            <button onClick={() => setIsSearchOpen(true)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">Search</button>
                            <button onClick={() => setIsInfoOpen(true)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">Contact info</button>
                            <button onClick={() => alert("Select messages")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">Select messages</button>
                            <button onClick={() => alert("Muted notifications")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">Mute notifications</button>
                            <button onClick={() => alert("Disappearing messages")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">Disappearing messages</button>
                            <button onClick={() => alert("Chat Locked")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">Lock chat</button>
                            <button onClick={() => navigate('/app/chats')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">Close chat</button>
                            <button onClick={() => alert("Reported user")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">Report</button>
                            <button onClick={() => alert("User Blocked")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">Block</button>
                            <div className="h-[1px] bg-white/[0.05] my-1 mx-2"></div>
                            <button onClick={clearChat} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                                Clear chat
                            </button>
                            <button onClick={deleteChat} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                                Delete chat
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Search Bar Inline */}
            {isSearchOpen && (
                <div className="px-4 py-2 bg-campus-dark/50 border-b border-white/[0.05] animate-slide-down flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search in conversation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-2 text-sm focus:outline-none focus:border-brand-500"
                            autoFocus
                        />
                        <Search className="absolute left-3 top-2.5 text-campus-muted" size={16} />
                    </div>
                    <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-xs text-campus-muted hover:text-white">Cancel</button>
                </div>
            )}

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
                    messages
                        .filter(m => !searchQuery || m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((msg, idx) => {
                            const isMe = msg.sender_id === user?.id;
                            const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;

                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} mb-1 animate-fade-in`}>
                                    <div
                                        className="w-8 h-8 rounded-full bg-white/5 overflow-hidden flex-shrink-0 mb-1 border border-white/[0.05] cursor-pointer"
                                        onClick={() => navigate(`/app/profile/${msg.sender_id}`)}
                                    >
                                        {showAvatar && (
                                            msg.sender?.avatar_url ? <img src={msg.sender.avatar_url} className="w-full h-full object-cover" alt="" /> :
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-white/10">{(msg.sender?.display_name as string)?.charAt(0) || 'U'}</div>
                                        )}
                                    </div>
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] lg:max-w-[60%] group relative`}>
                                        <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-campus-dark border border-white/[0.05] text-white rounded-bl-sm'
                                            }`}>
                                            {msg.reply_to && (
                                                <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-white/20 text-[11px] opacity-80 line-clamp-1">
                                                    Replying to message...
                                                </div>
                                            )}

                                            {msg.type === 'image' && msg.media_url && (
                                                <img src={msg.media_url} className="rounded-lg mb-2 max-h-64 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity" alt="" />
                                            )}
                                            {msg.type === 'video' && msg.media_url && (
                                                <video src={msg.media_url} controls className="rounded-lg mb-2 max-h-64 w-full object-cover" />
                                            )}

                                            {msg.type === 'document' && msg.media_url && (
                                                <div onClick={() => window.open(msg.media_url, '_blank')} className="flex items-center gap-3 p-3 bg-black/10 rounded-xl cursor-pointer hover:bg-black/20 transition-colors mb-2 border border-white/5">
                                                    <div className="p-2.5 bg-brand-500/20 text-brand-400 rounded-lg"><FileText size={20} /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate">{msg.content}</p>
                                                        <p className="text-[10px] text-campus-muted uppercase">Document</p>
                                                    </div>
                                                </div>
                                            )}

                                            {msg.type === 'audio' && msg.media_url && (
                                                <div className="flex items-center gap-3 p-2 bg-black/10 rounded-xl mb-2 min-w-[200px] border border-white/5">
                                                    <div className="p-2 bg-brand-500/20 text-brand-400 rounded-full shrink-0"><Mic size={16} /></div>
                                                    <audio src={msg.media_url} controls className="h-8 max-w-[200px]" />
                                                </div>
                                            )}

                                            {msg.type !== 'document' && msg.type !== 'audio' && (
                                                <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                            )}

                                            {msg.is_edited && <span className="text-[10px] opacity-40 ml-1 italic">(edited)</span>}

                                            {/* Quick Reaction Bar */}
                                            <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-[220px]' : '-right-[220px]'} hidden group-hover:flex items-center gap-1 bg-campus-dark/95 backdrop-blur-xl border border-white/10 rounded-full py-1.5 px-3 shadow-2xl z-40 animate-scale-in`}>
                                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-xl transition-transform hover:scale-125 hover:-translate-y-1">{emoji}</button>
                                                ))}
                                            </div>

                                            {/* Action Dropdown Toggle */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOpenMessageMenuId(openMessageMenuId === msg.id ? null : msg.id); }}
                                                className={`absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md rounded-full m-1 text-white shadow-xl hover:bg-black/60 z-30`}
                                            >
                                                <ChevronDown size={14} />
                                            </button>

                                            {/* Action Dropdown Menu */}
                                            {openMessageMenuId === msg.id && (
                                                <div className={`absolute top-8 ${isMe ? 'right-0' : 'left-0'} w-48 bg-campus-dark/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-1.5 animate-scale-in`}>
                                                    <button onClick={() => { setReplyTo(msg); setOpenMessageMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 flex items-center justify-between text-white transition-colors"><span>Reply</span> <Reply size={16} className="opacity-60" /></button>
                                                    <button onClick={() => { navigator.clipboard.writeText(msg.content || ''); setOpenMessageMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 flex items-center justify-between text-white transition-colors"><span>Copy</span> <Copy size={16} className="opacity-60" /></button>
                                                    <button onClick={() => { setOpenMessageMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 flex items-center justify-between text-white transition-colors"><span>React</span> <Smile size={16} className="opacity-60" /></button>
                                                    <button onClick={() => { setOpenMessageMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 flex items-center justify-between text-white transition-colors"><span>Forward</span> <Forward size={16} className="opacity-60" /></button>
                                                    <button onClick={() => { setOpenMessageMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 flex items-center justify-between text-white transition-colors"><span>Pin</span> <Pin size={16} className="opacity-60" /></button>
                                                    <button onClick={() => { setOpenMessageMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 flex items-center justify-between text-white transition-colors"><span>Star</span> <Star size={16} className="opacity-60" /></button>
                                                    <button onClick={() => { setMessageInfoId(msg.id); setOpenMessageMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 flex items-center justify-between text-white transition-colors"><span>Info</span> <Info size={16} className="opacity-60" /></button>
                                                    <button onClick={() => { setOpenMessageMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 flex items-center justify-between text-white transition-colors"><span>Report</span> <Flag size={16} className="opacity-60" /></button>
                                                    {isMe && (
                                                        <>
                                                            <div className="h-[1px] bg-white/[0.05] my-1 mx-2"></div>
                                                            <button onClick={() => { deleteMessage(msg.id); setOpenMessageMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-500 flex items-center justify-between transition-colors"><span>Delete</span> <Trash2 size={16} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1 px-1">
                                            <div className="flex items-center gap-1 opacity-40">
                                                <span className="text-[9px] font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isMe && <CheckCheck size={12} />}
                                            </div>
                                            {msg.reactions && typeof msg.reactions === 'object' && Object.keys(msg.reactions).length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    {Object.entries(msg.reactions).map(([emoji, count]) => (
                                                        <span key={emoji} className="text-[10px] bg-white/5 border border-white/10 rounded-full px-1.5 py-0.5">{emoji} {String(count)}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                )}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Wrapper — Instagram/Messenger style (floating) */}
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0 bg-transparent relative z-20">
                {replyTo && (
                    <div className="mx-auto max-w-4xl bg-campus-dark border border-white/[0.1] border-b-0 rounded-t-2xl px-4 py-2 flex items-center justify-between animate-slide-up">
                        <div className="flex items-center gap-2 min-w-0">
                            <Reply size={14} className="text-brand-400" />
                            <p className="text-xs text-campus-muted truncate">Replying to <span className="text-brand-400 font-bold">{(replyTo.sender as any)?.display_name}</span></p>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="text-campus-muted hover:text-white transition-colors">✕</button>
                    </div>
                )}
                <div className={`mx-auto max-w-4xl flex items-center gap-2 bg-campus-dark/95 backdrop-blur-2xl border border-white/[0.08] p-1.5 ${replyTo ? 'rounded-b-2xl' : 'rounded-2xl'} shadow-lg group focus-within:border-brand-500/50 transition-all`}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,video/*,.pdf,.doc,.docx"
                    />
                    <div className="relative">
                        <button
                            onClick={() => setOpenAttachmentMenu(!openAttachmentMenu)}
                            className={`p-2.5 hover:bg-white/5 rounded-xl transition-colors ${uploading ? 'animate-pulse text-brand-400' : 'text-campus-muted hover:text-white'} ${openAttachmentMenu ? 'bg-white/10 text-brand-400' : ''}`}
                            disabled={uploading}
                        >
                            <Paperclip size={20} />
                        </button>

                        {openAttachmentMenu && (
                            <div className="absolute bottom-full left-0 mb-4 w-64 bg-campus-dark border border-white/10 rounded-2xl shadow-2xl p-4 grid grid-cols-3 gap-y-6 gap-x-2 z-50 animate-slide-up">
                                <button onClick={() => { fileInputRef.current?.setAttribute('accept', '.pdf,.doc,.docx,.txt'); fileInputRef.current?.click(); setOpenAttachmentMenu(false); }} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={20} /></div>
                                    <span className="text-[10px] text-campus-muted group-hover:text-white">Document</span>
                                </button>
                                <button onClick={() => { fileInputRef.current?.removeAttribute('capture'); fileInputRef.current?.setAttribute('accept', 'image/*,video/*'); fileInputRef.current?.click(); setOpenAttachmentMenu(false); }} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform"><ImageIcon size={20} /></div>
                                    <span className="text-[10px] text-campus-muted group-hover:text-white">Gallery</span>
                                </button>
                                <button onClick={() => { fileInputRef.current?.setAttribute('capture', 'environment'); fileInputRef.current?.setAttribute('accept', 'image/*'); fileInputRef.current?.click(); setOpenAttachmentMenu(false); }} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform"><CameraIcon size={20} /></div>
                                    <span className="text-[10px] text-campus-muted group-hover:text-white">Camera</span>
                                </button>
                                <button onClick={() => { fileInputRef.current?.setAttribute('accept', 'audio/*'); fileInputRef.current?.click(); setOpenAttachmentMenu(false); }} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Music size={20} /></div>
                                    <span className="text-[10px] text-campus-muted group-hover:text-white">Audio</span>
                                </button>
                                <button onClick={() => { setOpenAttachmentMenu(false); }} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform"><User size={20} /></div>
                                    <span className="text-[10px] text-campus-muted group-hover:text-white">Contact</span>
                                </button>
                                <button onClick={() => { setOpenAttachmentMenu(false); }} className="flex flex-col items-center gap-2 group">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Calendar size={20} /></div>
                                    <span className="text-[10px] text-campus-muted group-hover:text-white">Event</span>
                                </button>
                            </div>
                        )}
                    </div>
                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between px-4 animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="font-mono font-medium text-red-500">{formattedTime}</span>
                            </div>
                            <span className="text-sm font-medium text-campus-muted animate-pulse">Recording...</span>
                        </div>
                    ) : (
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={uploading ? `Uploading... ${progress}%` : (editingMessage ? "Edit message..." : "Type a message...")}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 px-1 placeholder:text-campus-muted/50"
                                disabled={uploading}
                            />
                        </div>
                    )}

                    {newMessage.trim() ? (
                        <button onClick={handleSend} className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all active:scale-90 shadow-glow">
                            <Send size={18} />
                        </button>
                    ) : isRecording ? (
                        <div className="flex items-center gap-2">
                            <button onClick={cancelRecording} className="p-2.5 hover:bg-red-500/10 rounded-xl text-red-400 transition-colors">
                                <Trash2 size={20} />
                            </button>
                            <button onClick={handleVoiceNoteStop} className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all active:scale-90 shadow-glow">
                                <Send size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center mr-1">
                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2.5 rounded-xl transition-colors ${showEmojiPicker ? 'bg-white/10 text-brand-400' : 'text-campus-muted hover:bg-white/5 hover:text-white'}`}>
                                <Smile size={20} />
                            </button>
                            <button onClick={startRecording} className="p-2.5 hover:bg-white/5 rounded-xl text-campus-muted hover:text-white transition-colors relative group">
                                <Mic size={20} className="group-hover:text-red-400 transition-colors" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Emoji Picker Anchor */}
                {showEmojiPicker && (
                    <div className="absolute bottom-20 right-4 z-[200] animate-slide-up shadow-2xl border border-white/10 rounded-xl overflow-hidden">
                        <EmojiPicker
                            theme={Theme.DARK}
                            onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                            width={320}
                            height={400}
                        />
                    </div>
                )}
            </div>

            {/* Info Sidebar Overlay */}
            {
                isInfoOpen && (
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-campus-dark border-l border-white/10 z-30 shadow-2xl animate-slide-left flex flex-col">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <h3 className="font-bold">Chat Info</h3>
                            <button onClick={() => setIsInfoOpen(false)} className="text-campus-muted hover:text-white">✕</button>
                        </div>

                        <div className="flex border-b border-white/5 bg-black/10">
                            <button onClick={() => setInfoTab('info')} className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${infoTab === 'info' ? 'border-brand-500 text-brand-400' : 'border-transparent text-campus-muted hover:text-white'}`}>Info</button>
                            <button onClick={() => setInfoTab('media')} className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${infoTab === 'media' ? 'border-brand-500 text-brand-400' : 'border-transparent text-campus-muted hover:text-white'}`}>Media</button>
                            <button onClick={() => setInfoTab('docs')} className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${infoTab === 'docs' ? 'border-brand-500 text-brand-400' : 'border-transparent text-campus-muted hover:text-white'}`}>Docs</button>
                            <button onClick={() => setInfoTab('links')} className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${infoTab === 'links' ? 'border-brand-500 text-brand-400' : 'border-transparent text-campus-muted hover:text-white'}`}>Links</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {infoTab === 'info' && (
                                <>
                                    <div className="text-center">
                                        {chatAvatar ? (
                                            <img src={chatAvatar} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-brand-500/20 shadow-glow" alt="" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                                                {chatName.charAt(0)}
                                            </div>
                                        )}
                                        <h4 className="text-xl font-bold">{chatName}</h4>
                                        <p className="text-sm text-campus-muted">{isOnline ? 'Online' : 'Offline'}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm text-left transition-colors" onClick={() => setIsSearchOpen(true)}>
                                            <Search size={18} /> <span>Search Messages</span>
                                        </button>
                                        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm text-left transition-colors text-red-400" onClick={clearChat}>
                                            <Trash2 size={18} /> <span>Clear History</span>
                                        </button>
                                    </div>
                                </>
                            )}

                            {infoTab === 'media' && (
                                <div className="grid grid-cols-3 gap-1">
                                    {messages.filter(m => m.type === 'image' || m.type === 'video').length > 0 ? (
                                        messages.filter(m => m.type === 'image' || m.type === 'video').map(m => (
                                            <div key={m.id} className="aspect-square bg-white/5 rounded-md overflow-hidden group relative cursor-pointer" onClick={() => window.open(m.media_url, '_blank')}>
                                                {m.type === 'image' && <img src={m.media_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />}
                                                {m.type === 'video' && <video src={m.media_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                    <span className="opacity-0 group-hover:opacity-100 text-white drop-shadow-md shadow-black"><Search size={16} /></span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="col-span-3 text-center text-sm text-campus-muted py-10">No media in this chat</p>
                                    )}
                                </div>
                            )}

                            {infoTab === 'docs' && (
                                <div className="space-y-2">
                                    {messages.filter(m => m.type === 'document').length > 0 ? (
                                        messages.filter(m => m.type === 'document').map(m => (
                                            <div key={m.id} onClick={() => window.open(m.media_url, '_blank')} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                                <div className="p-2 bg-brand-500/20 text-brand-400 rounded-lg"><FileText size={16} /></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-xs truncate break-words">{m.content}</p>
                                                    <p className="text-[10px] text-campus-muted mt-0.5">{new Date(m.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-sm text-campus-muted py-10">No documents in this chat</p>
                                    )}
                                </div>
                            )}

                            {infoTab === 'links' && (
                                <div className="space-y-2">
                                    {messages.filter(m => m.content?.match(/https?:\/\/[^\s]+/)).length > 0 ? (
                                        messages.filter(m => m.content?.match(/https?:\/\/[^\s]+/)).map(m => {
                                            const url = m.content?.match(/https?:\/\/[^\s]+/)?.[0];
                                            return (
                                                <div key={m.id} onClick={() => url && window.open(url, '_blank')} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-full"><Link size={16} /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-xs truncate text-blue-400 line-clamp-2">{url}</p>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <p className="text-center text-sm text-campus-muted py-10">No links shared in this chat</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Message Info Modal */}
            {messageInfoId && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMessageInfoId(null)}>
                    <div className="w-full max-w-sm bg-campus-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-white/5 flex items-center justify-between text-white bg-white/5">
                            <h3 className="font-bold flex items-center gap-2"><Info size={18} className="text-brand-400" /> Message Info</h3>
                            <button onClick={() => setMessageInfoId(null)} className="text-campus-muted hover:text-white">✕</button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <p className="text-sm italic opacity-80 mb-2">"{messages.find(m => m.id === messageInfoId)?.content}"</p>
                                <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                                    {messages.find(m => m.id === messageInfoId)?.type || 'text'} Payload
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                    <div className="flex items-center gap-3 text-campus-muted">
                                        <CheckCheck size={18} /> <span>Read</span>
                                    </div>
                                    <span className="text-sm font-medium">{new Date(messages.find(m => m.id === messageInfoId)?.created_at || Date.now()).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                    <div className="flex items-center gap-3 text-campus-muted">
                                        <CheckCheck size={18} className="text-brand-400" /> <span>Delivered</span>
                                    </div>
                                    <span className="text-sm font-medium">{new Date(messages.find(m => m.id === messageInfoId)?.created_at || Date.now()).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                    <div className="flex items-center gap-3 text-campus-muted">
                                        <CheckCheck size={18} className="opacity-50" /> <span>Sent</span>
                                    </div>
                                    <span className="text-sm font-medium">{new Date(messages.find(m => m.id === messageInfoId)?.created_at || Date.now()).toLocaleTimeString()}</span>
                                </div>
                            </div>

                            <div className="text-center mt-6">
                                <p className="text-[10px] text-campus-muted opacity-50 flex items-center justify-center gap-1">
                                    <Pin size={10} /> AES-256 E2E Encrypted
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
