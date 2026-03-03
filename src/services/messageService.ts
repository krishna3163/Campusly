import { insforge } from '../lib/insforge';
import type { Message } from '../types';

export const MessageService = {
    async sendMessage(params: {
        conversationId: string;
        senderId: string;
        content: string;
        type?: 'text' | 'image' | 'video' | 'document' | 'audio' | 'voice_note' | 'poll';
        mediaUrl?: string;
        replyTo?: string;
        isViewOnce?: boolean;
    }) {
        const { data, error } = await insforge.database
            .from('messages')
            .insert({
                conversation_id: params.conversationId,
                sender_id: params.senderId,
                content: params.content.trim(),
                type: params.type || 'text',
                media_url: params.mediaUrl,
                is_view_once: params.isViewOnce || false,
                is_viewed: false,
                reply_to: params.replyTo,
                encryption_type: 'campusly_v1',
                reactions: {}
            })
            .select('*, sender:profiles!sender_id(*)')
            .single();

        return { data: data as Message, error };
    },

    async updateMessage(messageId: string, content: string) {
        return insforge.database
            .from('messages')
            .update({ content, is_edited: true })
            .eq('id', messageId);
    },

    async deleteMessage(messageId: string, everyone: boolean = false) {
        if (everyone) {
            return insforge.database
                .from('messages')
                .update({ is_deleted: true, content: 'Message deleted' })
                .eq('id', messageId);
        }
        // Local deletion is handled in UI state
        return { error: null };
    },

    async reactToMessage(messageId: string, userId: string, emoji: string) {
        // Fetch current reactions
        const { data: msg } = await insforge.database
            .from('messages')
            .select('reactions')
            .eq('id', messageId)
            .single();

        if (!msg) return { error: 'Message not found' };

        const currentReactions = msg.reactions || {};
        const newReactions = { ...currentReactions };

        // Clean up user from other reactions (iMessage style)
        Object.keys(newReactions).forEach(key => {
            newReactions[key] = (newReactions[key] || []).filter((id: string) => id !== userId);
            if (newReactions[key].length === 0) delete newReactions[key];
        });

        // Add new reaction if it wasn't the same one (toggle)
        if (!currentReactions[emoji]?.includes(userId)) {
            newReactions[emoji] = [...(newReactions[emoji] || []), userId];
        }

        return insforge.database
            .from('messages')
            .update({ reactions: newReactions })
            .eq('id', messageId);
    }
};
