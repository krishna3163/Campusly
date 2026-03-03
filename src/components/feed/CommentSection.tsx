import React, { useState, useEffect, useMemo } from 'react';
import { Send, User, Reply, X, MessageCircle } from 'lucide-react';
import { FeedService } from '../../services/feedService';
import type { Post, Comment } from '../../types';

interface CommentSectionProps {
    post: Post;
    userId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ post, userId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

    useEffect(() => {
        loadComments();
    }, [post.id]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const { data } = await FeedService.getComments(post.id, userId);
            setComments(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const groupedComments = useMemo(() => {
        const roots = comments.filter(c => !c.parent_id);
        const children = comments.filter(c => c.parent_id);

        return roots.map(root => ({
            ...root,
            replies: children.filter(child => child.parent_id === root.id)
        }));
    }, [comments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            const { data, error } = await FeedService.addComment(
                userId,
                post.id,
                newComment.trim(),
                replyingTo?.id
            );
            if (data) {
                setComments(prev => [...prev, data]);
                setNewComment('');
                setReplyingTo(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (commentId: string) => {
        try {
            const { active, error } = await FeedService.reactComment(userId, commentId);
            if (!error) {
                setComments(prev => prev.map(c => {
                    if (c.id === commentId) {
                        return {
                            ...c,
                            upvotes: (c.upvotes || 0) + (active ? 1 : -1),
                            user_reaction: active ? 'like' : null
                        };
                    }
                    return c;
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const CommentItem = ({ comment, isReply = false }: { comment: Comment & { replies?: Comment[] }, isReply?: boolean }) => (
        <div className={`space-y-3 ${isReply ? 'ml-10 mt-3 pt-3 border-l-2 border-[#E5E5EA] pl-4' : 'mb-6 last:mb-0'}`}>
            <div className="flex gap-3 group">
                <div className={`${isReply ? 'w-6 h-6' : 'w-10 h-10'} rounded-full bg-[#F2F2F7] flex-shrink-0 flex items-center justify-center overflow-hidden border border-black/5`}>
                    {comment.author?.avatar_url ? (
                        <img src={comment.author.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <User size={isReply ? 12 : 20} className="text-[#8E8E93]" />
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-black">{comment.author?.display_name || 'Student'}</span>
                            <span className="text-[11px] text-[#8E8E93]">
                                {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <p className="text-[15px] text-black leading-snug mt-1">{comment.content}</p>

                    <div className="mt-2 flex items-center gap-4">
                        {!isReply && (
                            <button
                                onClick={() => setReplyingTo(comment)}
                                className="flex items-center gap-1.5 text-[12px] font-bold text-[#8E8E93] hover:text-[#007AFF] transition-colors"
                            >
                                <Reply size={14} />
                                Reply
                            </button>
                        )}
                        <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1.5 text-[12px] font-bold transition-colors ${comment.user_reaction === 'like' ? 'text-[#FF2D55]' : 'text-[#8E8E93] hover:text-[#FF2D55]'}`}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill={comment.user_reaction === 'like' ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            {comment.upvotes || 0}
                        </button>
                    </div>
                </div>
            </div>
            {comment.replies?.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply />
            ))}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-5 no-scrollbar min-h-[40vh] max-h-[60vh]">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mb-2" />
                        <span className="text-[13px] font-bold uppercase tracking-widest">Scanning signals...</span>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-16 h-16 bg-[#F2F2F7] rounded-full flex items-center justify-center mb-4">
                            <MessageCircle size={32} className="text-[#8E8E93]" />
                        </div>
                        <h4 className="text-[17px] font-bold text-black mb-1">No comments yet</h4>
                        <p className="text-[13px] text-[#8E8E93]">Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    <div className="animate-slide-up">
                        {groupedComments.map(c => (
                            <CommentItem key={c.id} comment={c} />
                        ))}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="shrink-0 p-4 bg-white border-t border-[#E5E5EA]">
                {replyingTo && (
                    <div className="mb-3 px-4 py-2 bg-[#F2F2F7] rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Reply size={14} className="text-[#8E8E93] shrink-0" />
                            <span className="text-[13px] text-[#8E8E93] truncate">
                                Replying to <span className="font-bold text-black">{replyingTo.author?.display_name}</span>
                            </span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="p-1 text-[#8E8E93] hover:text-black">
                            <X size={16} />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                            className="w-full bg-[#F2F2F7] border border-transparent focus:border-[#007AFF] focus:bg-white rounded-[24px] px-5 py-3 text-[15px] outline-none transition-all pr-12 text-black"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            className="absolute right-2 top-1.5 p-2 rounded-full bg-[#007AFF] text-white disabled:opacity-30 disabled:bg-[#8E8E93] transition-all shadow-md shadow-[#007AFF]/20"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
