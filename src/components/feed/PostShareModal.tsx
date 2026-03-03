import React, { useState, useEffect } from 'react';
import {
    Send,
    Link,
    Share2,
    MessageCircle,
    Repeat,
    MoreHorizontal,
    Search,
    Check
} from 'lucide-react';
import { BottomSheet, BottomSheetItem } from '../ui/BottomSheet';
import { ConversationService } from '../../services/conversationService';
import { MessageService } from '../../services/messageService';
import { FeedService } from '../../services/feedService';
import { useAppStore } from '../../stores/appStore';
import { useUser } from '@insforge/react';

interface PostShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: any;
}

export const PostShareModal: React.FC<PostShareModalProps> = ({
    isOpen,
    onClose,
    post
}) => {
    const { user } = useUser();
    const { showToast } = useAppStore();
    const [recentChats, setRecentChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sharingTo, setSharingTo] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user?.id) {
            loadRecentChats();
        }
    }, [isOpen, user?.id]);

    const loadRecentChats = async () => {
        setLoading(true);
        const { data } = await ConversationService.getRecentConversations(user!.id, 8);
        setRecentChats(data || []);
        setLoading(false);
    };

    const handleShareToDM = async (convId: string) => {
        if (!user?.id) return;
        setSharingTo(convId);
        try {
            const postUrl = `${window.location.origin}/app/campus/post/${post.id}`;
            const content = post.content ? `"${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}"` : 'Shared a post';

            await MessageService.sendMessage({
                conversationId: convId,
                senderId: user.id,
                content: `Check out this post on Campusly: ${postUrl}\n\n${content}`,
                type: 'text'
            });

            await FeedService.trackShare(post.id);
            showToast('Shared to chat!', 'success');
            onClose();
        } catch (err) {
            showToast('Failed to share', 'error');
        } finally {
            setSharingTo(null);
        }
    };

    const handleCopyLink = async () => {
        const postUrl = `${window.location.origin}/app/campus/post/${post.id}`;
        await navigator.clipboard.writeText(postUrl);
        await FeedService.trackShare(post.id);
        showToast('Link copied!', 'success');
        onClose();
    };

    const handleExternalShare = async () => {
        const postUrl = `${window.location.origin}/app/campus/post/${post.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Campusly Post',
                    text: post.content?.substring(0, 100),
                    url: postUrl,
                });
                await FeedService.trackShare(post.id);
                onClose();
            } catch (err) {
                // User cancelled or error
            }
        } else {
            handleCopyLink();
        }
    };

    const handleRepost = async () => {
        if (!user?.id) return;
        const campusId = (user.profile as any)?.campus_id || 'befcc309-623b-47eb-b3f3-83911eae09c7';
        const { error } = await FeedService.repost(user.id, campusId, post.id);
        if (!error) {
            showToast('Reposted to your timeline!', 'success');
            onClose();
        } else {
            showToast('Repost failed', 'error');
        }
    };

    const filteredChats = recentChats.filter(c => {
        const name = (c.type === 'private' || c.type === 'direct') ? c.other_user?.display_name : c.name;
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Share">
            <div className="flex flex-col gap-6 py-2">
                {/* Search Bar */}
                <div className="px-4">
                    <div className="relative flex items-center bg-[#F2F2F7] rounded-xl px-3 py-2 border border-black/5 focus-within:bg-white transition-all">
                        <Search size={18} className="text-[#8E8E93] mr-2" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="bg-transparent outline-none text-[15px] flex-1 text-black placeholder:text-[#BBB]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Quick Share Horizontal Scroll */}
                <div className="flex flex-col gap-3">
                    <h4 className="px-5 text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider">Recent Chats</h4>
                    <div className="flex items-start gap-4 overflow-x-auto no-scrollbar px-4 pb-2">
                        {loading && [1, 2, 3, 4].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
                                <div className="w-14 h-14 rounded-full bg-[#F2F2F7]" />
                                <div className="w-12 h-3 bg-[#F2F2F7] rounded" />
                            </div>
                        ))}
                        {!loading && filteredChats.map(conv => {
                            const isPrivate = conv.type === 'private' || conv.type === 'direct';
                            const name = isPrivate ? conv.other_user?.display_name : conv.name;
                            const avatar = isPrivate ? conv.other_user?.avatar_url : conv.avatar_url;

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => handleShareToDM(conv.id)}
                                    disabled={!!sharingTo}
                                    className="flex flex-col items-center gap-1.5 shrink-0 group w-16"
                                >
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full bg-[#F2F2F7] overflow-hidden border border-black/5 flex items-center justify-center group-active:scale-95 transition-transform">
                                            {avatar ? (
                                                <img src={avatar} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-xl font-bold text-[#8E8E93] uppercase">
                                                    {name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        {sharingTo === conv.id && (
                                            <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                                                <div className="w-5 h-5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-medium text-black truncate w-full text-center">
                                        {name?.split(' ')[0]}
                                    </span>
                                </button>
                            );
                        })}
                        {!loading && recentChats.length === 0 && (
                            <div className="py-2 px-1 text-[13px] text-[#8E8E93] italic">No recent chats found</div>
                        )}
                    </div>
                </div>

                {/* Action List */}
                <div className="flex flex-col px-2 pb-4">
                    <BottomSheetItem
                        icon={<Repeat size={20} className="text-[#007AFF]" />}
                        label="Repost to Feed"
                        onClick={handleRepost}
                    />
                    <BottomSheetItem
                        icon={<Link size={20} className="text-[#007AFF]" />}
                        label="Copy Link"
                        onClick={handleCopyLink}
                    />
                    <BottomSheetItem
                        icon={<Share2 size={20} className="text-[#007AFF]" />}
                        label="Share via..."
                        onClick={handleExternalShare}
                    />
                    <BottomSheetItem
                        icon={<MessageCircle size={20} className="text-[#007AFF]" />}
                        label="Send to more friends"
                        onClick={() => {
                            onClose();
                            showToast('Opening contact selector...', 'info');
                        }}
                    />
                </div>
            </div>
        </BottomSheet>
    );
};
