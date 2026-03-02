import { useState, useCallback, useEffect } from 'react';
import { FriendService } from '../services/friendService';
import { useAppStore } from '../stores/appStore';

export function useFriends(userId?: string) {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useAppStore();

    const fetchFriends = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await FriendService.getFriends(userId);
            if (fetchError) throw fetchError;
            if (data) setFriends(data);
        } catch (err: any) {
            setError(err.message || 'Failed to sync friends');
            showToast('Friend-list sync error', 'error');
        } finally {
            setLoading(false);
        }
    }, [userId, showToast]);

    useEffect(() => {
        if (userId) fetchFriends();
    }, [userId, fetchFriends]);

    const addFriend = async (targetId: string) => {
        if (!userId) return;
        try {
            const { error: addError } = await FriendService.sendFriendRequest(userId, targetId);
            if (addError) throw addError;
            showToast('Request Sent! Waiting for sync.', 'success');
        } catch (err: any) {
            showToast('Failed to add friend', 'error');
        }
    };

    const approve = async (targetId: string) => {
        if (!userId) return;
        try {
            const ok = await FriendService.approveFriendRequest(targetId, userId);
            if (ok) {
                showToast('Accepted! Connected locally.', 'success');
                await fetchFriends();
            }
        } catch (err: any) {
            showToast('Failed to approve request', 'error');
        }
    };

    return { friends, loading, error, fetchFriends, addFriend, approve };
}
