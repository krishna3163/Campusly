import { useState, useCallback, useEffect } from 'react';
import { StatusService } from '../services/statusService';
import { StatusStory } from '../types';
import { useAppStore } from '../stores/appStore';

export function useStatus(userId?: string) {
    const [statuses, setStatuses] = useState<Record<string, StatusStory[]>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useAppStore();

    const fetchStatuses = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await StatusService.getFriendStories(userId);
            if (fetchError) throw fetchError;
            if (data) setStatuses(data as any);
        } catch (err: any) {
            setError(err.message || 'Failed to sync statuses');
            showToast('Status sync error', 'error');
        } finally {
            setLoading(false);
        }
    }, [userId, showToast]);

    useEffect(() => {
        if (userId) fetchStatuses();
    }, [userId, fetchStatuses]);

    const postStatus = async (uid: string, cid: string, content: string, mediaUrl?: string) => {
        if (!uid) return;
        setLoading(true);
        try {
            const { error: postError } = await StatusService.createStory(uid, cid, {
                type: mediaUrl ? 'image' : 'text',
                content,
                media_url: mediaUrl
            });
            if (postError) throw postError;
            showToast('Status updated!', 'success');
            await fetchStatuses();
        } catch (err: any) {
            showToast('Failed to update status', 'error');
            console.error('Status Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return { statuses, loading, error, fetchStatuses, postStatus };
}
