import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { useFeed } from '../../hooks/useFeed';
import { useAppStore } from '../../stores/appStore';
import {
    Sparkles,
    MessageSquare,
    Calendar,
    HelpCircle,
    Eye,
    Plus,
    Shield,
    ThumbsUp,
    ThumbsDown,
    Repeat,
    MessageCircle,
    Globe,
    Image as LucideImage
} from 'lucide-react';
import { PollView } from '../../components/feed/PollView';
import { StoryBar } from '../../components/stories/StoryBar';
import { FeedService } from '../../services/feedService';
import { PostShareModal } from '../../components/feed/PostShareModal';
import { UserService } from '../../services/userService';
import { Share, Search as SearchIcon } from 'lucide-react';

const categories = [
    { key: 'all', label: 'All', icon: Sparkles },
    { key: 'general', label: 'General', icon: MessageSquare },
    { key: 'event', label: 'Events', icon: Calendar },
    { key: 'anonymous', label: 'Pulse', icon: Eye },
    { key: 'question', label: 'Q&A', icon: HelpCircle },
];

export default function CampusFeedPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useAppStore();
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
    const campusId = (user?.profile as any)?.campus_id || 'befcc309-623b-47eb-b3f3-83911eae09c7';
    const { posts, loading, refresh, handleVote } = useFeed(campusId, activeCategory, activeHashtag);
    const [sharingPost, setSharingPost] = useState<any>(null);

    useEffect(() => {
        if (location.state?.hashtag) {
            setActiveHashtag(location.state.hashtag);
            setActiveCategory('all');
            // Clear state after consumption
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        refresh();
    }, [activeCategory, activeHashtag, refresh]);

    const handleRemix = async (post: any) => {
        if (!user?.id) return;
        try {
            const { error } = await FeedService.repost(user.id, campusId, post.id);
            if (error) throw error;
            showToast('Reposted to your timeline!', 'success');
            refresh();
        } catch (err) {
            showToast('Repost failed.', 'error');
        }
    };

    const renderContent = (content: string) => {
        const parts = content.split(/(\s+)/);
        return parts.map((part, i) => {
            if (part.startsWith('#')) {
                return (
                    <span
                        key={i}
                        className="text-[#007AFF] font-semibold hover:underline cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveHashtag(part);
                            setActiveCategory('all');
                        }}
                    >
                        {part}
                    </span>
                );
            }
            if (part.startsWith('@')) {
                return (
                    <span
                        key={i}
                        className="text-[#007AFF] font-semibold hover:underline cursor-pointer"
                        onClick={async (e) => {
                            e.stopPropagation();
                            const name = part.slice(1);
                            const { data } = await UserService.searchProfiles(name, campusId, 1);
                            if (data && data.length > 0) {
                                navigate(`/app/profile/${data[0].id}`);
                            } else {
                                showToast(`User ${part} not found`, 'info');
                            }
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="h-full bg-[var(--background)] flex flex-col overflow-hidden font-sans">
            <StoryBar campusId={campusId} currentUser={user as any} />
            {/* iOS Category Header */}
            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 flex items-center gap-2 shrink-0">
                <button
                    onClick={() => navigate('/app/campus/explore')}
                    className="p-1.5 bg-[var(--background)] rounded-full text-[var(--foreground-muted)] hover:text-[#007AFF] transition-all mr-1"
                >
                    <SearchIcon size={20} />
                </button>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
                    {categories.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => {
                                setActiveCategory(cat.key);
                                setActiveHashtag(undefined);
                            }}
                            className={`px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${activeCategory === cat.key && !activeHashtag
                                ? 'bg-[var(--foreground)] text-[var(--surface)] shadow-sm'
                                : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                    {activeHashtag && (
                        <button
                            onClick={() => setActiveHashtag(undefined)}
                            className="px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all bg-[#007AFF] text-white shadow-sm flex items-center gap-1.5 shrink-0"
                        >
                            {activeHashtag}
                            <span className="text-white/60 font-medium">×</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Posts List */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-[var(--background)]">
                <div className="flex flex-col gap-2 p-2">
                    {loading && posts.length === 0 && (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-[20px] p-4 animate-pulse">
                                    <div className="flex gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-[#F2F2F7]" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-24 bg-[#F2F2F7] rounded" />
                                            <div className="h-3 w-16 bg-[#F2F2F7] rounded" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-[#F2F2F7] rounded" />
                                        <div className="h-4 w-3/4 bg-[#F2F2F7] rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && posts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white rounded-[20px] m-2 p-10 mt-10">
                            <LucideImage size={48} className="text-[#E5E5EA]" strokeWidth={1} />
                            <div>
                                <h3 className="text-[17px] font-bold text-black">No Posts Yet</h3>
                                <p className="text-[15px] text-[#8E8E93] mt-1 px-4">Be the first to share something with the campus!</p>
                            </div>
                            <button
                                onClick={() => navigate('/app/campus/post/new')}
                                className="mt-2 text-[#007AFF] font-bold text-[17px]"
                            >
                                Create Post
                            </button>
                        </div>
                    )}

                    {posts.map((post) => (
                        <div key={post.id} className="bg-[var(--surface)] rounded-[20px] overflow-hidden shadow-sm border border-[var(--border)]">
                            {/* Post Header */}
                            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--background)] overflow-hidden border border-[var(--border)]">
                                        {post.is_anonymous ? (
                                            <div className="w-full h-full bg-[var(--foreground-muted)] flex items-center justify-center">
                                                <Shield className="text-[var(--surface)]/50" size={20} />
                                            </div>
                                        ) : (
                                            <img src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.display_name}&background=E5E5EA&color=8E8E93`} className="w-full h-full object-cover" alt="" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-[15px] font-bold text-[var(--foreground)] leading-none">
                                            {post.is_anonymous ? 'Anonymous' : post.author?.display_name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[11px] text-[#8E8E93] font-medium uppercase">
                                                {new Date(post.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                            <span className="text-[#8E8E93]">•</span>
                                            <Globe size={10} className="text-[#8E8E93]" />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemix(post)}
                                    className="p-2 text-[#8E8E93] hover:text-[#007AFF] transition-colors"
                                >
                                    <Repeat size={18} />
                                </button>
                            </div>

                            {/* Post Content */}
                            <div
                                className="px-4 pb-4 cursor-pointer"
                                onClick={() => navigate(`/app/campus/post/${post.id}`)}
                            >
                                <p className="text-[16px] text-[var(--foreground)] leading-snug mb-3">
                                    {renderContent(post.content)}
                                </p>
                                {post.media_url && (
                                    <div className="rounded-2xl overflow-hidden bg-[var(--background)] border border-[var(--border)]">
                                        <img src={post.media_url} className="w-full object-cover max-h-[400px]" alt="" />
                                    </div>
                                )}
                                {post.type === 'poll' && (
                                    <div className="mt-2">
                                        <PollView postId={post.id} userId={user?.id || ''} />
                                    </div>
                                )}
                            </div>

                            {/* Action Row */}
                            <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleVote(post.id, 'like', user?.id || '')}
                                        className={`flex items-center gap-1.5 transition-all text-[14px] ${post.user_vote === 'like' ? 'text-[#007AFF] font-bold' : 'text-[#8E8E93]'}`}
                                    >
                                        <ThumbsUp size={20} strokeWidth={post.user_vote === 'like' ? 2.5 : 1.5} />
                                        <span>{post.likes_count || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => handleVote(post.id, 'dislike', user?.id || '')}
                                        className={`flex items-center gap-1.5 transition-all text-[14px] ${post.user_vote === 'dislike' ? 'text-[#FF3B30] font-bold' : 'text-[#8E8E93]'}`}
                                    >
                                        <ThumbsDown size={20} strokeWidth={post.user_vote === 'dislike' ? 2.5 : 1.5} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5 text-[14px] text-[#8E8E93]">
                                    <MessageCircle size={20} strokeWidth={1.5} />
                                    <span>{post.comments_count || 0}</span>
                                </div>
                                <button
                                    onClick={() => setSharingPost(post)}
                                    className="p-1 text-[#8E8E93] hover:text-[#007AFF] transition-colors"
                                >
                                    <Share size={20} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                    ))
                    }
                    <div className="h-20" /> {/* Bottom Spacing */}
                </div >
            </div >

            {sharingPost && (
                <PostShareModal
                    isOpen={!!sharingPost}
                    onClose={() => setSharingPost(null)}
                    post={sharingPost}
                />
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => navigate('/app/campus/post/new')}
                className="fixed bottom-24 right-6 w-14 h-14 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all z-40"
            >
                <Plus size={30} strokeWidth={2.5} />
            </button>
        </div >
    );
}
