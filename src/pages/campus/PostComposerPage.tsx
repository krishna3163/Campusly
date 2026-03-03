import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { motion } from 'framer-motion';
import {
    X,
    Image as LucideImage,
    Camera,
    BarChart2,
    Shield,
    Globe,
    AlertCircle
} from 'lucide-react';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { FeedService } from '../../services/feedService';
import { useAppStore } from '../../stores/appStore';
import MentionSuggestions from '../../components/feed/MentionSuggestions';

export default function PostComposerPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { showToast } = useAppStore();
    const { uploadFile } = useMediaUpload();

    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isPollMode, setIsPollMode] = useState(false);
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
    const [uploading, setUploading] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);

    const campusId = (user?.profile as any)?.campus_id || 'befcc309-623b-47eb-b3f3-83911eae09c7';

    const handleContentChange = (text: string) => {
        setContent(text);
        // Detect @mention trigger
        const lastAtIndex = text.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            const afterAt = text.slice(lastAtIndex + 1);
            const hasSpace = afterAt.includes(' ');
            if (!hasSpace && afterAt.length > 0) {
                setMentionQuery(afterAt);
                setShowMentions(true);
                return;
            }
        }
        setShowMentions(false);
        setMentionQuery('');
    };

    const handleMentionSelect = (u: { id: string; display_name: string }) => {
        const lastAtIndex = content.lastIndexOf('@');
        const newContent = content.slice(0, lastAtIndex) + `@${u.display_name} `;
        setContent(newContent);
        setShowMentions(false);
        setMentionQuery('');
    };

    const handleShare = async () => {
        if (!content.trim() && !mediaFile && !isPollMode) {
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
                    setUploading(false);
                    return;
                }
                const { error } = await FeedService.createPoll(user.id, campusId, content, filtered);
                if (error) throw error;
            } else {
                let mediaUrl = null;
                let mediaType: string | null = null;
                if (mediaFile) {
                    const url = await uploadFile(mediaFile, 'campus-media');
                    mediaUrl = url;
                    mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
                }

                const { error } = await FeedService.createPost(user.id, campusId, {
                    content,
                    category: 'general', // Default for now, could be passed as state
                    is_anonymous: isAnonymous,
                    type: mediaUrl ? 'media' : 'text',
                    media_url: mediaUrl,
                    media_type: mediaType
                });
                if (error) throw error;
            }

            showToast('Post shared successfully.', 'success');
            navigate('/app/campus');
        } catch (err) {
            showToast('Post failed.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="h-full bg-[var(--background)] flex flex-col overflow-hidden">
            {/* iOS Header */}
            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shrink-0">
                <button onClick={() => navigate(-1)} className="text-[#007AFF] text-[17px]">Cancel</button>
                <h3 className="text-[17px] font-bold text-[var(--foreground)]">New Post</h3>
                <button
                    onClick={handleShare}
                    disabled={uploading || (!content.trim() && !mediaFile && !isPollMode)}
                    className="text-[#007AFF] text-[17px] font-bold disabled:opacity-30"
                >
                    {uploading ? 'Sharing...' : 'Share'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                <div className="flex gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border)] flex-shrink-0">
                        <img
                            src={user?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${user?.profile?.display_name}&background=F2F2F7&color=8E8E93`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="relative flex-1">
                        <MentionSuggestions
                            query={mentionQuery}
                            campusId={campusId}
                            onSelect={handleMentionSelect}
                            visible={showMentions}
                        />
                        <textarea
                            autoFocus
                            value={content}
                            onChange={(e) => handleContentChange(e.target.value)}
                            placeholder={isPollMode ? "Ask a question..." : "What's happening on campus?"}
                            className="w-full bg-transparent border-none focus:ring-0 text-[19px] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none pt-1 min-h-[120px]"
                        />
                    </div>
                </div>

                {isPollMode && (
                    <div className="space-y-3 mb-6 pl-12 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-[14px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Poll Options</h4>
                        {pollOptions.map((opt, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <input
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={e => {
                                        const copy = [...pollOptions];
                                        copy[i] = e.target.value;
                                        setPollOptions(copy);
                                    }}
                                    className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-3 text-[16px] text-[var(--foreground)] outline-none focus:border-[#007AFF]"
                                />
                                {pollOptions.length > 2 && (
                                    <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-[#FF3B30] p-2 hover:bg-red-50 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {pollOptions.length < 5 && (
                            <button
                                onClick={() => setPollOptions([...pollOptions, ''])}
                                className="text-[#007AFF] text-[15px] font-bold py-2 px-1"
                            >
                                + Add another option
                            </button>
                        )}
                    </div>
                )}

                {mediaFile && !isPollMode && (
                    <div className="relative mt-2 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] animate-in zoom-in-95 duration-200">
                        <img src={URL.createObjectURL(mediaFile)} className="w-full max-h-[400px] object-contain" />
                        <button
                            onClick={() => setMediaFile(null)}
                            className="absolute top-3 right-3 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md shadow-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className="mt-8 p-4 bg-[var(--surface)] rounded-2xl flex items-center gap-3">
                    <Globe size={18} className="text-[var(--foreground-muted)]" />
                    <span className="text-[14px] text-[var(--foreground-muted)]">Everyone on your campus can see this post.</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-[var(--surface)] border-t border-[var(--border)] p-5 pb-safe flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <label className="cursor-pointer text-[#007AFF] active:scale-90 transition-transform">
                        <LucideImage size={28} />
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                setMediaFile(e.target.files?.[0] || null);
                                setIsPollMode(false);
                            }}
                        />
                    </label>
                    <button className="text-[#007AFF] active:scale-90 transition-transform">
                        <Camera size={28} />
                    </button>
                    <button
                        onClick={() => {
                            setIsPollMode(!isPollMode);
                            if (mediaFile) setMediaFile(null);
                        }}
                        className={` active:scale-90 transition-all ${isPollMode ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}
                    >
                        <BarChart2 size={28} />
                    </button>
                </div>

                <button
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-all ${isAnonymous ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-lg' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-muted)]'}`}
                >
                    <Shield size={16} />
                    <span className="text-[14px] font-bold uppercase tracking-tight">Ghost Pulse</span>
                </button>
            </div>
        </div>
    );
}
