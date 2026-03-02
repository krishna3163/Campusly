import React, { useState, useRef, useEffect } from 'react';
import {
    X,
    Zap,
    RotateCw,
    Circle,
    Pause,
    Play,
    Image as ImageIcon,
    Settings,
    Grid,
    Sun,
    Moon,
    Smile,
    ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StoryCameraProps {
    onCapture: (file: File, type: 'image' | 'video') => void;
    onClose: () => void;
}

export const StoryCamera: React.FC<StoryCameraProps> = ({ onCapture, onClose }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [flash, setFlash] = useState(false);
    const [mode, setMode] = useState<15 | 30 | 60>(15);
    const [timer, setTimer] = useState(0);
    const [showGrid, setShowGrid] = useState(false);
    const [filter, setFilter] = useState('none');

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [facingMode]);

    const startCamera = async () => {
        try {
            if (streamRef.current) stopCamera();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode },
                audio: true
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Camera access failed", err);
        }
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.filter = filter === 'none' ? 'none' : filter;
            ctx.drawImage(videoRef.current, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file, 'image');
                }
            }, 'image/jpeg', 0.9);
        }
    };

    const startRecording = () => {
        if (!streamRef.current) return;
        chunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
            const file = new File([blob], `video_${Date.now()}.mp4`, { type: 'video/mp4' });
            onCapture(file, 'video');
        };

        recorder.start();
        setIsRecording(true);
        setTimer(0);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const filters = [
        { name: 'none', label: 'Normal', css: 'none' },
        { name: 'sepia', label: 'Sepia', css: 'sepia(0.8)' },
        { name: 'grayscale', label: 'B&W', css: 'grayscale(1)' },
        { name: 'vibrant', label: 'Vibrant', css: 'saturate(2) contrast(1.1)' },
        { name: 'blur', label: 'Dreamy', css: 'blur(2px) saturate(1.5)' },
    ];

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 z-[150] bg-black flex flex-col overflow-hidden"
        >
            {/* Camera Viewport */}
            <div className="flex-1 relative bg-campus-darker">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ filter }}
                />

                {/* Visual Overlays */}
                {showGrid && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="border border-white/10"></div>
                        ))}
                    </div>
                )}

                {/* Top Controls */}
                <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-50">
                    <button onClick={onClose} className="p-2 bg-black/40 rounded-full text-white">
                        <X size={24} />
                    </button>
                    <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full">
                        <button onClick={() => setFlash(!flash)} className={`p-2 transition-all ${flash ? 'text-yellow-400' : 'text-white/60'}`}>
                            <Zap size={20} fill={flash ? 'currentColor' : 'none'} />
                        </button>
                        <div className="w-[1px] h-4 bg-white/20"></div>
                        <button onClick={() => setShowGrid(!showGrid)} className={`p-2 transition-all ${showGrid ? 'text-brand-400' : 'text-white/60'}`}>
                            <Grid size={20} />
                        </button>
                    </div>
                    <button onClick={() => setFacingMode(m => m === 'user' ? 'environment' : 'user')} className="p-2 bg-black/40 rounded-full text-white">
                        <RotateCw size={24} />
                    </button>
                </div>

                {/* Progress Bar (if recording) */}
                {isRecording && (
                    <div className="absolute top-20 inset-x-8 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-red-500"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: mode, ease: 'linear' }}
                            onAnimationComplete={stopRecording}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="p-12 bg-black flex flex-col gap-10">
                {/* Filter Selector */}
                <div className="flex justify-center gap-6 overflow-x-auto scrollbar-hide px-4">
                    {filters.map(f => (
                        <button
                            key={f.name}
                            onClick={() => setFilter(f.css)}
                            className={`flex flex-col items-center gap-2 transition-all ${filter === f.css ? 'scale-110' : 'opacity-40 scale-90'}`}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/10 overflow-hidden border border-white/20" style={{ filter: f.css }}>
                                <div className="w-full h-full bg-gradient-to-tr from-brand-500 to-indigo-600"></div>
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-white">{f.label}</span>
                        </button>
                    ))}
                </div>

                {/* Main Shutter Row */}
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/60 overflow-hidden cursor-pointer hover:bg-white/20 transition-all">
                        <ImageIcon size={24} />
                    </div>

                    <div className="relative group">
                        <button
                            onMouseDown={() => {
                                // Start recording if held
                                startRecording();
                            }}
                            onMouseUp={() => {
                                // Stop recording on release
                                stopRecording();
                            }}
                            onClick={() => {
                                // Single tap for photo
                                capturePhoto();
                            }}
                            className={`w-24 h-24 rounded-full border-[6px] border-white flex items-center justify-center transition-all ${isRecording ? 'scale-125 border-red-500' : 'active:scale-95'}`}
                        >
                            <div className={`w-18 h-18 rounded-full transition-all ${isRecording ? 'bg-red-500 scale-50 rounded-lg' : 'bg-white'}`}></div>
                        </button>
                        {!isRecording && (
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/40 uppercase tracking-widest">Hold to Record</span>
                        )}
                    </div>

                    <div className="w-12 h-12 flex flex-col items-center justify-center gap-1">
                        <button
                            onClick={() => setMode(m => m === 15 ? 30 : m === 30 ? 60 : 15)}
                            className="bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest text-white border border-white/20 transition-all hover:bg-white/20"
                        >
                            {mode}S
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
