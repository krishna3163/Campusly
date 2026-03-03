import { useRef, useState, useEffect } from 'react';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    SkipBack,
    SkipForward
} from 'lucide-react';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    autoPlay?: boolean;
    className?: string;
}

export default function VideoPlayer({ src, poster, autoPlay = false, className = '' }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const hideTimeout = useRef<any>(null);

    useEffect(() => {
        if (autoPlay && videoRef.current) {
            videoRef.current.play().catch(() => { });
        }
    }, [autoPlay]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
        setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const time = (parseFloat(e.target.value) / 100) * duration;
        videoRef.current.currentTime = time;
        setProgress(parseFloat(e.target.value));
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const skip = (seconds: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime += seconds;
    };

    const handleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        }
    };

    const formatTime = (t: number) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    return (
        <div
            className={`relative bg-black rounded-2xl overflow-hidden group ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
                playsInline
            />

            {/* Controls Overlay */}
            <div className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Center Play */}
                {!isPlaying && (
                    <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <Play size={28} className="text-white ml-1" />
                        </div>
                    </button>
                )}

                {/* Bottom Bar */}
                <div className="relative z-10 px-4 pb-4 space-y-2">
                    {/* Progress */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        style={{ background: `linear-gradient(to right, #007AFF ${progress}%, rgba(255,255,255,0.3) ${progress}%)` }}
                    />

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={togglePlay} className="text-white">
                                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                            <button onClick={() => skip(-10)} className="text-white/70">
                                <SkipBack size={18} />
                            </button>
                            <button onClick={() => skip(10)} className="text-white/70">
                                <SkipForward size={18} />
                            </button>
                            <span className="text-white/70 text-[12px] font-mono">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={toggleMute} className="text-white/70">
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <button onClick={handleFullscreen} className="text-white/70">
                                <Maximize size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
