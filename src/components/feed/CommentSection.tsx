import React, { useState, useEffect } from 'react';
import { Send, User } from 'lucide-react';
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

    useEffect(() => {
        loadComments();
    }, [post.id]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const { data } = await FeedService.getComments(post.id);
            setComments(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            const { data, error } = await FeedService.addComment(userId, post.id, newComment.trim());
            if (data) {
                setComments(prev => [...prev, data]);
                setNewComment('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-4 p-6 bg-black/20 rounded-[32px] border border-white/5 animate-slide-up">
            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-campus-muted mb-4 px-2">Broadcast Stream</h5>

            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 custom-scrollbar pr-2">
                {loading ? (
                    <div className="py-4 text-center opacity-20 text-xs font-bold uppercase tracking-widest">Syncing...</div>
                ) : comments.length === 0 ? (
                    <div className="py-4 text-center opacity-20 text-xs font-bold uppercase tracking-widest">No signals detected</div>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {c.author?.avatar_url ? <img src={c.author.avatar_url} className="w-full h-full object-cover" /> : <User size={14} className="text-white/20" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-white/80 italic uppercase tracking-tighter">{c.author?.display_name || 'STUDENT'}</span>
                                    <span className="text-[9px] text-campus-muted font-bold tracking-widest">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-sm text-white/70 leading-relaxed mt-0.5">{c.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Contribute to the thread..."
                    className="w-full bg-white/5 border border-white/10 focus:border-brand-500/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-white outline-none transition-all pr-12"
                />
                <button
                    disabled={!newComment.trim() || submitting}
                    className="absolute right-2 top-1.5 p-2 rounded-xl text-brand-400 hover:bg-brand-500/20 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};
