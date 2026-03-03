import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { motion } from 'framer-motion';
import {
    X,
    Video,
    Type,
    Music,
    Sparkles,
    Upload,
    Play,
    Pause,
    Scissors,
    Send,
    Camera
} from 'lucide-react';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { useAppStore } from '../../stores/appStore';
import { insforge } from '../../lib/insforge';

export default function ReelComposerPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { showToast } = useAppStore();
    const { uploadFile } = useMediaUpload();
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [showCaptionInput, setShowCaptionInput] = useState(false);

    const filters = [
        { id: 'none', label: 'Original', css: '' },
        { id: 'warm', label: 'Warm', css: 'sepia(0.3) saturate(1.4)' },
        { id: 'cool', label: 'Cool', css: 'hue-rotate(30deg) saturate(1.2)' },
        { id: 'bw', label: 'B&W', css: 'grayscale(1)' },
        { id: 'vintage', label: 'Vintage', css: 'sepia(0.5) contrast(1.1) brightness(0.9)' },
        { id: 'vivid', label: 'Vivid', css: 'saturate(1.8) contrast(1.1)' },
        { id: 'fade', label: 'Fade', css: 'contrast(0.8) brightness(1.1) saturate(0.8)' },
    ];

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('video/')) {
            showToast('Please select a video file.', 'error');
            return;
        }
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
    };

    const togglePlayPause = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handlePublish = async () => {
        if (!videoFile || !user?.id) return;
        setUploading(true);
        try {
            const url = await uploadFile(videoFile, 'campus-reels');
            if (!url) throw new Error('Upload failed');

            const campusId = (user.profile as any)?.campus_id || 'befcc309-623b-47eb-b3f3-83911eae09c7';

            await insforge.database.from('posts').insert({
                user_id: user.id,
                campus_id: campusId,
                content: caption,
                type: 'reel',
                media_url: url,
                media_type: 'video',
                category: 'general',
                is_anonymous: false,
                metadata: { filter: selectedFilter }
            });

            showToast('Reel published!', 'success');
            navigate('/app/campus');
        } catch (err) {
            showToast('Failed to publish reel.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="h-full bg-black flex flex-col overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                    <X size={22} />
                </button>
                <h3 className="text-[17px] font-bold text-white">New Reel</h3>
                {videoFile ? (
                    <button
                        onClick={handlePublish}
                        disabled={uploading}
                        className="px-5 py-2 bg-[#007AFF] rounded-full text-white text-[14px] font-bold disabled:opacity-50 flex items-center gap-2"
                    >
                        {uploading ? 'Publishing...' : <><Send size={16} /> Post</>}
                    </button>
                ) : (
                    <div className="w-10" />
                )}
            </div>

            {/* Video Preview / Upload Area */}
            <div className="flex-1 relative flex items-center justify-center">
                {videoPreview ? (
                    <>
                        <video
                            ref={videoRef}
                            src={videoPreview}
                            className="h-full w-full object-cover"
                            style={{ filter: filters.find(f => f.id === selectedFilter)?.css || '' }}
                            loop
                            playsInline
                            onClick={togglePlayPause}
                        />
                        {!isPlaying && (
                            <button onClick={togglePlayPause} className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Play size={36} className="text-white ml-1" />
                                </div>
                            </button>
                        )}

                        {/* Side Tools */}
                        <div className="absolute right-4 bottom-32 flex flex-col gap-5">
                            <button onClick={() => setShowCaptionInput(!showCaptionInput)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                                <Type size={20} />
                            </button>
                            <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                                <Music size={20} />
                            </button>
                            <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                                <Scissors size={20} />
                            </button>
                            <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                                <Sparkles size={20} />
                            </button>
                        </div>

                        {/* Caption Overlay */}
                        {showCaptionInput && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="absolute bottom-24 left-4 right-4"
                            >
                                <input
                                    autoFocus
                                    value={caption}
                                    onChange={e => setCaption(e.target.value)}
                                    placeholder="Write a caption..."
                                    className="w-full bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-white placeholder:text-white/50 text-[15px] outline-none"
                                    onBlur={() => setShowCaptionInput(false)}
                                />
                            </motion.div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-6 text-center px-10">
                        <div className="w-28 h-28 rounded-[36px] bg-white/5 border border-white/10 flex items-center justify-center">
                            <Video size={48} className="text-white/40" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Create a Reel</h2>
                        <p className="text-white/50 text-[15px]">Record or upload a short video to share with your campus.</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-[#007AFF] rounded-2xl text-white font-bold text-[15px] flex items-center gap-2"
                            >
                                <Upload size={18} /> Upload Video
                            </button>
                            <button className="px-6 py-3 bg-white/10 rounded-2xl text-white font-bold text-[15px] flex items-center gap-2">
                                <Camera size={18} /> Record
                            </button>
                        </div>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoSelect}
                />
            </div>

            {/* Filter Strip */}
            {videoPreview && (
                <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 px-4 py-4 pb-safe">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar">
                        {filters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSelectedFilter(f.id)}
                                className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${selectedFilter === f.id ? 'bg-[#007AFF] text-white' : 'bg-white/10 text-white/60'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
