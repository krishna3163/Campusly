import { ShieldX, Clock } from 'lucide-react';

interface ExpiredMediaProps {
    type: 'image' | 'video' | 'audio' | 'document';
    viewTimestamp?: string;
}

export default function ExpiredMedia({ type, viewTimestamp }: ExpiredMediaProps) {
    return (
        <div className="relative group overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02] p-8 max-w-sm">
            <div className="flex flex-col items-center text-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-[20px] bg-red-500/10 text-red-500/40 flex items-center justify-center border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                    <ShieldX size={28} />
                </div>

                <div className="space-y-1.5 px-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-white/50 italic">Media Expired</h4>
                    <p className="text-[10px] text-campus-muted font-bold uppercase tracking-tighter opacity-40 leading-relaxed">
                        This {type} was viewed and is now permanently deleted from this chat history.
                    </p>
                </div>

                <div className="w-full h-[1px] bg-white/[0.05] my-2" />

                <div className="flex items-center gap-2 text-campus-muted/30">
                    <Clock size={12} />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em]">
                        Viewed {viewTimestamp ? new Date(viewTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                    </span>
                </div>
            </div>

            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, white 25%, transparent 25%, transparent 50%, white 50%, white 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }} />
        </div>
    );
}
