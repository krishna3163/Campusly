// ===================================================================
// Campusly v3.0 — Group Assignment Service
// CRUD operations for group-level assignments with completion tracking.
// ===================================================================

import { insforge } from '../lib/insforge';
import type { GroupAssignment, GroupAssignmentCompletion } from '../types/messaging';

/**
 * Create a new assignment in a group.
 */
export async function createGroupAssignment(
    groupId: string,
    createdBy: string,
    data: {
        title: string;
        description?: string;
        subject?: string;
        due_date: string;
        is_important?: boolean;
        attachments?: any[];
    }
): Promise<GroupAssignment | null> {
    const { data: result, error } = await insforge.database
        .from('group_assignments')
        .insert({
            group_id: groupId,
            created_by: createdBy,
            title: data.title,
            description: data.description,
            subject: data.subject,
            due_date: data.due_date,
            is_important: data.is_important || false,
            attachments: data.attachments || [],
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create group assignment:', error);
        return null;
    }

    // Auto-send system message to group
    await insforge.database.from('messages').insert({
        conversation_id: groupId,
        sender_id: createdBy,
        content: `📋 New Assignment: "${data.title}" — Due: ${new Date(data.due_date).toLocaleDateString()}`,
        type: 'system',
        is_important: data.is_important || false,
    });

    return result as GroupAssignment;
}

/**
 * Get all assignments for a group.
 */
export async function getGroupAssignments(groupId: string): Promise<GroupAssignment[]> {
    const { data } = await insforge.database
        .from('group_assignments')
        .select('*')
        .eq('group_id', groupId)
        .order('due_date', { ascending: true });

    return (data as GroupAssignment[]) || [];
}

/**
 * Mark an assignment as completed by the current user.
 */
export async function markAssignmentComplete(assignmentId: string, userId: string): Promise<boolean> {
    const { error } = await insforge.database
        .from('group_assignment_completions')
        .insert({ assignment_id: assignmentId, user_id: userId });

    return !error;
}

/**
 * Unmark an assignment as completed.
 */
export async function unmarkAssignmentComplete(assignmentId: string, userId: string): Promise<boolean> {
    const { error } = await insforge.database
        .from('group_assignment_completions')
        .delete()
        .eq('assignment_id', assignmentId)
        .eq('user_id', userId);

    return !error;
}

/**
 * Get completion status for an assignment.
 */
export async function getAssignmentCompletions(assignmentId: string): Promise<GroupAssignmentCompletion[]> {
    const { data } = await insforge.database
        .from('group_assignment_completions')
        .select('*, user:profiles(*)')
        .eq('assignment_id', assignmentId);

    return (data as GroupAssignmentCompletion[]) || [];
}

/**
 * Delete a group assignment (owner/admin only).
 */
export async function deleteGroupAssignment(assignmentId: string): Promise<boolean> {
    const { error } = await insforge.database
        .from('group_assignments')
        .delete()
        .eq('id', assignmentId);

    return !error;
}

/**
 * Subscribe to assignment changes in a group.
 */
export function subscribeToGroupAssignments(
    groupId: string,
    onAssignmentChange: (assignment: GroupAssignment, eventType: string) => void
): () => void {
    const channel = insforge.realtime
        .channel(`group_assignments:${groupId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'group_assignments',
            filter: `group_id=eq.${groupId}`,
        }, (payload: any) => {
            const record = payload.new || payload.old;
            if (record) {
                onAssignmentChange(record as GroupAssignment, payload.eventType);
            }
        })
        .subscribe();

    return () => {
        insforge.realtime.removeChannel(channel);
    };
}
