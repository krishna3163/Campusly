import { useState, useEffect, useRef } from 'react';
import { SwipeReply } from '../../components/gesture/SwipeReply';
import { VoiceGestureRecorder } from '../../components/gesture/VoiceGestureRecorder';
import { BottomSheet, BottomSheetItem } from '../../components/ui/BottomSheet';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { Message, UserProfile, Conversation, ChannelSettings as ChannelSettingsType } from '../../types';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { FriendService } from '../../services/friendService';
import { ConversationService } from '../../services/conversationService';
import { GroupService } from '../../services/GroupService';
import { WhatsappService } from '../../services/whatsappService';
import { useAppStore } from '../../stores/appStore';
import ViewOnceMedia from '../../components/chat/ViewOnceMedia';
import ExpiredMedia from '../../components/chat/ExpiredMedia';
import {
    Send,
    Paperclip,
    X,
    Star,
    Search,
    Plus,
    ShieldX,
    ArrowLeft,
    CheckCheck,
    AlertTriangle,
    Info,
    Camera as CameraIcon,
    BarChart2,
    VolumeX,
    Phone,
    Video,
    Sparkles,
    MessageCircle,
    Smile,
    MoreVertical,
    Reply,
    Copy,
    Trash,
    Edit3,
    Heart,
    ThumbsUp,
    ThumbsDown,
    ChevronRight,
} from 'lucide-react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';



export default function ChatPage() {
    const { chatId } = useParams<{ chatId: string }>();
    const { user } = useUser();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
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
    const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
    const [showReactionPickerFor, setShowReactionPickerFor] = useState<string | null>(null);
    const [infoTab, setInfoTab] = useState<'info' | 'media' | 'docs' | 'links'>('info');
    const [messageInfoId, setMessageInfoId] = useState<string | null>(null);
    const [otherUserId, setOtherUserId] = useState<string | null>(null);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [isAdmin, setIsAdmin] = useState(false);
    const [slowModeTime, setSlowModeTime] = useState(0);
    const longPressTimerRef = useRef<any>(null);
    const slowModeIntervalRef = useRef<any>(null);
    const [disappearingTimer, setDisappearingTimer] = useState<number | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isViewOnce, setIsViewOnce] = useState(false);
    const [isSending] = useState(false);
    const [friendship, setFriendship] = useState('none');
    const [permissions, setPermissions] = useState<string[]>([]);
    const [channelSettings, setChannelSettings] = useState<ChannelSettingsType | null>(null);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { showToast } = useAppStore();


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
                    setConversation(conv as Conversation);
                    setChatName(conv.name || '');
                    setChatAvatar(conv.avatar_url || '');
                    setDisappearingTimer(conv.disappearing_timer || null);

                    const myMember = conv.members?.find((m: any) => m.user_id === user?.id);
                    setIsMuted(myMember?.muted || false);

                    if ((conv as any).type === 'private') {
                        const { data: members } = await insforge.database
                            .from('conversation_members')
                            .select('user_id')
                            .eq('conversation_id', chatId)
                            .neq('user_id', user.id);

                        if (members?.[0]) {
                            const uid = (members[0] as any).user_id;
                            setOtherUserId(uid);
                            const status = await FriendService.getFriendshipStatus(user.id, uid);
                            setFriendship(status);
                            const { data: profile } = await insforge.database
                                .from('profiles')
                                .select('*')
                                .eq('id', uid)
                                .single();

                            if (profile) {
                                setChatName((profile as UserProfile).display_name);
                                setChatAvatar((profile as UserProfile).avatar_url || '');
                                setIsOnline(true);
                            }
                        }
                    } else {
                        setOtherUserId(null);
                        setFriendship('friends');
                        setChatName((conv as any).name || 'Conversation');
                        setChatAvatar((conv as any).avatar_url || '');

                        // Check permissions
                        const { data: member } = await insforge.database
                            .from('conversation_members')
                            .select('role, permissions')
                            .eq('conversation_id', chatId)
                            .eq('user_id', user.id)
                            .single();

                        if (member) {
                            const rolePerms = ConversationService.getRolePermissions(member.role);
                            const allPerms = [...new Set([...rolePerms, ...(member.permissions || [])])];
                            setPermissions(allPerms);
                            setIsAdmin(['owner', 'admin', 'moderator'].includes(member.role));
                        }

                        if ((conv as any).type === 'channel') {
                            const settings = await ConversationService.getChannelSettings(chatId);
                            setChannelSettings(settings);
                        }
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
        if (!newMessage.trim() || !chatId || !user?.id || isSending) return;

        if (slowModeTime > 0) return;

        if (conversation?.type === 'channel' && !isAdmin) {
            alert('Only admins can post here');
            return;
        }

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

    const sendMessage = async (content: string, type: 'text' | 'image' | 'video' | 'document' | 'audio' | 'voice_note' | 'poll' = 'text', mediaUrl?: string) => {
        if (!chatId || !user?.id) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            conversation_id: chatId,
            sender_id: user.id,
            content: content.trim(),
            type,
            media_url: mediaUrl,
            is_view_once: isViewOnce,
            is_viewed: false,
            reply_to: replyTo?.id,
            created_at: new Date().toISOString(),
            status: 'sending',
            sender: {
                id: user.id,
                display_name: user?.profile?.display_name || 'You',
                avatar_url: user?.profile?.avatar_url
            }
        };

        // Optimistic update
        setMessages(prev => [...prev, optimisticMsg as any]);
        setNewMessage('');
        setReplyTo(null);
        setIsViewOnce(false);
        setTimeout(() => scrollToBottom(), 50);

        try {
            const { data, error } = await insforge.database
                .from('messages')
                .insert({
                    conversation_id: chatId,
                    sender_id: user.id,
                    content: content.trim(),
                    type,
                    media_url: mediaUrl,
                    is_view_once: isViewOnce,
                    is_viewed: false,
                    reply_to: replyTo?.id,
                    encryption_type: 'campusly_v1',
                    reactions: {}
                })
                .select()
                .single();

            if (data) {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...data, sender: optimisticMsg.sender, status: 'sent' } : m));

                if (conversation?.slow_mode_delay && !isAdmin) {
                    setSlowModeTime(conversation.slow_mode_delay);
                }
            } else if (error) {
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        const msg = messages.find(m => m.id === messageId);
        if (!msg || !user?.id) return;

        const currentReactions = msg.reactions || {};
        const userReactions = currentReactions[emoji] || [];

        let newReactions = { ...currentReactions };
        if (userReactions.includes(user.id)) {
            newReactions[emoji] = userReactions.filter(id => id !== user.id);
            if (newReactions[emoji].length === 0) delete newReactions[emoji];
        } else {
            // Remove user from any other emoji if they can only react once (common in iMessage)
            Object.keys(newReactions).forEach(key => {
                newReactions[key] = newReactions[key].filter(id => id !== user.id);
                if (newReactions[key].length === 0) delete newReactions[key];
            });
            newReactions[emoji] = [...userReactions, user.id];
        }

        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: newReactions } : m));
        setShowReactionPickerFor(null);

        const { error } = await insforge.database.from('messages').update({ reactions: newReactions }).eq('id', messageId);
        if (error) {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: currentReactions } : m));
        }
    };

    const toggleStar = async (messageId: string) => {
        const msg = messages.find(m => m.id === messageId);
        if (!msg || !user?.id) return;

        const currentStarredBy = msg.starred_by || [];
        const isStarred = currentStarredBy.includes(user.id);
        const newStarredBy = isStarred
            ? currentStarredBy.filter(id => id !== user.id)
            : [...currentStarredBy, user.id];

        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, starred_by: newStarredBy } : m));
        setOpenMessageMenuId(null);

        const { error } = await insforge.database.from('messages').update({ starred_by: newStarredBy }).eq('id', messageId);
        if (error) {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, starred_by: currentStarredBy } : m));
            showToast('Failed to star message', 'error');
        }
    };

    const deleteMessage = async (messageId: string, everyone = false) => {
        if (everyone && !window.confirm('Delete for everyone?')) return;

        setMessages(prev => prev.filter(m => m.id !== messageId));
        setOpenMessageMenuId(null);

        if (everyone) {
            await insforge.database.from('messages').update({ is_deleted: true, content: 'Message deleted' }).eq('id', messageId);
        } else {
            showToast('Message removed', 'info');
        }
    };

    const toggleDisappearingMessages = async (timer: number | null) => {
        if (!chatId) return;
        setDisappearingTimer(timer);
        const { error } = await ConversationService.setDisappearingMessages(chatId, timer);
        if (error) showToast('Failed to update timer', 'error');
        else showToast(timer ? `Messages will disappear after ${timer}s` : 'Disappearing messages off', 'info');
    };

    const toggleMute = async () => {
        if (!chatId || !user?.id) return;
        const newState = !isMuted;
        setIsMuted(newState);
        const { error } = await ConversationService.muteNotifications(chatId, user.id, newState ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null);
        if (error) setIsMuted(!newState);
        else showToast(newState ? 'Notifications muted' : 'Notifications unmuted', 'info');
    };

    useEffect(() => {
        if (slowModeTime > 0) {
            slowModeIntervalRef.current = setInterval(() => {
                setSlowModeTime((prev) => prev - 1);
            }, 1000);
        } else if (slowModeIntervalRef.current) {
            clearInterval(slowModeIntervalRef.current);
        }
        return () => { if (slowModeIntervalRef.current) clearInterval(slowModeIntervalRef.current); };
    }, [slowModeTime]);

    const handleMediaViewed = async (messageId: string) => {
        const timestamp = new Date().toISOString();
        const { error } = await insforge.database
            .from('messages')
            .update({
                is_viewed: true,
                view_timestamp: timestamp
            })
            .eq('id', messageId);

        if (!error) {
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, is_viewed: true, view_timestamp: timestamp } : m
            ));
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

    const clearChat = async () => {
        if (!chatId || !user?.id) return;
        if (!window.confirm('Clear all messages for you? Server history will be preserved.')) return;
        const { error } = await ConversationService.clearChat(chatId, user.id);
        if (!error) {
            setMessages([]);
            showToast('Messages cleared locally.', 'success');
        } else {
            showToast('Failed to clear chat.', 'error');
        }
    };

    const deleteChat = async () => {
        if (!chatId || !user?.id) return;
        if (!window.confirm('Delete this conversation? It will be archived or removed.')) return;

        // Archive first
        await ConversationService.archiveConversation(chatId, user.id, true);

        // If private, we just archive. If group, we leave.
        if (conversation?.type !== 'private') {
            const { error } = await ConversationService.leaveConversation(chatId, user.id);
            if (error) {
                showToast('Failed to leave group.', 'error');
                return;
            }
        }

        showToast('Chat removed from active list.', 'success');
        navigate('/app/chats');
    };

    const triggerCall = (type: 'audio' | 'video') => {
        if (!otherUserId) return;
        window.dispatchEvent(new CustomEvent('campusly-call-action', {
            detail: { action: 'start-call', targetId: otherUserId, type }
        }));
    };

    const handlePostPoll = async () => {
        if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
            alert('Ask a question and provide at least 2 options.');
            return;
        }
        await sendMessage(pollQuestion, 'poll');
        setShowPollModal(false);
        setPollQuestion('');
        setPollOptions(['', '']);
    };

    const handleVibeCheck = async () => {
        if (!chatId || !user?.id) return;
        try {
            const campusId = (user?.profile as any)?.campus_id || null;
            await GroupService.createVibeCheck(chatId, user.id, campusId);
            showToast('Mesh Protocol: Vibe Check triggered.', 'info');
        } catch (err: any) {
            showToast('Protocol rejection.', 'error');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-white relative overflow-hidden font-sans">
            {/* iOS Header */}
            <header className="ios-header safe-top px-3 py-2 h-[44px]">
                <button onClick={() => navigate('/app/chats')} className="ios-btn-blue flex items-center gap-1">
                    <ArrowLeft size={22} strokeWidth={2.5} />
                    {/* <span className="text-[17px]">Messages</span> */}
                </button>

                <div className="flex flex-col items-center cursor-pointer" onClick={() => setIsInfoOpen(true)}>
                    <div className="w-8 h-8 rounded-full bg-[#F2F2F7] overflow-hidden border border-black/5">
                        {chatAvatar ? (
                            <img src={chatAvatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-[#E5E5EA] text-[#8E8E93]">
                                {chatName?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <h2 className="text-[11px] font-semibold text-black mt-0.5 leading-none">{chatName}</h2>
                </div>

                <div className="flex items-center gap-4">
                    {otherUserId && (
                        <>
                            <Video size={20} strokeWidth={1.5} className="text-[#007AFF] cursor-pointer" onClick={() => triggerCall('video')} />
                            <Phone size={20} strokeWidth={1.5} className="text-[#007AFF] cursor-pointer" onClick={() => triggerCall('audio')} />
                        </>
                    )}
                    <Info size={20} strokeWidth={1.5} className="text-[#007AFF] cursor-pointer" onClick={() => setIsInfoOpen(true)} />
                </div>
            </header>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 relative z-10 no-scrollbar bg-white">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 px-8">
                        <MessageCircle size={48} className="mb-4 text-[#8E8E93]" />
                        <h3 className="text-[17px] font-bold text-black">iMessage</h3>
                        <p className="text-[13px] mt-1 text-[#8E8E93]">End-to-End Encrypted</p>
                    </div>
                ) : (
                    (() => {
                        const filteredMessages = messages.filter(m => !searchQuery || m.content?.toLowerCase().includes(searchQuery.toLowerCase()));
                        const groups: { date: string, messages: Message[] }[] = [];

                        filteredMessages.forEach((msg) => {
                            const date = new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
                            const lastGroup = groups[groups.length - 1];
                            if (lastGroup && lastGroup.date === date) {
                                lastGroup.messages.push(msg);
                            } else {
                                groups.push({ date, messages: [msg] });
                            }
                        });

                        return groups.map((group) => (
                            <div key={group.date} className="flex flex-col gap-1">
                                <div className="text-center my-6">
                                    <span className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">{group.date}</span>
                                </div>
                                {group.messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === user?.id;
                                    const nextMsg = group.messages[idx + 1];
                                    const prevMsg = group.messages[idx - 1];

                                    const isLastInSequence = !nextMsg || nextMsg.sender_id !== msg.sender_id;
                                    const isFirstInSequence = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                                    const showAvatar = !isMe && isLastInSequence;

                                    // Bubble style logic
                                    let bubbleClass = isMe ? 'bubble-sent' : 'bubble-received';
                                    if (!isLastInSequence) {
                                        bubbleClass = isMe ? 'bubble-sent-no-tail' : 'bubble-received-no-tail';
                                    }

                                    const isMenuOpen = openMessageMenuId === msg.id;
                                    const isReactionOpen = showReactionPickerFor === msg.id;

                                    return (
                                        <div key={msg.id} className="relative">
                                            <SwipeReply onReply={() => setReplyTo(msg)}>
                                                <div
                                                    className={`flex items-end gap-2 ${isLastInSequence ? 'mb-2' : 'mb-0.5'} ${isMe ? 'justify-end' : 'justify-start'}`}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setOpenMessageMenuId(msg.id);
                                                    }}
                                                >
                                                    {!isMe && (
                                                        <div className={`w-7 h-7 rounded-full bg-[#F2F2F7] overflow-hidden flex-shrink-0 ${!showAvatar ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                                                            {msg.sender?.avatar_url ? (
                                                                <img src={msg.sender.avatar_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-[#E5E5EA] text-[#8E8E93]">
                                                                    {msg.sender?.display_name?.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%]`}>
                                                        {isFirstInSequence && !isMe && conversation?.type !== 'private' && (
                                                            <span className="text-[11px] font-medium text-[#8E8E93] ml-3 mb-0.5">
                                                                {msg.sender?.display_name}
                                                            </span>
                                                        )}
                                                        <div
                                                            className={`${bubbleClass} relative group transition-all duration-200 ${isMenuOpen || isReactionOpen ? 'scale-[1.02] shadow-xl z-20' : ''}`}
                                                            onClick={() => (isMenuOpen || isReactionOpen) ? (setOpenMessageMenuId(null), setShowReactionPickerFor(null)) : null}
                                                        >
                                                            {msg.reply_to && (
                                                                <div className="mb-2 p-2 bg-black/5 rounded-lg border-l-2 border-current opacity-60 text-[13px] truncate">
                                                                    {messages.find(m => m.id === msg.reply_to)?.content || 'Original message'}
                                                                </div>
                                                            )}
                                                            {msg.is_view_once ? (
                                                                msg.is_viewed ? (
                                                                    <ExpiredMedia type={msg.type as 'image' | 'video'} />
                                                                ) : (
                                                                    <ViewOnceMedia
                                                                        url={msg.media_url!}
                                                                        type={msg.type as 'image' | 'video'}
                                                                        onViewed={() => handleMediaViewed(msg.id)}
                                                                    />
                                                                )
                                                            ) : (
                                                                <>
                                                                    {msg.type === 'image' && msg.media_url && (
                                                                        <img src={msg.media_url} className="rounded-xl mb-1 max-h-80 object-cover w-full cursor-pointer shadow-sm hover:opacity-95 transition-opacity" onClick={() => window.open(msg.media_url, '_blank')} />
                                                                    )}
                                                                    {msg.type === 'video' && msg.media_url && (
                                                                        <video src={msg.media_url} controls className="rounded-xl mb-1 max-h-80 object-cover w-full shadow-sm" />
                                                                    )}
                                                                    {(msg.type === 'voice_note' || msg.type === 'audio') && (
                                                                        <VoiceNotePlayer content={msg.content} isMe={isMe} />
                                                                    )}
                                                                </>
                                                            )}
                                                            {msg.type !== 'voice_note' && msg.type !== 'audio' && (
                                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                            )}

                                                            {/* Reactions display */}
                                                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                                <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex gap-1 bg-white shadow-md rounded-full px-2 py-0.5 border border-[#E5E5EA] z-10 animate-slide-up`}>
                                                                    {Object.entries(msg.reactions).map(([emoji, users]: [string, any]) => (
                                                                        users.length > 0 && (
                                                                            <span key={emoji} className="text-[12px] flex items-center gap-1">
                                                                                {emoji} <span className="text-[10px] text-[#8E8E93]">{users.length}</span>
                                                                            </span>
                                                                        )
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {msg.is_edited && (
                                                                <span className="text-[9px] opacity-50 block text-right mt-1 italic">edited</span>
                                                            )}
                                                        </div>

                                                        {isLastInSequence && isMe && idx === group.messages.length - 1 && (
                                                            <span className="text-[11px] text-[#8E8E93] mt-1 mr-1 transition-all animate-fade-in">
                                                                {msg.status === 'sending' ? 'Sending...' : msg.status === 'error' ? 'Not Delivered' : 'Delivered'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </SwipeReply>

                                            {/* Quick Reaction Bar (Tap/Long Press) */}
                                            {isMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" onClick={() => setOpenMessageMenuId(null)} />
                                                    <div className={`absolute z-50 ${isMe ? 'right-0' : 'left-8'} -top-12 animate-slide-up`}>
                                                        <div className="bg-white/90 backdrop-blur-xl border border-[#E5E5EA] rounded-full p-1.5 flex gap-1.5 shadow-2xl">
                                                            {['❤️', '👍', '👎', '😂', '‼️', '❓'].map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => handleReaction(msg.id, emoji)}
                                                                    className="w-9 h-9 flex items-center justify-center text-xl hover:bg-[#F2F2F7] rounded-full transition-colors active:scale-125"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                            <button
                                                                onClick={() => { setShowReactionPickerFor(msg.id); setOpenMessageMenuId(null); }}
                                                                className="w-9 h-9 flex items-center justify-center text-[#8E8E93] hover:bg-[#F2F2F7] rounded-full"
                                                            >
                                                                <Plus size={20} />
                                                            </button>
                                                        </div>

                                                        {/* Context Actions */}
                                                        <div className={`mt-3 bg-white/95 backdrop-blur-xl border border-[#E5E5EA] rounded-2xl shadow-2xl overflow-hidden divide-y divide-[#F2F2F7] min-w-[180px] ${isMe ? 'ml-auto' : ''}`}>
                                                            <button onClick={() => setReplyTo(msg)} className="w-full flex items-center justify-between px-4 py-3 text-[15px] hover:bg-[#F2F2F7] active:bg-[#E5E5EA] transition-colors">
                                                                <span>Reply</span>
                                                                <Reply size={18} className="text-[#007AFF]" />
                                                            </button>
                                                            {isMe && (
                                                                <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.content || ''); setOpenMessageMenuId(null); }} className="w-full flex items-center justify-between px-4 py-3 text-[15px] hover:bg-[#F2F2F7] active:bg-[#E5E5EA] transition-colors">
                                                                    <span>Edit</span>
                                                                    <Edit3 size={18} className="text-[#007AFF]" />
                                                                </button>
                                                            )}
                                                            <button onClick={() => { navigator.clipboard.writeText(msg.content || ''); setOpenMessageMenuId(null); showToast('Copied to clipboard', 'info'); }} className="w-full flex items-center justify-between px-4 py-3 text-[15px] hover:bg-[#F2F2F7] active:bg-[#E5E5EA] transition-colors">
                                                                <span>Copy</span>
                                                                <Copy size={18} className="text-[#007AFF]" />
                                                            </button>
                                                            <button onClick={() => toggleStar(msg.id)} className="w-full flex items-center justify-between px-4 py-3 text-[15px] hover:bg-[#F2F2F7] active:bg-[#E5E5EA] transition-colors">
                                                                <span>{msg.starred_by?.includes(user?.id || '') ? 'Unstar' : 'Star'}</span>
                                                                <Star size={18} className={msg.starred_by?.includes(user?.id || '') ? 'text-yellow-400 fill-yellow-400' : 'text-[#8E8E93]'} />
                                                            </button>
                                                            <button onClick={() => deleteMessage(msg.id, isMe)} className="w-full flex items-center justify-between px-4 py-3 text-[15px] text-[#FF3B30] hover:bg-[#FF3B30]/5 active:bg-[#FF3B30]/10 transition-colors">
                                                                <span>Delete</span>
                                                                <Trash size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ));
                    })()
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* iOS Input Bar */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-[#E5E5EA] p-2 safe-bottom">
                {replyTo && (
                    <div className="mx-2 mb-2 p-3 bg-[#F2F2F7] rounded-2xl border-l-4 border-[#007AFF] flex justify-between items-center group animate-slide-up">
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-[#007AFF] uppercase mb-0.5">Replying to {replyTo.sender?.display_name}</p>
                            <p className="text-[13px] text-[#8E8E93] truncate">{replyTo.content}</p>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-black/5 rounded-full"><X size={14} /></button>
                    </div>
                )}

                <div className="flex items-center gap-2 px-2">
                    <div className="relative">
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 text-[#007AFF] active:opacity-50">
                            <Smile size={28} strokeWidth={1.5} />
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute bottom-12 left-0 z-[60] shadow-2xl animate-slide-up">
                                <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                                <div className="relative">
                                    {(() => {
                                        try {
                                            const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
                                            return (
                                                <EmojiPicker
                                                    onEmojiClick={(emojiData) => {
                                                        setNewMessage(prev => prev + emojiData.emoji);
                                                        setShowEmojiPicker(false);
                                                        inputRef.current?.focus();
                                                    }}
                                                    autoFocusSearch={false}
                                                    theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                                                    width={320}
                                                    height={400}
                                                />
                                            );
                                        } catch {
                                            return (
                                                <div className="w-[320px] h-[400px] bg-white rounded-2xl border border-[#E5E5EA] p-4 overflow-y-auto">
                                                    <p className="text-[13px] text-[#8E8E93] mb-3">Quick Emojis</p>
                                                    <div className="grid grid-cols-8 gap-2">
                                                        {['😀', '😂', '🥰', '😎', '🤔', '👍', '❤️', '🔥', '🎉', '💯', '😭', '🙏', '✨', '😊', '🤣', '😍', '💪', '👏', '🙌', '😘', '🥳', '😤', '🤝', '💀', '😈', '🫡', '🤗', '😇'].map(e => (
                                                            <button
                                                                key={e}
                                                                onClick={() => { setNewMessage(prev => prev + e); setShowEmojiPicker(false); }}
                                                                className="text-2xl hover:bg-[#F2F2F7] rounded-lg p-1 active:scale-125 transition-transform"
                                                            >
                                                                {e}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={() => fileInputRef.current?.click()} className="p-1 text-[#007AFF] active:opacity-50">
                        <Plus size={28} strokeWidth={1.5} />
                    </button>

                    <div className="flex-1 relative flex items-center bg-[#F2F2F7] border border-[#E5E5EA] rounded-[20px] px-3 py-1.5 focus-within:bg-white transition-all">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={editingMessage ? "Edit message" : "iMessage"}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            className="w-full bg-transparent outline-none text-[17px] text-black placeholder:text-[#BBB]"
                        />
                        {editingMessage && (
                            <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="mr-2 text-[#8E8E93]">
                                <X size={18} />
                            </button>
                        )}
                        {newMessage.trim() ? (
                            <button onClick={handleSend} className="bg-[#007AFF] text-white p-1 rounded-full ml-1 active:opacity-70 transition-opacity">
                                <Send size={18} strokeWidth={3} fill="currentColor" />
                            </button>
                        ) : (
                            <div className="text-[#8E8E93] ml-1">
                                <VoiceGestureRecorder onStart={() => { }} onCancel={() => { }} onLock={() => { }} onSend={() => sendMessage('Sent a voice note', 'voice_note')} />
                            </div>
                        )}
                    </div>

                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                    {!newMessage.trim() && (
                        <button onClick={() => navigate('/app/status', { state: { openCamera: true } })} className="p-1 text-[#007AFF] active:opacity-50">
                            <CameraIcon size={26} strokeWidth={1.5} />
                        </button>
                    )}
                </div>
            </div>

            {/* Info Drawer (iOS Sheet Style) */}
            {isInfoOpen && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in flex items-end justify-center" onClick={() => setIsInfoOpen(false)}>
                    <div className="w-full max-w-[430px] bg-[#F2F2F7] rounded-t-[20px] pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1.5 bg-[#BCBCC0] rounded-full mx-auto my-3" />
                        <div className="px-5 py-4 flex justify-between items-center bg-white border-b border-[#E5E5EA]">
                            <h3 className="text-[17px] font-bold">Details</h3>
                            <button onClick={() => setIsInfoOpen(false)} className="ios-btn-blue text-[17px] font-semibold">Done</button>
                        </div>

                        <div className="mt-8 px-4 text-center">
                            <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-white shadow-sm overflow-hidden flex items-center justify-center border border-[#E5E5EA]">
                                {chatAvatar ? <img src={chatAvatar} className="w-full h-full object-cover" /> : <div className="text-3xl font-bold text-[#8E8E93]">{chatName?.charAt(0)}</div>}
                            </div>
                            <h4 className="text-[20px] font-bold">{chatName}</h4>
                        </div>

                        {/* Search in Chat */}
                        <div className="mt-6 px-4">
                            <div className="ios-search-bar !mx-0">
                                <Search size={18} className="text-[#8E8E93]" />
                                <input
                                    type="text"
                                    placeholder="Search in Conversation"
                                    className="ios-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-8 bg-white border-y border-[#E5E5EA] divide-y divide-[#E5E5EA]">
                            <button className="w-full flex items-center justify-between p-4 px-6 text-[17px] active:bg-[#F2F2F7] transition-colors">
                                <span className="text-black">Media, Links, and Docs</span>
                                <div className="flex items-center gap-1 text-[#8E8E93]">
                                    <span>{messages.filter(m => m.type === 'image' || m.type === 'video').length}</span>
                                    <ChevronRight size={20} />
                                </div>
                            </button>
                            <button className="w-full flex items-center justify-between p-4 px-6 text-[17px] active:bg-[#F2F2F7] transition-colors">
                                <span className="text-black">Starred Messages</span>
                                <div className="flex items-center gap-1 text-[#8E8E93]">
                                    <span>{messages.filter(m => m.starred_by?.includes(user?.id || '')).length}</span>
                                    <ChevronRight size={20} />
                                </div>
                            </button>
                            <div className="p-4 px-6 flex items-center justify-between text-[17px]">
                                <span className="text-black">Disappearing Messages</span>
                                <select
                                    value={disappearingTimer || 0}
                                    onChange={(e) => toggleDisappearingMessages(e.target.value === '0' ? null : parseInt(e.target.value))}
                                    className="bg-transparent text-[#007AFF] outline-none text-right font-medium"
                                >
                                    <option value="0">Off</option>
                                    <option value="86400">24 Hours</option>
                                    <option value="604800">7 Days</option>
                                    <option value="7776000">90 Days</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 bg-white border-y border-[#E5E5EA] divide-y divide-[#E5E5EA]">
                            <button onClick={toggleMute} className="w-full flex items-center justify-between p-4 px-6 text-[17px] active:bg-[#F2F2F7] transition-colors">
                                <span className="text-black">{isMuted ? 'Unmute' : 'Mute'}</span>
                                <span className="text-[#8E8E93]">{isMuted ? 'On' : 'Off'}</span>
                            </button>
                            <button className="w-full flex items-center justify-between p-4 px-6 text-[17px] active:bg-[#F2F2F7] transition-colors">
                                <span className="text-black">Save to Camera Roll</span>
                                <span className="text-[#8E8E93]">Always</span>
                            </button>
                        </div>

                        {(conversation?.type === 'group' || conversation?.type === 'channel') && (
                            <div className="mt-8 bg-white border-y border-[#E5E5EA]">
                                <button onClick={() => navigate(`/app/chats/${chatId}/settings`)} className="w-full flex items-center justify-between p-4 px-6 text-[17px] text-[#007AFF] font-medium active:bg-[#F2F2F7] transition-colors">
                                    <span>Group Settings</span>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        <div className="mt-8 bg-white border-y border-[#E5E5EA]">
                            <button onClick={clearChat} className="w-full text-left p-4 px-6 text-[17px] text-[#FF3B30] active:bg-[#F2F2F7]">
                                Clear Chat History
                            </button>
                        </div>

                        <div className="mt-8 bg-white border-y border-[#E5E5EA]">
                            <button onClick={deleteChat} className="w-full text-left p-4 px-6 text-[17px] text-[#FF3B30] active:bg-[#F2F2F7]">
                                Delete Conversation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function VoiceNotePlayer({ content, isMe }: { content?: string; isMe: boolean }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<any>(null);
    const duration = 12; // simulated seconds

    const togglePlay = () => {
        if (isPlaying) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            timerRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timerRef.current);
                        setIsPlaying(false);
                        return 0;
                    }
                    return prev + (100 / (duration * 10));
                });
            }, 100);
        }
    };

    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    return (
        <div className="flex items-center gap-3 min-w-[180px] py-1">
            <button
                onClick={togglePlay}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 ${isMe ? 'bg-white/20 text-white' : 'bg-[#007AFF]/15 text-[#007AFF]'}`}
            >
                {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="1" width="4" height="12" rx="1" /><rect x="9" y="1" width="4" height="12" rx="1" /></svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><polygon points="2,0 14,7 2,14" /></svg>
                )}
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 h-5">
                    {Array.from({ length: 20 }).map((_, i) => {
                        const h = [0.3, 0.5, 0.8, 0.4, 1, 0.6, 0.9, 0.3, 0.7, 0.5, 0.8, 0.4, 1, 0.6, 0.3, 0.7, 0.5, 0.9, 0.4, 0.6][i];
                        const filled = (i / 20) * 100 <= progress;
                        return (
                            <div
                                key={i}
                                className="flex-1 rounded-full transition-all duration-75"
                                style={{
                                    height: `${h * 100}%`,
                                    backgroundColor: filled
                                        ? (isMe ? 'rgba(255,255,255,0.9)' : '#007AFF')
                                        : (isMe ? 'rgba(255,255,255,0.3)' : '#C7C7CC')
                                }}
                            />
                        );
                    })}
                </div>
                <span className={`text-[11px] mt-0.5 block ${isMe ? 'text-white/60' : 'text-[#8E8E93]'}`}>
                    {isPlaying ? fmt((progress / 100) * duration) : fmt(duration)}
                </span>
            </div>
        </div>
    );
}
