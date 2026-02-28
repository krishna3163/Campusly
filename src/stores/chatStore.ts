import { create } from 'zustand';
import type { Conversation, Message } from '../types';

interface ChatState {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: Message[];
    typingUsers: { userId: string; displayName: string }[];
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;

    setConversations: (conversations: Conversation[]) => void;
    setActiveConversation: (conversation: Conversation | null) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    updateMessage: (id: string, updates: Partial<Message>) => void;
    setTypingUsers: (users: ChatState['typingUsers']) => void;
    setLoadingConversations: (loading: boolean) => void;
    setLoadingMessages: (loading: boolean) => void;
    updateConversationLastMessage: (conversationId: string, message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    typingUsers: [],
    isLoadingConversations: false,
    isLoadingMessages: false,

    setConversations: (conversations) => set({ conversations }),
    setActiveConversation: (activeConversation) => set({ activeConversation }),
    setMessages: (messages) => set({ messages }),

    addMessage: (message) => {
        const { messages } = get();
        // Prevent duplicates
        if (messages.some((m) => m.id === message.id)) return;
        set({ messages: [...messages, message] });
    },

    updateMessage: (id, updates) => {
        const { messages } = get();
        set({
            messages: messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        });
    },

    setTypingUsers: (typingUsers) => set({ typingUsers }),
    setLoadingConversations: (isLoadingConversations) => set({ isLoadingConversations }),
    setLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

    updateConversationLastMessage: (conversationId, message) => {
        const { conversations } = get();
        set({
            conversations: conversations
                .map((c) =>
                    c.id === conversationId
                        ? { ...c, last_message: message, updated_at: message.created_at }
                        : c
                )
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
        });
    },
}));
