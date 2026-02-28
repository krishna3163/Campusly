// ===================================================================
// Campusly v3.0 — Message Reaction Service
// Handles adding, removing, and batching reactions for realtime sync.
// Local-first: optimistic UI updates, background sync to server.
// ===================================================================

import { insforge } from '../lib/insforge';
// Types removed as they were unused

/**
 * Toggle a reaction on a message.
 * If the user already reacted with this emoji, remove it. Otherwise, add it.
 */
export async function toggleReaction(
    messageId: string,
    userId: string,
    emoji: string
): Promise<{ action: 'added' | 'removed'; emoji: string }> {
    // Check if reaction already exists
    const { data: existing } = await insforge.database
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .maybeSingle();

    if (existing) {
        // Remove reaction
        await insforge.database
            .from('message_reactions')
            .delete()
            .eq('id', existing.id);
        return { action: 'removed', emoji };
    } else {
        // Add reaction
        await insforge.database
            .from('message_reactions')
            .insert({
                message_id: messageId,
                user_id: userId,
                emoji,
            });
        return { action: 'added', emoji };
    }
}

/**
 * Get all reactions for a message, grouped by emoji with user lists.
 */
export async function getReactionsForMessage(
    messageId: string
): Promise<Record<string, { count: number; users: string[] }>> {
    const { data } = await insforge.database
        .from('message_reactions')
        .select('emoji, user_id')
        .eq('message_id', messageId);

    if (!data) return {};

    const grouped: Record<string, { count: number; users: string[] }> = {};
    for (const reaction of data) {
        if (!grouped[reaction.emoji]) {
            grouped[reaction.emoji] = { count: 0, users: [] };
        }
        grouped[reaction.emoji].count++;
        grouped[reaction.emoji].users.push(reaction.user_id);
    }
    return grouped;
}

/**
 * Subscribe to reaction changes for a conversation.
 * Returns an unsubscribe function.
 */
export function subscribeToReactions(
    conversationId: string,
    onReactionChange: (payload: { messageId: string; emoji: string; userId: string; action: 'INSERT' | 'DELETE' }) => void
): () => void {
    const channelName = `conversations:${conversationId}`;

    if (!insforge.realtime.isConnected) {
        insforge.realtime.connect();
    }

    insforge.realtime.subscribe(channelName);

    const handler = (payload: any) => {
        if (payload.meta?.channel === channelName) {
            onReactionChange({
                messageId: payload.message_id,
                emoji: payload.emoji,
                userId: payload.user_id,
                action: payload.action === 'DELETE' ? 'DELETE' : 'INSERT',
            });
        }
    };

    insforge.realtime.on('reaction_change', handler);

    return () => {
        insforge.realtime.unsubscribe(channelName);
        insforge.realtime.off('reaction_change', handler);
    };
}
