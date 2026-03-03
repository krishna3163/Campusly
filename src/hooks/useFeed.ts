import { useState, useCallback, useRef } from 'react';
import { FeedService } from '../services/feedService';
import { Post } from '../types';
import { useAppStore } from '../stores/appStore';

export function useFeed(campusId: string, category: string = 'all', hashtag?: string) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const fetchLock = useRef(false);
    const { showToast } = useAppStore();

    const fetchFeed = useCallback(async (isRefresh = false, retryAttempts = 3) => {
        if (!campusId || fetchLock.current) return;

        fetchLock.current = true;
        setLoading(true);
        setError(null);

        try {
            const currentPage = isRefresh ? 0 : page;
            const offset = currentPage * 10;

            const { data, error: fetchErr } = await FeedService.getFeed(campusId, category, 10, offset, hashtag);

            if (fetchErr) throw new Error(typeof fetchErr === 'string' ? fetchErr : 'Failed to fetch feed');

            if (data) {
                setPosts(prev => {
                    if (isRefresh) return data;

                    // Simple deduplication filter
                    const existingIds = new Set(prev.map(p => p.id));
                    const newPosts = data.filter((p: any) => !existingIds.has(p.id));
                    return [...prev, ...newPosts];
                });

                setHasMore(data.length === 10);
                if (!isRefresh && data.length > 0) {
                    setPage(currentPage + 1);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch feed');
            if (retryAttempts > 0) {
                fetchLock.current = false;
                setTimeout(() => fetchFeed(isRefresh, retryAttempts - 1), 1000);
                return;
            }
            showToast('Feed Sync Error. Please retry later.', 'error');
        } finally {
            fetchLock.current = false;
            setLoading(false);
        }
    }, [campusId, category, page, showToast, hashtag]);

    const refresh = () => {
        setPage(0);
        return fetchFeed(true);
    };

    const handleVote = async (postId: string, vote: 'like' | 'dislike', userId: string) => {
        try {
            // Advanced Optimistic Mapping with toggle and swap support
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    const currentVote = p.user_vote;
                    const isNewLike = vote === 'like';
                    let likes = p.likes_count || 0;
                    let dislikes = p.dislikes_count || 0;

                    if (currentVote === vote) {
                        // Toggle off
                        if (isNewLike) likes--; else dislikes--;
                        return { ...p, likes_count: likes, dislikes_count: dislikes, user_vote: undefined };
                    } else if (currentVote) {
                        // Swap
                        if (isNewLike) { likes++; dislikes--; } else { likes--; dislikes++; }
                        return { ...p, likes_count: likes, dislikes_count: dislikes, user_vote: vote };
                    } else {
                        // New
                        if (isNewLike) likes++; else dislikes++;
                        return { ...p, likes_count: likes, dislikes_count: dislikes, user_vote: vote };
                    }
                }
                return p;
            }));

            const { error } = await FeedService.reactPost(userId, postId, vote);
            if (error) throw error;
        } catch (err) {
            showToast('Reaction synchronization failed.', 'error');
            refresh();
        }
    };

    const addPost = useCallback(async (newPost: Partial<Post>, userId: string) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticPost: Post = {
            id: tempId,
            user_id: userId,
            campus_id: campusId,
            category: newPost.category || 'general',
            content: newPost.content || '',
            media_url: newPost.media_url || null,
            media_type: newPost.media_type || null,
            type: (newPost.type as any) === 'photo' ? 'media' : (newPost.type || 'text'),
            original_post_id: newPost.original_post_id || null,
            hashtags: newPost.hashtags || [],
            likes_count: 0,
            dislikes_count: 0,
            comments_count: 0,
            repost_count: 0,
            is_anonymous: newPost.is_anonymous || false,
            created_at: new Date().toISOString(),
            author: newPost.author as any
        };

        setPosts(prev => [optimisticPost, ...prev]);

        try {
            const { data, error } = await FeedService.createPost(userId, campusId, newPost);
            if (error) throw error;

            if (data) {
                setPosts(prev => prev.map(p => p.id === tempId ? data as Post : p));
            }
        } catch (err) {
            showToast('Transmission failed. Removing temporary post...', 'error');
            setPosts(prev => prev.filter(p => p.id !== tempId));
        }
    }, [campusId, showToast]);

    const handleReport = async (postId: string, userId: string, reason?: string) => {
        try {
            // Optimistically remove from feed
            setPosts(prev => prev.filter(p => p.id !== postId));
            const { error } = await FeedService.reportPost(userId, postId, reason);
            if (error) throw error;
            showToast('Report submitted. We are taking action.', 'success');
        } catch (err) {
            showToast('Report submission failed.', 'error');
            refresh();
        }
    };

    return {
        posts,
        loading,
        error,
        hasMore,
        fetchFeed,
        refresh,
        handleVote,
        handleReport,
        addPost
    };
}
