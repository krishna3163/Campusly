import { insforge } from '../lib/insforge';

export const FeedService = {
    async getFeed(campusId: string, category?: string, limit = 10, offset = 0, hashtag?: string) {
        try {
            if (!campusId) return { data: [], error: 'Campus ID missing' };

            let query = insforge.database
                .from('posts')
                .select('*, author:profiles!user_id(*), original_post:posts!original_post_id(*, author:profiles!user_id(*))')
                .eq('campus_id', campusId);

            if (category && category !== 'all') {
                query = query.eq('category', category);
            }

            if (hashtag) {
                query = query.contains('hashtags', [hashtag.replace('#', '').toLowerCase()]);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                console.error('Feed Database Error:', error);
                return { data: [], error };
            }

            return { data: data || [], error: null };
        } catch (err) {
            console.error('Critical Feed Failure:', err);
            return { data: [], error: err };
        }
    },

    async getPost(postId: string) {
        try {
            const { data, error } = await insforge.database
                .from('posts')
                .select('*, author:profiles!user_id(*), original_post:posts!original_post_id(*, author:profiles!user_id(*))')
                .eq('id', postId)
                .single();
            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async createPost(userId: string, campusId: string, data: any) {
        try {
            const hashtags = data.content.match(/#[a-z0-9_]+/gi)?.map((t: string) => t.toLowerCase()) || [];

            const { data: res, error } = await insforge.database
                .from('posts')
                .insert({
                    user_id: userId,
                    campus_id: campusId,
                    category: data.category || 'general',
                    content: data.content,
                    media_url: data.media_url || null,
                    media_type: data.media_type || null,
                    type: data.type || 'text',
                    original_post_id: data.original_post_id || null,
                    hashtags,
                    is_anonymous: data.is_anonymous || false,
                    created_at: new Date().toISOString()
                })
                .select('*, author:profiles!user_id(*)')
                .single();
            return { data: res, error };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async reactPost(userId: string, postId: string, type: 'like' | 'dislike') {
        try {
            const { data: existing } = await insforge.database
                .from('post_reactions')
                .select('*')
                .eq('user_id', userId)
                .eq('post_id', postId)
                .maybeSingle();

            if (existing) {
                if (existing.type === type) {
                    // Remove reaction
                    await insforge.database.from('post_reactions').delete().eq('id', existing.id);
                    // Update post counts
                    const field = type === 'like' ? 'likes_count' : 'dislikes_count';
                    await insforge.database.rpc('decrement_post_count', { post_id: postId, field_name: field });
                    return { active: false, swapped: false, error: null };
                } else {
                    // Swap reaction
                    await insforge.database.from('post_reactions').update({ type }).eq('id', existing.id);
                    // Update post counts
                    const oldField = existing.type === 'like' ? 'likes_count' : 'dislikes_count';
                    const newField = type === 'like' ? 'likes_count' : 'dislikes_count';
                    await insforge.database.rpc('swap_post_counts', { post_id: postId, old_field: oldField, new_field: newField });
                    return { active: true, swapped: true, error: null };
                }
            } else {
                // Add new reaction
                await insforge.database.from('post_reactions').insert({ user_id: userId, post_id: postId, type });
                // Update post counts
                const field = type === 'like' ? 'likes_count' : 'dislikes_count';
                await insforge.database.rpc('increment_post_count', { post_id: postId, field_name: field });
                return { active: true, swapped: false, error: null };
            }
        } catch (err) {
            return { error: err };
        }
    },

    async reactComment(userId: string, commentId: string, type: string = 'like') {
        try {
            const { data: existing } = await insforge.database
                .from('comment_reactions')
                .select('*')
                .eq('user_id', userId)
                .eq('comment_id', commentId)
                .maybeSingle();

            if (existing) {
                // For now, only toggle like
                await insforge.database.from('comment_reactions').delete().eq('id', existing.id);
                await insforge.database.rpc('decrement_comment_count', { comment_id: commentId, field_name: 'upvotes' });
                return { active: false, error: null };
            } else {
                await insforge.database.from('comment_reactions').insert({ user_id: userId, comment_id: commentId, type });
                await insforge.database.rpc('increment_comment_count', { comment_id: commentId, field_name: 'upvotes' });
                return { active: true, error: null };
            }
        } catch (err) {
            return { error: err };
        }
    },

    async repost(userId: string, campusId: string, originalPostId: string, quote?: string) {
        try {
            // Increment repost count
            await insforge.database.rpc('increment_repost_count', { post_id: originalPostId });

            if (quote) {
                return this.createPost(userId, campusId, {
                    content: quote,
                    type: 'remix',
                    original_post_id: originalPostId,
                });
            } else {
                return this.createPost(userId, campusId, {
                    content: '',
                    type: 'remix',
                    original_post_id: originalPostId,
                });
            }
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async addComment(userId: string, postId: string, content: string, parentId?: string) {
        try {
            const { data, error } = await insforge.database
                .from('comments')
                .insert({
                    post_id: postId,
                    author_id: userId,
                    parent_id: parentId || null,
                    content,
                    created_at: new Date().toISOString()
                })
                .select('*, author:profiles!author_id(*)')
                .single();

            if (data && !error) {
                await insforge.database.rpc('increment_post_count', { post_id: postId, field_name: 'comments_count' });
            }
            return { data, error };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async getComments(postId: string, userId?: string) {
        let query = insforge.database
            .from('comments')
            .select('*, author:profiles!author_id(*)');

        if (userId) {
            // This is a bit complex for a single query with maybeSingle on join
            // In postgREST we might use a supplemental select or just fetch it
        }

        const { data, error } = await query
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (userId && data) {
            const { data: reactions } = await insforge.database
                .from('comment_reactions')
                .select('comment_id, type')
                .eq('user_id', userId)
                .in('comment_id', data.map(c => c.id));

            if (reactions) {
                data.forEach(c => {
                    const reaction = reactions.find(r => r.comment_id === c.id);
                    if (reaction) c.user_reaction = reaction.type;
                });
            }
        }

        return { data, error };
    },

    async createPoll(userId: string, campusId: string, content: string, options: string[]) {
        try {
            const { data: post, error } = await this.createPost(userId, campusId, {
                content,
                type: 'poll'
            });

            if (error || !post) throw error;

            await insforge.database.from('polls').insert({
                post_id: post.id,
                options,
                votes: {}
            });

            return { data: post, error: null };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async votePoll(postId: string, userId: string, optionIndex: number | number[]) {
        try {
            const { data: poll } = await insforge.database
                .from('polls')
                .select('*')
                .eq('post_id', postId)
                .single();
            if (!poll) throw new Error('Poll not found');

            const votes = typeof poll.votes === 'string' ? JSON.parse(poll.votes) : (poll.votes || {});

            // Allow multiple votes or replace existing
            votes[userId] = optionIndex;

            const { error } = await insforge.database
                .from('polls')
                .update({ votes })
                .eq('id', poll.id);

            return { data: votes, error };
        } catch (err) {
            return { data: null, error: err };
        }
    },

    async getPoll(postId: string) {
        return insforge.database
            .from('polls')
            .select('*')
            .eq('post_id', postId)
            .maybeSingle();
    },

    async trackShare(postId: string) {
        return insforge.database.rpc('increment_share_count', { post_id: postId });
    },

    async reportPost(userId: string, postId: string, reason?: string) {
        try {
            const { error } = await insforge.database
                .from('post_reports')
                .insert({ user_id: userId, post_id: postId, reason });
            return { error };
        } catch (err) {
            return { error: err };
        }
    },

    async getTrendingHashtags(limit = 10) {
        try {
            const { data, error } = await insforge.database
                .from('posts')
                .select('hashtags')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) return { data: [], error };

            const counts: Record<string, number> = {};
            data?.forEach(post => {
                const hashtags = post.hashtags;
                if (Array.isArray(hashtags)) {
                    hashtags.forEach((tag: string) => {
                        const t = tag.startsWith('#') ? tag : `#${tag}`;
                        counts[t] = (counts[t] || 0) + 1;
                    });
                }
            });

            const trending = Object.entries(counts)
                .map(([tag, count]) => ({ tag, count: `${count} posts` }))
                .sort((a, b) => parseInt(b.count) - parseInt(a.count))
                .slice(0, limit);

            return { data: trending, error: null };
        } catch (err) {
            return { data: [], error: err };
        }
    }
};
