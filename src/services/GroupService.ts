import { insforge } from '../lib/insforge';
import { ActivityLogService } from './ActivityLogService';

export const GroupService = {
    // --- Section 1: Visibility ---
    async setVisibility(groupId: string, visibility: 'public' | 'private', adminId: string) {
        const { data, error } = await insforge.database
            .from('conversations')
            .update({
                visibility,
                is_public: visibility === 'public'
            })
            .eq('id', groupId);

        if (error) throw error;

        await ActivityLogService.logAction(groupId, `Changed visibility to ${visibility}`, adminId);
        return data;
    },

    // --- Section 2 & 3: Admin Role & Permission ---
    async assignAdmin(groupId: string, targetUserId: string, performedBy: string) {
        const { error } = await insforge.database
            .from('conversation_members')
            .update({ role: 'admin' })
            .eq('conversation_id', groupId)
            .eq('user_id', targetUserId);

        if (error) throw error;

        await ActivityLogService.logAction(groupId, 'Promoted to Admin', performedBy, targetUserId);
    },

    async removeAdmin(groupId: string, targetUserId: string, performedBy: string) {
        const { error } = await insforge.database
            .from('conversation_members')
            .update({ role: 'member' })
            .eq('conversation_id', groupId)
            .eq('user_id', targetUserId);

        if (error) throw error;

        await ActivityLogService.logAction(groupId, 'Demoted to Member', performedBy, targetUserId);
    },

    // --- Section 6: Delete Group ---
    async deleteGroup(groupId: string, ownerId: string) {
        // 1. Double check owner
        const { data: member } = await insforge.database
            .from('conversation_members')
            .select('role')
            .eq('conversation_id', groupId)
            .eq('user_id', ownerId)
            .single();

        if (member?.role !== 'owner') {
            throw new Error('Only owners can dissolve groups');
        }

        // 2. Cascade delete will handle messages and members if constraints exist
        // Otherwise manually dissolve
        const { error } = await insforge.database
            .from('conversations')
            .delete()
            .eq('id', groupId);

        if (error) throw error;
    },

    // --- Section 5: Exit Group ---
    async exitGroup(groupId: string, userId: string) {
        const { data: member } = await insforge.database
            .from('conversation_members')
            .select('role')
            .eq('conversation_id', groupId)
            .eq('user_id', userId)
            .single();

        if (member?.role === 'owner') {
            throw new Error('Owner must transfer identity before departure');
        }

        const { error } = await insforge.database
            .from('conversation_members')
            .delete()
            .eq('conversation_id', groupId)
            .eq('user_id', userId);

        if (error) throw error;

        await ActivityLogService.logAction(groupId, 'Departed group', userId);
    },

    async transferOwnership(groupId: string, newOwnerId: string, currentOwnerId: string) {
        // Start transaction logic if available, or sequential updates
        // 1. Upgrade new owner
        const { error: e1 } = await insforge.database
            .from('conversation_members')
            .update({ role: 'owner' })
            .eq('conversation_id', groupId)
            .eq('user_id', newOwnerId);

        if (e1) throw e1;

        // 2. Downgrade current owner to admin
        const { error: e2 } = await insforge.database
            .from('conversation_members')
            .update({ role: 'admin' })
            .eq('conversation_id', groupId)
            .eq('user_id', currentOwnerId);

        if (e2) throw e2;

        await ActivityLogService.logAction(groupId, 'Transferred Ownership', currentOwnerId, newOwnerId);
    },

    // --- Section 7: Group Photo Fix ---
    async updatePhoto(groupId: string, file: File, adminId: string) {
        if (!file.type.startsWith('image/')) throw new Error('Photo must be an image');
        if (file.size > 5 * 1024 * 1024) throw new Error('Maximum dimension: 5MB');

        // 1. Upload to storage
        const path = `groups/${groupId}/avatar_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await insforge.storage
            .from('avatars')
            .upload(path, file);

        if (uploadError || !uploadData) throw uploadError || new Error('Upload failed');

        // 2. The URL is directly in the return data
        const publicUrl = uploadData.url;

        // 3. Update DB
        const { error: dbError } = await insforge.database
            .from('conversations')
            .update({ avatar_url: publicUrl })
            .eq('id', groupId);

        if (dbError) throw dbError;

        await ActivityLogService.logAction(groupId, 'Changed group identity photo', adminId);
        return publicUrl;
    },

    // --- Section 8: Vibe Check ---
    async createVibeCheck(groupId: string, creatorId: string, question: string) {
        const { data, error } = await insforge.database
            .from('polls')
            .insert({
                conversation_id: groupId,
                creator_id: creatorId,
                question: question || 'Rate the current vibe?',
                options: ['🔥', '😎', '❄️', '💀'],
                is_vibe_check: true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
