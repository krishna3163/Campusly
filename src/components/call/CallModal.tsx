import React, { useEffect, useRef, useState } from 'react';
import {
    PhoneOff,
    Mic,
    MicOff,
    Video,
    VideoOff,
    RotateCcw,
    Maximize,
    MessageSquare,
    ShieldCheck,
    Lock
} from 'lucide-react';
import { callService } from '../../services/callService';
import { insforge } from '../../lib/insforge';
import type { UserProfile } from '../../types';

interface CallModalProps {
    callId: string;
    currentUser: UserProfile;
    targetUser?: UserProfile;
    isCaller: boolean;
    type: 'audio' | 'video';
    onClose: () => void;
}

export default function CallModal({ callId, currentUser, targetUser, isCaller, type, onClose }: CallModalProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(type === 'audio');
    const [isConnecting, setIsConnecting] = useState(true);
    const [isCallActive, setIsCallActive] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const init = async () => {
            const stream = await callService.initPeer(type === 'video', (remoteStream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
                setIsConnecting(false);
                setIsCallActive(true);
            });

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            if (isCaller) {
                // Sender logic: create offer
                const offer = await callService.createOffer(targetUser?.id!);
                await callService.sendSignal('offer', targetUser?.id!, offer, currentUser.id);
            }

            // Shared ICE candidate setup
            callService.setupIceCandidates(currentUser.id, targetUser?.id!, (candidate) => {
                callService.sendSignal('ice-candidate', targetUser?.id!, candidate, currentUser.id);
            });
        };

        const signalCleanup = callService.subscribeSignals(currentUser.id, async (event, from, data) => {
            if (from !== targetUser?.id) return;

            switch (event) {
                case 'offer':
                    const answer = await callService.handleOffer(data);
                    await callService.sendSignal('answer', targetUser?.id!, answer, currentUser.id);
                    break;
                case 'answer':
                    await callService.handleAnswer(data);
                    break;
                case 'ice-candidate':
                    await callService.addIceCandidate(data);
                    break;
                case 'call-end':
                    handleEndCall(false);
                    break;
            }
        });

        init();
        return () => {
            signalCleanup();
            callService.cleanup();
        };
    }, [callId]);

    const handleToggleMute = () => {
        const tracks = (localVideoRef.current?.srcObject as MediaStream)?.getAudioTracks();
        tracks?.forEach(t => t.enabled = !t.enabled);
        setIsMuted(!isMuted);
    };

    const handleToggleVideo = () => {
        const tracks = (localVideoRef.current?.srcObject as MediaStream)?.getVideoTracks();
        tracks?.forEach(t => t.enabled = !t.enabled);
        setIsVideoOff(!isVideoOff);
    };

    const handleEndCall = async (shouldSignal = true) => {
        if (shouldSignal && targetUser?.id) {
            await callService.sendSignal('call-end', targetUser.id, {}, currentUser.id);
        }
        await callService.updateCallStatus(callId, 'ended');
        callService.cleanup();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center animate-fade-in overflow-hidden">
            {/* Background Layer: Remote Video */}
            <div className="absolute inset-0 bg-campus-darker">
                {type === 'video' ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover transition-opacity duration-1000 ${isCallActive ? 'opacity-100' : 'opacity-30'}`}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-12 text-center p-12">
                        <div className="w-48 h-48 rounded-full border-4 border-brand-500/30 p-2 relative animate-pulse ring-8 ring-brand-500/5">
                            <div className="w-full h-full rounded-full bg-brand-500 flex items-center justify-center text-5xl font-black overflow-hidden bg-gradient-to-br from-brand-600 to-brand-400">
                                {targetUser?.avatar_url ? (
                                    <img src={targetUser.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    targetUser?.display_name?.charAt(0) || '?'
                                )}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{targetUser?.display_name || 'Campus Resident'}</h2>
                            <p className="text-brand-400 font-bold uppercase tracking-widest text-sm italic">{isConnecting ? 'Establishing secure link...' : 'In encrypted audio pulse'}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Corner Layer: Local Video Preview */}
            <div className={`absolute top-12 right-6 w-32 h-44 rounded-3xl bg-white/5 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-3xl z-20 group transition-all duration-500 ${isVideoOff ? 'aspect-square h-32' : ''}`}>
                {!isVideoOff ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover rounded-3xl"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/40 text-brand-500">
                        <VideoOff size={32} />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Maximize size={20} className="text-white" />
                </div>
            </div>

            {/* Call Info Overlay */}
            <div className="absolute top-12 left-8 flex items-center gap-3 z-10">
                <div className="px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-glow-emerald" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/80">AES-256 E2E Active</span>
                    <div className="w-px h-3 bg-white/10" />
                    <Lock size={12} className="text-brand-400" />
                </div>
            </div>

            {/* Controls Layer */}
            <div className="absolute bottom-16 left-0 right-0 p-8 flex flex-col items-center gap-12 z-20">
                {isConnecting && (
                    <div className="flex flex-col items-center gap-4 animate-bounce-slow">
                        <div className="w-12 h-1 bg-brand-500/20 rounded-full overflow-hidden">
                            <div className="w-1/2 h-full bg-brand-500 animate-slide-right-infinite" />
                        </div>
                        <span className="text-[10px] uppercase font-black tracking-widest text-brand-400 animate-pulse">Syncing P2P Packets</span>
                    </div>
                )}

                <div className="flex items-center gap-6 p-6 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[44px] shadow-glow">
                    <button
                        onClick={handleToggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    {type === 'video' && (
                        <button
                            onClick={handleToggleVideo}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
                        >
                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>
                    )}

                    <button
                        onClick={() => handleEndCall()}
                        className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-glow-red/20 transition-all active:scale-90 hover:scale-105"
                    >
                        <PhoneOff size={32} />
                    </button>

                    <button className="w-14 h-14 rounded-full bg-white/5 text-white flex items-center justify-center transition-all hover:bg-white/10">
                        <MessageSquare size={24} />
                    </button>

                    <button className="w-14 h-14 rounded-full bg-white/5 text-white flex items-center justify-center transition-all hover:bg-white/10">
                        <RotateCcw size={24} />
                    </button>
                </div>

                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-widest">Campus-Grade Privacy Standard</span>
                </div>
            </div>
        </div>
    );
}
