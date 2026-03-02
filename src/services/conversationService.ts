import { insforge } from '../lib/insforge';
import type { Conversation, ConversationMember, AdminLog, ChannelSettings, Message } from '../types';

export const ConversationService = {
    // Role & Permission Matrix
    ROLES: {
        OWNER: 'owner',
        ADMIN: 'admin',
        MODERATOR: 'moderator',
        MEMBER: 'member',
    },

    PERMISSIONS: {
        ADD_MEMBER: 'add_member',
        REMOVE_MEMBER: 'remove_member',
        PIN_MESSAGE: 'pin_message',
        DELETE_MESSAGE: 'delete_message',
        RESTRICT_USER: 'restrict_user',
        PROMOTE_ADMIN: 'promote_admin',
        EDIT_INFO: 'edit_info',
        SLOW_MODE: 'slow_mode',
        JOIN_REQUESTS: 'join_requests',
        ANONYMOUS: 'anonymous',
    },

    getRolePermissions(role: string): string[] {
        switch (role) {
            case 'owner':
                return Object.values(this.PERMISSIONS);
            case 'admin':
                return [
                    this.PERMISSIONS.ADD_MEMBER,
                    this.PERMISSIONS.REMOVE_MEMBER,
                    this.PERMISSIONS.PIN_MESSAGE,
                    this.PERMISSIONS.DELETE_MESSAGE,
                    this.PERMISSIONS.RESTRICT_USER,
                    this.PERMISSIONS.EDIT_INFO,
                    this.PERMISSIONS.SLOW_MODE,
                    this.PERMISSIONS.JOIN_REQUESTS,
                ];
            case 'moderator':
                return [
                    this.PERMISSIONS.REMOVE_MEMBER,
                    this.PERMISSIONS.PIN_MESSAGE,
                    this.PERMISSIONS.DELETE_MESSAGE,
                    this.PERMISSIONS.JOIN_REQUESTS,
                ];
            default:
                return [];
        }
    },

    async hasPermission(conversationId: string, userId: string, permission: string): Promise<boolean> {
        const { data: member } = await insforge.database
            .from('conversation_members')
            .select('role, permissions')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single();

        if (!member) return false;

        // Custom permission override
        if (member.permissions?.includes(permission)) return true;

        // Role-based permissions
        const rolePermissions = this.getRolePermissions(member.role);
        return rolePermissions.includes(permission);
    },

    // Admin Logging
    async logAdminAction(log: Omit<AdminLog, 'id' | 'created_at'>) {
        return insforge.database.from('admin_logs').insert(log);
    },

    // Join Requests
    async createJoinRequest(conversationId: string, userId: string) {
        return insforge.database.from('group_join_requests').insert({
            conversation_id: conversationId,
            user_id: userId,
            status: 'pending',
            requested_at: new Date().toISOString()
        });
    },

    async processJoinRequest(requestId: string, adminId: string, status: 'approved' | 'rejected') {
        const { data: request } = await insforge.database
            .from('group_join_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (!request) throw new Error('Request not found');

        const { error } = await insforge.database
            .from('group_join_requests')
            .update({
                status,
                processed_by: adminId,
                processed_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (!error && status === 'approved') {
            await insforge.database.from('conversation_members').insert({
                conversation_id: request.conversation_id,
                user_id: request.user_id,
                role: 'member'
            });

            // Increment member count
            await insforge.database.rpc('increment_member_count', { convo_id: request.conversation_id });
        }

        return { error };
    },

    // Channel Features
    async getChannelSettings(conversationId: string): Promise<ChannelSettings | null> {
        const { data } = await insforge.database
            .from('channel_settings')
            .select('*')
            .eq('conversation_id', conversationId)
            .single();
        return data as ChannelSettings;
    },

    // Slow Mode Logic
    async canUserPost(conversationId: string, userId: string): Promise<{ canPost: boolean; waitTime?: number }> {
        const { data: convo } = await insforge.database
            .from('conversations')
            .select('slow_mode_delay')
            .eq('id', conversationId)
            .single();

        if (!convo || !convo.slow_mode_delay) return { canPost: true };

        // Check if user is admin (admins usually bypass slow mode)
        const isAdmin = await this.hasPermission(conversationId, userId, this.PERMISSIONS.SLOW_MODE);
        if (isAdmin) return { canPost: true };

        const { data: lastMsg } = await insforge.database
            .from('messages')
            .select('created_at')
            .eq('conversation_id', conversationId)
            .eq('sender_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!lastMsg) return { canPost: true };

        const lastPostTime = new Date(lastMsg.created_at).getTime();
        const now = Date.now();
        const diff = (now - lastPostTime) / 1000;

        if (diff < convo.slow_mode_delay) {
            return { canPost: false, waitTime: Math.ceil(convo.slow_mode_delay - diff) };
        }

        return { canPost: true };
    },

    // Pins
    async pinMessage(conversationId: string, messageId: string, adminId: string) {
        const { data: currentPins } = await insforge.database
            .from('pinned_messages')
            .select('order')
            .eq('conversation_id', conversationId)
            .order('order', { ascending: false })
            .limit(1);

        const nextOrder = (currentPins?.[0]?.order ?? -1) + 1;

        return insforge.database.from('pinned_messages').insert({
            conversation_id: conversationId,
            message_id: messageId,
            pinned_by: adminId,
            order: nextOrder,
            pinned_at: new Date().toISOString()
        });
    },

    // --- NEW RECOVERY METHODS ---

    async getPrivateChat(user1Id: string, user2Id: string): Promise<string | null> {
        try {
            // Find shared conversations of type 'private'
            const { data } = await insforge.database
                .from('conversation_members')
                .select('conversation_id, conversations!inner(type)')
                .eq('user_id', user1Id)
                .eq('conversations.type', 'private');

            if (!data || data.length === 0) return null;

            const convIds = data.map(m => m.conversation_id);
            const { data: shared } = await insforge.database
                .from('conversation_members')
                .select('conversation_id')
                .in('conversation_id', convIds)
                .eq('user_id', user2Id)
                .limit(1);

            return shared?.[0]?.conversation_id || null;
        } catch (e) {
            return null;
        }
    },

    async muteNotifications(conversationId: string, userId: string, until?: string | null) {
        return insforge.database
            .from('conversation_members')
            .update({
                muted: !!until,
                muted_until: until
            })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
    },

    async archiveConversation(conversationId: string, userId: string, isArchived: boolean = true) {
        return insforge.database
            .from('conversation_members')
            .update({ is_archived: isArchived })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
    },

    async clearChat(conversationId: string, userId: string) {
        return insforge.database
            .from('conversation_members')
            .update({ cleared_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
    },

    async setDisappearingMessages(conversationId: string, timerSeconds: number | null) {
        return insforge.database
            .from('conversations')
            .update({ disappearing_timer: timerSeconds })
            .eq('id', conversationId);
    },

    async leaveConversation(conversationId: string, userId: string) {
        const { error } = await insforge.database
            .from('conversation_members')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        if (!error) {
            await insforge.database.rpc('decrement_member_count', { convo_id: conversationId });
        }
        return { error };
    }
};
