import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Download,
    Share2,
    MoreVertical,
    Play,
    Pause,
    Volume2,
    VolumeX,
    FileText,
    Image as ImageIcon,
    Film
} from 'lucide-react';

interface MediaItem {
    url: string;
    type: 'image' | 'video' | 'document';
    name?: string;
}

interface MediaGalleryProps {
    items: MediaItem[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function MediaGallery({ items, initialIndex = 0, isOpen, onClose }: MediaGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const current = items[currentIndex];

    const goNext = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setZoom(1);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setZoom(1);
        }
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = current.url;
        a.download = current.name || 'media';
        a.target = '_blank';
        a.click();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] bg-black flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                        <X size={22} />
                    </button>
                    <span className="text-white text-[14px] font-semibold">{currentIndex + 1} / {items.length}</span>
                    <div className="flex gap-2">
                        <button onClick={handleDownload} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center relative">
                    {current.type === 'image' && (
                        <img
                            src={current.url}
                            className="max-w-full max-h-full object-contain transition-transform duration-200"
                            style={{ transform: `scale(${zoom})` }}
                            alt=""
                        />
                    )}
                    {current.type === 'video' && (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <video
                                ref={videoRef}
                                src={current.url}
                                className="max-w-full max-h-full object-contain"
                                playsInline
                                onClick={togglePlay}
                                onEnded={() => setIsPlaying(false)}
                            />
                            {!isPlaying && (
                                <button onClick={togglePlay} className="absolute">
                                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                        <Play size={36} className="text-white ml-1" />
                                    </div>
                                </button>
                            )}
                        </div>
                    )}
                    {current.type === 'document' && (
                        <div className="flex flex-col items-center gap-4 text-center px-10">
                            <FileText size={64} className="text-white/30" />
                            <p className="text-white font-semibold">{current.name || 'Document'}</p>
                            <button onClick={handleDownload} className="px-6 py-3 bg-[#007AFF] rounded-2xl text-white font-bold text-[14px]">
                                Download
                            </button>
                        </div>
                    )}

                    {/* Navigation Arrows */}
                    {currentIndex > 0 && (
                        <button onClick={goPrev} className="absolute left-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    {currentIndex < items.length - 1 && (
                        <button onClick={goNext} className="absolute right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                            <ChevronRight size={24} />
                        </button>
                    )}
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-4 pb-safe flex items-center justify-center gap-4">
                    {current.type === 'image' && (
                        <>
                            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                <ZoomOut size={18} />
                            </button>
                            <span className="text-white text-[12px] font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                <ZoomIn size={18} />
                            </button>
                        </>
                    )}
                    {current.type === 'video' && (
                        <>
                            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                            </button>
                            <button onClick={() => { if (videoRef.current) videoRef.current.muted = !isMuted; setIsMuted(!isMuted); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                        </>
                    )}
                </div>

                {/* Thumbnail Strip */}
                {items.length > 1 && (
                    <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 px-4">
                        {items.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => { setCurrentIndex(i); setZoom(1); }}
                                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === currentIndex ? 'border-[#007AFF] scale-110' : 'border-white/20 opacity-50'}`}
                            >
                                {item.type === 'image' ? (
                                    <img src={item.url} className="w-full h-full object-cover" alt="" />
                                ) : item.type === 'video' ? (
                                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                        <Film size={14} className="text-white" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                        <FileText size={14} className="text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
