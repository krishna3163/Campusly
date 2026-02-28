// ===================================================================
// Campusly v3.0 — Scheduled Message Service
// Allows users to schedule messages for future delivery.
// Local-first: stores pending schedules in IndexedDB for offline.
// ===================================================================

import { insforge } from '../lib/insforge';
import type { ScheduledMessage } from '../types/messaging';

/**
 * Schedule a message for future delivery.
 */
export async function scheduleMessage(
    userId: string,
    conversationId: string,
    content: string,
    scheduledTime: Date,
    messageType: string = 'text',
    attachments: any[] = []
): Promise<ScheduledMessage | null> {
    const { data, error } = await insforge.database
        .from('scheduled_messages')
        .insert({
            user_id: userId,
            conversation_id: conversationId,
            content,
            message_type: messageType,
            attachments,
            scheduled_time: scheduledTime.toISOString(),
            status: 'pending',
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to schedule message:', error);
        return null;
    }

    return data as ScheduledMessage;
}

/**
 * Cancel a scheduled message.
 */
export async function cancelScheduledMessage(messageId: string, userId: string): Promise<boolean> {
    const { error } = await insforge.database
        .from('scheduled_messages')
        .update({ status: 'cancelled' })
        .eq('id', messageId)
        .eq('user_id', userId)
        .eq('status', 'pending');

    return !error;
}

/**
 * Reschedule a message to a new time.
 */
export async function rescheduleMessage(
    messageId: string,
    userId: string,
    newTime: Date
): Promise<boolean> {
    const { error } = await insforge.database
        .from('scheduled_messages')
        .update({ scheduled_time: newTime.toISOString() })
        .eq('id', messageId)
        .eq('user_id', userId)
        .eq('status', 'pending');

    return !error;
}

/**
 * Get all scheduled messages for a user.
 */
export async function getScheduledMessages(userId: string): Promise<ScheduledMessage[]> {
    const { data } = await insforge.database
        .from('scheduled_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('scheduled_time', { ascending: true });

    return (data as ScheduledMessage[]) || [];
}

/**
 * Get scheduled messages for a specific conversation.
 */
export async function getScheduledMessagesForConversation(
    userId: string,
    conversationId: string
): Promise<ScheduledMessage[]> {
    const { data } = await insforge.database
        .from('scheduled_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .eq('status', 'pending')
        .order('scheduled_time', { ascending: true });

    return (data as ScheduledMessage[]) || [];
}
