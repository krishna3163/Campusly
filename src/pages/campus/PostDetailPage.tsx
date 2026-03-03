import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Share,
    MoreVertical,
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    Repeat,
    Shield,
    Globe
} from 'lucide-react';
import { useUser } from '@insforge/react';
import { FeedService } from '../../services/feedService';
import { CommentSection } from '../../components/feed/CommentSection';
import { PollView } from '../../components/feed/PollView';
import { PostShareModal } from '../../components/feed/PostShareModal';
import { useAppStore } from '../../stores/appStore';

export default function PostDetailPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const { showToast } = useAppStore();

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isShareOpen, setIsShareOpen] = useState(false);

    useEffect(() => {
        if (postId) {
            fetchPost();
        }
    }, [postId]);

    const fetchPost = async () => {
        setLoading(true);
        const { data, error } = await FeedService.getPost(postId!);
        if (error) {
            showToast('Failed to load post', 'error');
            navigate(-1);
        } else {
            setPost(data);
        }
        setLoading(false);
    };

    const handleVote = async (type: 'like' | 'dislike') => {
        if (!user?.id || !post) return;
        const { error } = await FeedService.reactPost(user.id, post.id, type);
        if (!error) {
            fetchPost(); // Refresh to get updated counts
        }
    };

    if (loading) {
        return (
            <div className="h-full bg-[var(--background)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]" />
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="h-full bg-[var(--background)] flex flex-col overflow-hidden">
            {/* iOS Header */}
            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#007AFF]">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-[17px] font-bold text-[var(--foreground)]">Post</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsShareOpen(true)} className="p-2 text-[#007AFF]">
                        <Share size={20} />
                    </button>
                    <button className="p-2 text-[#007AFF]">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-[600px] mx-auto p-4 space-y-4">
                    <div className="bg-[var(--surface)] rounded-[24px] overflow-hidden shadow-sm border border-[var(--border)] p-5">
                        {/* Author Info */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-[var(--background)] overflow-hidden border border-[var(--border)]">
                                {post.is_anonymous ? (
                                    <div className="w-full h-full bg-[#8E8E93] flex items-center justify-center">
                                        <Shield className="text-white/50" size={24} />
                                    </div>
                                ) : (
                                    <img src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.display_name}&background=E5E5EA&color=8E8E93`} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div>
                                <h4 className="text-[17px] font-bold text-[var(--foreground)] leading-none">
                                    {post.is_anonymous ? 'Anonymous' : post.author?.display_name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[13px] text-[var(--foreground-muted)]">
                                        {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[var(--foreground-muted)]">•</span>
                                    <Globe size={12} className="text-[var(--foreground-muted)]" />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <p className="text-[18px] text-[var(--foreground)] leading-relaxed whitespace-pre-wrap mb-4">
                            {post.content}
                        </p>

                        {post.media_url && (
                            <div className="mb-4 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background)]">
                                <img src={post.media_url} className="w-full object-contain max-h-[500px]" alt="" />
                            </div>
                        )}

                        {post.type === 'poll' && (
                            <div className="mb-4">
                                <PollView postId={post.id} userId={user?.id || ''} />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#F2F2F7]">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => handleVote('like')}
                                    className={`flex items-center gap-2 transition-all ${post.user_vote === 'like' ? 'text-[#007AFF] font-bold' : 'text-[#8E8E93]'}`}
                                >
                                    <ThumbsUp size={22} strokeWidth={post.user_vote === 'like' ? 2.5 : 1.5} />
                                    <span className="text-[15px]">{post.likes_count || 0}</span>
                                </button>
                                <button
                                    onClick={() => handleVote('dislike')}
                                    className={`flex items-center gap-2 transition-all ${post.user_vote === 'dislike' ? 'text-[#FF3B30] font-bold' : 'text-[#8E8E93]'}`}
                                >
                                    <ThumbsDown size={22} strokeWidth={post.user_vote === 'dislike' ? 2.5 : 1.5} />
                                </button>
                                <div className="flex items-center gap-2 text-[#8E8E93]">
                                    <MessageCircle size={22} />
                                    <span className="text-[15px]">{post.comments_count || 0}</span>
                                </div>
                            </div>
                            <button className="text-[#8E8E93] hover:text-[#007AFF] transition-colors">
                                <Repeat size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-[var(--surface)] rounded-[24px] shadow-sm border border-[var(--border)] overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--border)]">
                            <h3 className="text-[17px] font-bold text-[var(--foreground)]">Comments</h3>
                        </div>
                        <div className="p-1">
                            <CommentSection post={post} userId={user?.id || ''} />
                        </div>
                    </div>

                    <PostShareModal
                        isOpen={isShareOpen}
                        onClose={() => setIsShareOpen(false)}
                        post={post}
                    />
                </div>
            </div>
        </div>
    );
}
