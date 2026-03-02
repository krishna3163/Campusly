import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    X,
    ImageIcon,
    Shield,
    ThumbsUp,
    ThumbsDown,
    Repeat,
    MessageCircle,
    Globe,
    Camera,
    BarChart2,
    Image as LucideImage
} from 'lucide-react';
import { CommentSection } from '../../components/feed/CommentSection';
import { PollView } from '../../components/feed/PollView';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { FeedService } from '../../services/feedService';

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
    const { showToast } = useAppStore();
    const { uploadFile } = useMediaUpload();
    const [activeCategory, setActiveCategory] = useState('all');
    const [showComposer, setShowComposer] = useState(false);
    const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
    const [newPostContent, setNewPostContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isPollMode, setIsPollMode] = useState(false);
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

    const campusId = (user?.profile as any)?.campus_id || 'befcc309-623b-47eb-b3f3-83911eae09c7';
    const { posts, loading, refresh, handleVote, addPost } = useFeed(campusId, activeCategory);

    useEffect(() => {
        refresh();
    }, [activeCategory, refresh]);

    const handleTransmit = async () => {
        if (!newPostContent.trim() && !mediaFile) {
            showToast('Enter some content or upload media!', 'info');
            return;
        }

        if (!user?.id) {
            showToast('Authentication required.', 'error');
            return;
        }

        setUploading(true);
        try {
            if (isPollMode) {
                const filtered = pollOptions.filter(o => o.trim());
                if (filtered.length < 2) {
                    showToast('Poll needs at least 2 options!', 'info');
                    return;
                }
                const { error } = await FeedService.createPoll(user.id, campusId, newPostContent, filtered);
                if (error) throw error;
            } else {
                let mediaUrl = null;
                let mediaType: string | null = null;
                if (mediaFile) {
                    const url = await uploadFile(mediaFile, 'campus-media');
                    mediaUrl = url;
                    mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
                }

                await addPost({
                    content: newPostContent,
                    category: activeCategory === 'all' ? 'general' : activeCategory,
                    is_anonymous: isAnonymous,
                    type: mediaUrl ? 'media' : 'text',
                    media_url: mediaUrl,
                    media_type: mediaType,
                    author: user.profile as any
                }, user.id);
            }

            setNewPostContent('');
            setMediaFile(null);
            setShowComposer(false);
            setIsAnonymous(false);
            setIsPollMode(false);
            setPollOptions(['', '']);
            showToast('Post shared successfully.', 'success');
            refresh();
        } catch (err) {
            showToast('Post failed.', 'error');
        } finally {
            setUploading(false);
        }
    };

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
                return <span key={i} className="text-[#007AFF] font-semibold hover:underline cursor-pointer">{part}</span>;
            }
            if (part.startsWith('@')) {
                return <span key={i} className="text-[#007AFF] font-semibold hover:underline cursor-pointer">{part}</span>;
            }
            return part;
        });
    };

    return (
        <div className="h-full bg-white flex flex-col overflow-hidden font-sans">
            {/* iOS Category Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA] px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${activeCategory === cat.key
                            ? 'bg-black text-white shadow-sm'
                            : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-black'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Posts List */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F2F2F7]">
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
                                onClick={() => setShowComposer(true)}
                                className="mt-2 text-[#007AFF] font-bold text-[17px]"
                            >
                                Create Post
                            </button>
                        </div>
                    )}

                    {posts.map((post) => (
                        <div key={post.id} className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-black/5">
                            {/* Card Header */}
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#F2F2F7] overflow-hidden border border-black/5">
                                        {post.is_anonymous ? (
                                            <div className="w-full h-full bg-[#8E8E93] flex items-center justify-center">
                                                <Shield className="text-white/50" size={20} />
                                            </div>
                                        ) : (
                                            <img src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.display_name}&background=E5E5EA&color=8E8E93`} className="w-full h-full object-cover" alt="" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-[15px] font-bold text-black leading-none">
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
                            <div className="px-4 pb-4">
                                <p className="text-[16px] text-black leading-snug mb-3">
                                    {renderContent(post.content)}
                                </p>
                                {post.media_url && (
                                    <div className="rounded-2xl overflow-hidden bg-[#F2F2F7] border border-black/5">
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
                            <div className="px-4 py-3 border-t border-[#F2F2F7] flex items-center justify-between">
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
                                <button
                                    onClick={() => setOpenCommentsId(openCommentsId === post.id ? null : post.id)}
                                    className={`flex items-center gap-1.5 text-[14px] ${openCommentsId === post.id ? 'text-[#007AFF] font-bold' : 'text-[#8E8E93]'}`}
                                >
                                    <MessageCircle size={20} strokeWidth={openCommentsId === post.id ? 2.5 : 1.5} />
                                    <span>{post.comments_count || 0}</span>
                                </button>
                            </div>

                            {/* Comment Section Sheet-like behavior */}
                            <AnimatePresence>
                                {openCommentsId === post.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-t border-[#F2F2F7]"
                                    >
                                        <div className="bg-[#F9F9F9] p-4">
                                            <CommentSection post={post} userId={user?.id || ''} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                    <div className="h-20" /> {/* Bottom Spacing */}
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setShowComposer(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all z-40"
            >
                <Plus size={30} strokeWidth={2.5} />
            </button>

            {/* Composer Modal Sheet */}
            <AnimatePresence>
                {showComposer && (
                    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowComposer(false)}>
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-[430px] bg-[#F2F2F7] rounded-t-[20px] overflow-hidden flex flex-col h-[85vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1.5 bg-[#BCBCC0] rounded-full mx-auto my-3" />

                            <div className="px-5 py-4 flex justify-between items-center bg-white border-b border-[#E5E5EA]">
                                <button onClick={() => setShowComposer(false)} className="text-[#007AFF] text-[17px]">Cancel</button>
                                <h3 className="text-[17px] font-bold">New Post</h3>
                                <button
                                    onClick={handleTransmit}
                                    disabled={uploading || (!newPostContent.trim() && !mediaFile && !isPollMode)}
                                    className="text-[#007AFF] text-[17px] font-bold disabled:opacity-30"
                                >
                                    Share
                                </button>
                            </div>

                            <div className="bg-white flex-1 p-5 flex flex-col">
                                <div className="flex gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-[#F2F2F7] overflow-hidden border border-black/5 flex-shrink-0">
                                        <img src={user?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${user?.profile?.display_name}&background=F2F2F7&color=8E8E93`} className="w-full h-full object-cover" />
                                    </div>
                                    <textarea
                                        autoFocus
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        placeholder={isPollMode ? "Question here..." : "What's happening?"}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-[18px] text-black placeholder:text-[#BBB] resize-none pt-1"
                                    />
                                </div>

                                {isPollMode && (
                                    <div className="space-y-2 mb-4 pl-12">
                                        {pollOptions.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    placeholder={`Option ${i + 1}`}
                                                    value={opt}
                                                    onChange={e => {
                                                        const copy = [...pollOptions];
                                                        copy[i] = e.target.value;
                                                        setPollOptions(copy);
                                                    }}
                                                    className="flex-1 bg-white border border-[#E5E5EA] rounded-xl px-4 py-2 text-[15px]"
                                                />
                                                {pollOptions.length > 2 && (
                                                    <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-[#FF3B30] p-1">
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {pollOptions.length < 5 && (
                                            <button
                                                onClick={() => setPollOptions([...pollOptions, ''])}
                                                className="text-[#007AFF] text-[14px] font-semibold pl-1"
                                            >
                                                + Add option
                                            </button>
                                        )}
                                    </div>
                                )}

                                {mediaFile && !isPollMode && (
                                    <div className="relative mt-2 rounded-2xl overflow-hidden border border-black/5 bg-[#F2F2F7]">
                                        <img src={URL.createObjectURL(mediaFile)} className="w-full max-h-[300px] object-cover" />
                                        <button
                                            onClick={() => setMediaFile(null)}
                                            className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Toolbar */}
                            <div className="bg-white border-t border-[#E5E5EA] p-4 pb-safe flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <label className="cursor-pointer text-[#007AFF] active:opacity-50 transition-opacity">
                                        <LucideImage size={24} />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                    <button className="text-[#007AFF] active:opacity-50 transition-opacity">
                                        <Camera size={24} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsPollMode(!isPollMode);
                                            if (mediaFile) setMediaFile(null);
                                        }}
                                        className={` transition-opacity ${isPollMode ? 'text-[#007AFF]' : 'text-[#8E8E93] hover:text-[#007AFF]'}`}
                                    >
                                        <BarChart2 size={24} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => setIsAnonymous(!isAnonymous)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isAnonymous ? 'bg-[#007AFF] border-[#007AFF] text-white' : 'bg-white border-[#E5E5EA] text-[#8E8E93]'}`}
                                >
                                    <Shield size={14} />
                                    <span className="text-[13px] font-bold uppercase tracking-tight">Ghost Pulse</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
