// ===================================================================
// Campusly v4.0 — Friend System Service
// Send/accept/reject requests, manage friendships, mutual friends.
// ===================================================================

import { insforge } from '../lib/insforge';
import type { FriendRequest, Friendship } from '../types/social';
import type { UserProfile } from '../types';

/**
 * Send a friend request.
 */
export async function sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest | null> {
    // Check if request already exists
    const { data: existing } = await insforge.database
        .from('friend_requests')
        .select('id, status')
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .maybeSingle();

    if (existing) {
        if (existing.status === 'pending') return null; // Already pending
        if (existing.status === 'accepted') return null; // Already friends
    }

    // Check if already friends
    const ids = [senderId, receiverId].sort();
    const { data: friendship } = await insforge.database
        .from('friendships')
        .select('id')
        .eq('user_id_1', ids[0])
        .eq('user_id_2', ids[1])
        .maybeSingle();

    if (friendship) return null; // Already friends

    const { data, error } = await insforge.database
        .from('friend_requests')
        .upsert({
            sender_id: senderId,
            receiver_id: receiverId,
            status: 'pending',
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error || !data) return null;

    // Notify receiver
    await insforge.database.from('notifications').insert({
        user_id: receiverId,
        type: 'friend_request',
        title: '👋 New Friend Request',
        body: 'Someone wants to connect with you!',
        data: { request_id: data.id, sender_id: senderId },
        is_read: false,
    });

    return data as FriendRequest;
}

/**
 * Accept a friend request.
 */
export async function acceptFriendRequest(requestId: string, receiverId: string): Promise<boolean> {
    const { data: request } = await insforge.database
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('receiver_id', receiverId)
        .eq('status', 'pending')
        .single();

    if (!request) return false;

    // Update request status
    await insforge.database
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

    // Create friendship (sorted IDs for unique constraint)
    const ids = [request.sender_id, request.receiver_id].sort();
    await insforge.database.from('friendships').upsert({
        user_id_1: ids[0],
        user_id_2: ids[1],
    });

    // Increment friend counts
    await insforge.database.rpc('increment_friend_count', { user_ids: [request.sender_id, request.receiver_id] }).catch(() => {
        // Fallback: manual increment
    });

    // Notify sender
    await insforge.database.from('notifications').insert({
        user_id: request.sender_id,
        type: 'friend_accepted',
        title: '🎉 Friend Request Accepted',
        body: 'Your connection is now active!',
        data: { friend_id: receiverId },
        is_read: false,
    });

    return true;
}

/**
 * Reject a friend request.
 */
export async function rejectFriendRequest(requestId: string, receiverId: string): Promise<boolean> {
    const { error } = await insforge.database
        .from('friend_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('receiver_id', receiverId);

    return !error;
}

/**
 * Cancel a sent friend request.
 */
export async function cancelFriendRequest(requestId: string, senderId: string): Promise<boolean> {
    const { error } = await insforge.database
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', senderId)
        .eq('status', 'pending');

    return !error;
}

/**
 * Get pending friend requests received by a user.
 */
export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
    const { data } = await insforge.database
        .from('friend_requests')
        .select('*, sender:profiles!friend_requests_sender_id_fkey(id, display_name, avatar_url, branch, semester)')
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    return (data as FriendRequest[]) || [];
}

/**
 * Get a user's friends list.
 */
export async function getFriends(userId: string): Promise<UserProfile[]> {
    const { data: friendships } = await insforge.database
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (!friendships?.length) return [];

    const friendIds = friendships.map(f =>
        f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
    );

    const { data: profiles } = await insforge.database
        .from('profiles')
        .select('*')
        .in('id', friendIds);

    return (profiles as UserProfile[]) || [];
}

/**
 * Get mutual friends between two users.
 */
export async function getMutualFriends(userId1: string, userId2: string): Promise<UserProfile[]> {
    const [friends1, friends2] = await Promise.all([
        getFriends(userId1),
        getFriends(userId2),
    ]);

    const ids2 = new Set(friends2.map(f => f.id));
    return friends1.filter(f => ids2.has(f.id));
}

/**
 * Check friendship status between two users.
 */
export async function getFriendshipStatus(
    userId: string,
    targetId: string
): Promise<'friends' | 'pending_sent' | 'pending_received' | 'none'> {
    // Check if friends
    const ids = [userId, targetId].sort();
    const { data: friendship } = await insforge.database
        .from('friendships')
        .select('id')
        .eq('user_id_1', ids[0])
        .eq('user_id_2', ids[1])
        .maybeSingle();

    if (friendship) return 'friends';

    // Check pending requests
    const { data: request } = await insforge.database
        .from('friend_requests')
        .select('sender_id')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${userId})`)
        .eq('status', 'pending')
        .maybeSingle();

    if (request) {
        return request.sender_id === userId ? 'pending_sent' : 'pending_received';
    }

    return 'none';
}

/**
 * Subscribe to friend request changes.
 */
export function subscribeToFriendRequests(
    userId: string,
    onRequestChange: (request: FriendRequest, eventType: string) => void
): () => void {
    const channel = insforge.realtime
        .channel(`friend_requests:${userId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'friend_requests',
            filter: `receiver_id=eq.${userId}`,
        }, (payload: any) => {
            const record = payload.new || payload.old;
            if (record) onRequestChange(record as FriendRequest, payload.eventType);
        })
        .subscribe();

    return () => insforge.realtime.removeChannel(channel);
}
