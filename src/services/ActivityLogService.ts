import { insforge } from '../lib/insforge';

export const ActivityLogService = {
    async logAction(groupId: string, actionType: string, performedBy: string, targetUser?: string) {
        try {
            const { error } = await insforge.database
                .from('group_activity_logs')
                .insert({
                    group_id: groupId,
                    action_type: actionType,
                    performed_by: performedBy,
                    target_user: targetUser || null,
                    created_at: new Date().toISOString()
                });
            if (error) throw error;
        } catch (err) {
            console.error('Failed to log admin action:', err);
        }
    },

    async getLogs(groupId: string) {
        const { data, error } = await insforge.database
            .from('group_activity_logs')
            .select(`
                *,
                performer:performed_by(display_name, avatar_url),
                target:target_user(display_name, avatar_url)
            `)
            .eq('group_id', groupId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data;
    }
};
