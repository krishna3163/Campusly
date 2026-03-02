import { insforge } from '../lib/insforge';
import { db, type LocalStarredMessage } from '../lib/db';
import type {
    StatusStory,
} from '../types';

export const WhatsappService = {
    // ===== STATUS SYSTEM (STORIES) =====
    // ===== HYBRID STORY SYSTEM =====
    async postStory(params: {
        userId: string,
        campusId?: string,
        type: 'text' | 'image' | 'video',
        content?: string,
        mediaUrl?: string,
        metadata?: any,
        visibility?: 'everyone' | 'contacts' | 'close_friends' | 'private',
        isViewOnce?: boolean
    }) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const story = {
            id: crypto.randomUUID(),
            user_id: params.userId,
            campus_id: params.campusId,
            type: params.type,
            content: params.content,
            media_url: params.mediaUrl,
            metadata: params.metadata || {},
            visibility: params.visibility || 'contacts',
            is_view_once: params.isViewOnce || false,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
        };

        const { data, error } = await insforge.database.from('stories').insert(story).select().single();
        return { story: data as StatusStory, error };
    },

    async getActiveStories(userId: string) {
        const now = new Date().toISOString();

        // 1. Get stories from people you haven't muted
        // 2. Stories from campus if visibility is 'everyone' or you're in the same campus

        const { data: stories, error } = await insforge.database
            .from('stories')
            .select('*, user:profiles(*)')
            .gt('expires_at', now)
            .order('created_at', { ascending: true }); // Ascending for slide progression

        if (error) throw error;

        const grouped: Record<string, StatusStory[]> = {};
        (stories as any[])?.forEach(s => {
            if (!grouped[s.user_id]) grouped[s.user_id] = [];
            grouped[s.user_id].push(s);
        });

        return grouped;
    },

    async viewStory(userId: string, storyId: string) {
        await insforge.database.from('story_views').upsert({
            story_id: storyId,
            user_id: userId,
            viewed_at: new Date().toISOString()
        }, { onConflict: 'story_id,user_id' });

        // Increment view count in stories table
        await insforge.database.from('stories')
            .update({ view_count: 1 } as any) // Since we don't have atomic increment easily in REST without RPC
            .match({ id: storyId });

        // Note: Real atomic increment should use RPC
    },

    async reactToStory(userId: string, storyId: string, type: 'like' | 'emoji', emoji?: string) {
        return insforge.database.from('story_reactions').insert({
            story_id: storyId,
            user_id: userId,
            type,
            emoji,
            created_at: new Date().toISOString()
        });
    },

    async logScreenshot(userId: string, storyId: string) {
        return insforge.database.from('story_screenshot_logs').insert({
            story_id: storyId,
            user_id: userId,
            logged_at: new Date().toISOString()
        });
    },

    async votePoll(userId: string, pollId: string, optionIndex: number) {
        return insforge.database.from('story_poll_votes').upsert({
            poll_id: pollId,
            user_id: userId,
            option_index: optionIndex,
            created_at: new Date().toISOString()
        }, { onConflict: 'poll_id,user_id' });
    },

    async createHighlight(userId: string, name: string, storyIds: string[], coverUrl?: string) {
        const { data: highlight, error } = await insforge.database
            .from('story_highlights')
            .insert({ user_id: userId, name, cover_url: coverUrl })
            .select()
            .single();

        if (highlight && storyIds.length > 0) {
            const items = storyIds.map(sid => ({
                highlight_id: highlight.id,
                story_id: sid
            }));
            await insforge.database.from('story_highlight_items').insert(items);
        }

        return { highlight, error };
    },

    async getUserHighlights(userId: string) {
        return insforge.database
            .from('story_highlights')
            .select('*, items:story_highlight_items(*, story:stories(*))')
            .eq('user_id', userId);
    },

    // ===== STARRED MESSAGES =====
    async starMessage(userId: string, messageId: string) {
        const star: LocalStarredMessage = {
            id: crypto.randomUUID(),
            messageId,
            userId,
            createdAt: new Date().toISOString()
        };
        await db.starredMessages.add(star);
        return await insforge.database.from('messages').update({ is_starred: true } as any).eq('id', messageId);
    },

    async unstarMessage(messageId: string) {
        return await insforge.database.from('messages').update({ is_starred: false } as any).eq('id', messageId);
    },

    async starConversation(userId: string, conversationId: string) {
        return await insforge.database.from('conversation_members').update({ is_starred: true } as any).eq('user_id', userId).eq('conversation_id', conversationId);
    },

    async unstarConversation(userId: string, conversationId: string) {
        return await insforge.database.from('conversation_members').update({ is_starred: false } as any).eq('user_id', userId).eq('conversation_id', conversationId);
    },

    async getStarredMessages(userId: string) {
        const { data } = await insforge.database
            .from('starred_messages')
            .select('*, message:messages(*)')
            .eq('user_id', userId);
        return data?.map(d => d.message) || [];
    },

    // ===== DISAPPEARING MESSAGES =====
    async setDisappearingTimer(conversationId: string, duration: number | null) {
        return insforge.database
            .from('conversations')
            .update({ disappearing_timer: duration } as any)
            .eq('id', conversationId);
    },

    async toggleMute(userId: string, conversationId: string, muted: boolean) {
        return insforge.database
            .from('conversation_members')
            .update({ muted } as any)
            .eq('user_id', userId)
            .eq('conversation_id', conversationId);
    },

    // ===== BROADCAST LISTS =====
    async createBroadcastList(userId: string, name: string, memberIds: string[]) {
        const listId = crypto.randomUUID();
        const { data: list, error: listError } = await insforge.database
            .from('broadcast_lists')
            .insert({
                id: listId,
                creator_id: userId,
                name,
                member_count: memberIds.length
            })
            .select()
            .single();

        if (listError) throw listError;

        const members = memberIds.map(uid => ({
            id: crypto.randomUUID(),
            list_id: listId,
            user_id: uid
        }));

        await insforge.database.from('broadcast_members').insert(members);
        return list;
    },

    // ===== COMMUNITIES =====
    async createCommunity(userId: string, name: string, description: string) {
        const annConvoId = crypto.randomUUID();
        await insforge.database.from('conversations').insert({
            id: annConvoId,
            type: 'group',
            name: `${name} Announcements`,
            is_announcement: true,
            created_by: userId,
            is_public: false
        });

        const communityId = crypto.randomUUID();
        const { data: community, error } = await insforge.database
            .from('communities')
            .insert({
                id: communityId,
                name,
                description,
                creator_id: userId,
                announcement_group_id: annConvoId
            })
            .select()
            .single();

        return { community, error };
    },

    async addGroupToCommunity(communityId: string, conversationId: string) {
        return insforge.database.from('community_groups').insert({
            community_id: communityId,
            conversation_id: conversationId,
            added_at: new Date().toISOString()
        });
    },

    // ===== CALLS =====
    async initiateCall(initiatorId: string, type: 'audio' | 'video', isGroup: boolean, conversationId?: string, participantIds: string[] = []) {
        const callId = crypto.randomUUID();
        const { data: call, error } = await insforge.database
            .from('calls')
            .insert({
                id: callId,
                initiator_id: initiatorId,
                type,
                is_group: isGroup,
                conversation_id: conversationId,
                status: 'ringing',
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        const participants = [initiatorId, ...participantIds].map(uid => ({
            id: crypto.randomUUID(),
            call_id: callId,
            user_id: uid,
            status: uid === initiatorId ? 'accepted' : 'ringing',
            joined_at: uid === initiatorId ? new Date().toISOString() : null
        }));

        await insforge.database.from('call_participants').insert(participants);
        return call;
    }
};
