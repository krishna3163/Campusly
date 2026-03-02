import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video, X } from 'lucide-react';
import { insforge } from '../../lib/insforge';
import type { UserProfile } from '../../types';

interface IncomingCallModalProps {
    callId: string;
    callerId: string;
    type: 'audio' | 'video';
    onAccept: () => void;
    onReject: () => void;
}

export default function IncomingCallModal({ callId, callerId, type, onAccept, onReject }: IncomingCallModalProps) {
    const [caller, setCaller] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchCaller = async () => {
            const { data } = await insforge.database
                .from('profiles')
                .select('*')
                .eq('id', callerId)
                .single();
            if (data) setCaller(data as UserProfile);
        };
        fetchCaller();
    }, [callerId]);

    return (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-fade-in shadow-2xl">
            <div className="absolute top-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-4 border-brand-500/30 p-1 mb-4 relative">
                    <div className="w-full h-full rounded-full bg-brand-500 flex items-center justify-center text-3xl font-black overflow-hidden bg-gradient-to-br from-brand-600 to-brand-400">
                        {caller?.avatar_url ? (
                            <img src={caller.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                            caller?.display_name?.charAt(0) || '?'
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-500 border-4 border-black flex items-center justify-center text-white ring-4 ring-brand-500/20 animate-pulse">
                        {type === 'video' ? <Video size={16} /> : <Phone size={16} />}
                    </div>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-1">Incoming Call</h2>
                <p className="text-brand-400 font-bold uppercase tracking-widest text-xs">{caller?.display_name || 'Campus Resident'}</p>
            </div>

            <div className="mt-12 flex items-center gap-12">
                <button
                    onClick={onReject}
                    className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-glow-red/30 hover:scale-110 active:scale-95 transition-all outline-none"
                >
                    <PhoneOff size={28} />
                </button>
                <button
                    onClick={onAccept}
                    className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-glow-emerald/30 hover:scale-110 active:scale-95 transition-all outline-none animate-bounce-slow"
                >
                    <Phone size={28} />
                </button>
            </div>

            <div className="absolute bottom-12 text-white/30 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Encrypted with AES-256 campus-grade P2P
            </div>
        </div>
    );
}
