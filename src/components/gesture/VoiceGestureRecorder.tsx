import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Trash2, Lock, Send, X } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { gesturePriorityManager, GestureType } from '../../services/GesturePriorityManager';

interface VoiceGestureRecorderProps {
    onStart: () => void;
    onCancel: () => void;
    onSend: () => void;
    onLock: () => void;
}

export const VoiceGestureRecorder: React.FC<VoiceGestureRecorderProps> = ({
    onStart,
    onCancel,
    onSend,
    onLock
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [gestureProgressX, setGestureProgressX] = useState(0); // For cancel (slide left)
    const [gestureProgressY, setGestureProgressY] = useState(0); // For lock (slide up)
    const startX = useRef(0);
    const startY = useRef(0);
    const cancelThreshold = -100;
    const lockThreshold = -100;

    const [timer, setTimer] = useState(0);
    const timerRef = useRef<any>(null);

    const startRecording = useCallback(() => {
        if (gesturePriorityManager.claim(GestureType.VOICE_RECORDING, 'voice-recorder')) {
            setIsRecording(true);
            setIsLocked(false);
            setTimer(0);
            onStart();
            if (navigator.vibrate) navigator.vibrate(50);

            timerRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
    }, [onStart]);

    const stopRecording = useCallback((send: boolean) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRecording(false);
        setIsLocked(false);
        setGestureProgressX(0);
        setGestureProgressY(0);

        if (send) onSend();
        else onCancel();

        gesturePriorityManager.release('voice-recorder');
    }, [onSend, onCancel]);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        startRecording();
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isRecording || isLocked) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - startX.current;
        const diffY = currentY - startY.current;

        // Slide left to cancel
        if (diffX < 0) {
            setGestureProgressX(Math.max(diffX, cancelThreshold));
            if (diffX <= cancelThreshold) {
                stopRecording(false);
            }
        }

        // Slide up to lock
        if (diffY < 0) {
            setGestureProgressY(Math.max(diffY, lockThreshold));
            if (diffY <= lockThreshold) {
                setIsLocked(true);
                onLock();
                if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
            }
        }
    };

    const handleTouchEnd = () => {
        if (!isLocked && isRecording) {
            stopRecording(true);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative flex items-center justify-end">
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute bottom-[-16px] right-24 bg-campus-dark border border-white/10 rounded-full py-3 px-6 shadow-elevation-3 flex items-center gap-4 z-[100] min-w-[280px]"
                    >
                        {/* Status Dot */}
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-glow-red" />

                        <span className="text-sm font-bold min-w-[40px] tabular-nums">{formatTime(timer)}</span>

                        {/* Waveform Mockup */}
                        <div className="flex-1 flex items-center gap-1.5 h-6">
                            {[1, 0.6, 0.8, 0.4, 0.9, 0.5, 0.7, 0.3, 1, 0.6].map((h, i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-brand-500 rounded-full"
                                    animate={{ height: `${h * 100}%` }}
                                    transition={{ repeat: Infinity, duration: 0.5, repeatType: 'reverse', delay: i * 0.1 }}
                                />
                            ))}
                        </div>

                        {/* Cancel Hint */}
                        {!isLocked && (
                            <div className="flex items-center gap-2 opacity-60">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Slide to cancel</span>
                                <motion.div animate={{ x: [-5, 5] }} transition={{ repeat: Infinity, duration: 1 }}>
                                    <Trash2 size={12} />
                                </motion.div>
                            </div>
                        )}

                        {/* Lock Actions */}
                        {isLocked && (
                            <div className="flex items-center gap-3">
                                <button onClick={() => stopRecording(false)} className="p-2 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition-all"><X size={18} /></button>
                                <button onClick={() => stopRecording(true)} className="p-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-all"><Send size={18} /></button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lock Indicator */}
            <AnimatePresence>
                {isRecording && !isLocked && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: -80 }}
                        exit={{ opacity: 0, y: 0 }}
                        className="absolute bottom-20 right-4 flex flex-col items-center gap-2"
                    >
                        <Lock size={16} className="text-white/40" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 rotate-180" style={{ writingMode: 'vertical-rl' }}>Slide to lock</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Recording Button */}
            <button
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e: any) => {
                    startX.current = e.clientX;
                    startY.current = e.clientY;
                    startRecording();
                    const moveHandler = (me: MouseEvent) => {
                        if (!isRecording || isLocked) return;
                        const diffX = me.clientX - startX.current;
                        const diffY = me.clientY - startY.current;
                        if (diffX < 0) {
                            setGestureProgressX(Math.max(diffX, cancelThreshold));
                            if (diffX <= cancelThreshold) stopRecording(false);
                        }
                        if (diffY < 0) {
                            setGestureProgressY(Math.max(diffY, lockThreshold));
                            if (diffY <= lockThreshold) {
                                setIsLocked(true);
                                onLock();
                            }
                        }
                    };
                    const upHandler = () => {
                        window.removeEventListener('mousemove', moveHandler);
                        window.removeEventListener('mouseup', upHandler);
                        if (!isLocked && isRecording) stopRecording(true);
                    };
                    window.addEventListener('mousemove', moveHandler);
                    window.addEventListener('mouseup', upHandler);
                }}
                className={`p-3 relative z-[101] rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 scale-150 shadow-glow-red' : 'bg-brand-500 hover:bg-brand-600 text-white shadow-elevation-2'}`}
            >
                {isRecording ? <div className="w-4 h-4 rounded-full bg-white animate-pulse" /> : <Mic size={20} />}

                {/* Lock ring */}
                {isLocked && (
                    <div className="absolute inset-[-4px] border-2 border-brand-500 rounded-full animate-pulse-slow" />
                )}
            </button>
        </div>
    );
};
