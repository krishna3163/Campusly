import { insforge } from '../lib/insforge';

export const ChannelService = {
    // --- Section 12: Create New Channel ---
    async createChannel(name: string, description: string, creatorId: string, campusId: string) {
        if (!name) throw new Error('Channel name required');

        // 1. Insert Conversation record
        const { data: channel, error: convoError } = await insforge.database
            .from('conversations')
            .insert({
                name,
                description,
                type: 'subject_channel',
                campus_id: campusId,
                created_by: creatorId,
                visibility: 'public',
                is_public: true,
                join_approval_required: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (convoError) throw convoError;

        // 2. Add creator as owner in members
        const { error: memberError } = await insforge.database
            .from('conversation_members')
            .insert({
                conversation_id: channel.id,
                user_id: creatorId,
                role: 'owner',
                joined_at: new Date().toISOString()
            });

        if (memberError) throw memberError;

        // 3. Optional: Initialize default settings if needed
        await insforge.database.from('channel_settings').insert({
            conversation_id: channel.id,
            comment_enabled: true,
            allow_reactions: true,
            updated_at: new Date().toISOString()
        });

        return channel;
    },

    async joinChannel(channelId: string, userId: string) {
        const { error } = await insforge.database
            .from('conversation_members')
            .insert({
                conversation_id: channelId,
                user_id: userId,
                role: 'member',
                joined_at: new Date().toISOString()
            });

        if (error) throw error;
        // RPC increment_subscriber_count should exist or we manually update
        await insforge.database.rpc('increment_subscriber_count', { convo_id: channelId });
    },

    async leaveChannel(channelId: string, userId: string) {
        const { error } = await insforge.database
            .from('conversation_members')
            .delete()
            .eq('conversation_id', channelId)
            .eq('user_id', userId);

        if (error) throw error;
        await insforge.database.rpc('decrement_subscriber_count', { convo_id: channelId });
    }
};
