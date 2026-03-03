import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
    X,
    Heart,
    Send,
    ChevronLeft,
    ChevronRight,
    Eye,
    MessageCircle,
    Camera,
    Music,
    AlertCircle
} from 'lucide-react';
import { StatusStory, UserProfile } from '../../types';
import { StatusService } from '../../services/statusService';

interface StoryViewerProps {
    stories: StatusStory[];
    currentUser: UserProfile;
    onClose: () => void;
    onNextUser?: () => void;
    onPrevUser?: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
    stories,
    currentUser,
    onClose,
    onNextUser,
    onPrevUser
}) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [reply, setReply] = useState('');
    const [showReactions, setShowReactions] = useState(false);
    const [screenshotAlert, setScreenshotAlert] = useState<string | null>(null);

    const progressRef = useRef<any>(null);
    const currentStory = stories[currentIdx];
    const isMyStory = currentStory?.user_id === currentUser.id;

    // Auto-advance logic
    useEffect(() => {
        if (isPaused || !currentStory) return;

        const duration = 5000; // Fixed 5 seconds as per request
        const interval = 50;
        const step = (interval / duration) * 100;

        progressRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + step;
            });
        }, interval);

        return () => {
            if (progressRef.current) clearInterval(progressRef.current);
        };
    }, [currentIdx, isPaused, currentStory?.id]);

    // View tracking
    useEffect(() => {
        if (currentStory && !isMyStory) {
            StatusService.markViewed(currentUser.id, currentStory.id);
        }
    }, [currentIdx, currentStory?.id]);

    const handleNext = () => {
        if (currentIdx < stories.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setProgress(0);
        } else {
            if (onNextUser) onNextUser();
            else onClose();
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) {
            setCurrentIdx(prev => prev - 1);
            setProgress(0);
        } else {
            if (onPrevUser) onPrevUser();
            // else stay on first
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;
        await StatusService.reactToStory(currentUser.id, currentStory.id, '💬 ' + reply);
        setReply('');
        setIsPaused(false);
    };

    const simulateScreenshot = () => {
        setScreenshotAlert("Screenshot detected! Owner notified.");
        setTimeout(() => setScreenshotAlert(null), 3000);
    };

    if (!currentStory) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[1000] bg-black flex items-center justify-center touch-none overflow-hidden"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => {
                if (info.offset.y > 150) onClose();
            }}
        >
            <div className="relative w-full max-w-lg h-full bg-black md:aspect-[9/16] md:h-[90vh] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

                {/* Progress Indicators */}
                <div className="absolute top-4 inset-x-4 flex gap-1 z-[1100]">
                    {stories.map((_, i) => (
                        <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white"
                                initial={false}
                                animate={{
                                    width: i < currentIdx ? '100%' : (i === currentIdx ? `${progress}%` : '0%')
                                }}
                                transition={{ duration: 0 }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-8 inset-x-4 flex items-center justify-between z-[1100] px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--brand)] flex items-center justify-center font-bold border-2 border-white/20 overflow-hidden text-white">
                            {currentStory.user?.avatar_url ? (
                                <img src={currentStory.user.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <span>{currentStory.user?.display_name?.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <h4 className="text-white text-sm font-bold">{currentStory.user?.display_name}</h4>
                            <p className="text-white/60 text-[10px] font-medium leading-none">
                                {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/80 hover:text-white transition-all"><X size={24} /></button>
                </div>

                {/* Main Content Areas */}
                <div
                    className="flex-1 relative flex items-center justify-center"
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    {/* Interaction Regions */}
                    <div className="absolute inset-y-0 left-0 w-1/3 z-[1050]" onClick={(e) => { e.stopPropagation(); handlePrev(); }}></div>
                    <div className="absolute inset-y-0 right-0 w-1/3 z-[1050]" onClick={(e) => { e.stopPropagation(); handleNext(); }}></div>

                    {/* Content Rendering */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStory.id}
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            className="w-full h-full"
                        >
                            {currentStory.type === 'image' && (
                                <img src={currentStory.media_url} className="w-full h-full object-cover" />
                            )}
                            {currentStory.type === 'video' && (
                                <video
                                    src={currentStory.media_url}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            )}
                            {currentStory.type === 'text' && (
                                <div className={`w-full h-full p-12 flex flex-col items-center justify-center text-center bg-gradient-to-br ${currentStory.metadata?.bg_color || 'from-[#007AFF] to-[#5856D6]'}`}>
                                    <h2 className="text-3xl font-bold text-white leading-tight">
                                        {currentStory.content}
                                    </h2>
                                </div>
                            )}

                            {/* Caption Overlay */}
                            {currentStory.content && currentStory.type !== 'text' && (
                                <div className="absolute bottom-32 inset-x-0 p-8 pt-16 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-white text-base font-medium text-center leading-relaxed">
                                        {currentStory.content}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Interaction */}
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-[1100]">
                    {!isMyStory ? (
                        <div className="space-y-4">
                            <form onSubmit={handleReply} className="flex gap-4 items-center">
                                <div className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-5 py-3 border border-white/20 flex items-center justify-between">
                                    <input
                                        type="text"
                                        placeholder="Send message"
                                        className="bg-transparent border-none outline-none text-white text-[15px] font-medium w-full placeholder:text-white/50"
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        onFocus={() => setIsPaused(true)}
                                        onBlur={() => setIsPaused(false)}
                                    />
                                </div>
                                <button type="submit" className="text-white active:scale-95 transition-transform">
                                    <Send size={24} />
                                </button>
                            </form>
                            <div className="flex gap-4 justify-center">
                                {['🔥', '❤️', '😂', '😮', '😢', '👏'].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => { StatusService.reactToStory(currentUser.id, currentStory.id, emoji); }}
                                        className="text-2xl hover:scale-125 transition-all active:scale-90"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center text-white/60">
                            <div className="flex items-center gap-2 font-bold text-sm">
                                <Eye size={18} /> {currentStory.view_count || 0} Views
                            </div>
                            <button className="p-2 hover:text-white transition-all"><ChevronRight className="-rotate-90" /></button>
                        </div>
                    )}
                </div>

                {/* Screenshot Alert */}
                <AnimatePresence>
                    {screenshotAlert && (
                        <motion.div
                            initial={{ y: -100 }}
                            animate={{ y: 0 }}
                            exit={{ y: -100 }}
                            className="absolute inset-x-0 top-20 flex justify-center z-[2000] px-10"
                        >
                            <div className="bg-[#FF3B30] text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-bold shadow-lg">
                                <AlertCircle size={20} />
                                {screenshotAlert}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </motion.div>
    );
};

// Internal toast helper for brevity
const showToast = (msg: string, type: string) => {
    // In real app, this would use a global store
};
