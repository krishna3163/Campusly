import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Check,
    Type,
    Sticker as StickerIcon,
    Smile,
    Trash2,
    Camera,
    Flashlight,
    RotateCcw,
    ArrowRight,
    Lock,
    Eye,
    Globe,
    Users,
    ChevronDown,
    Zap
} from 'lucide-react';
import { UserProfile, StorySticker, StoryMetadata } from '../../types';
import { StickerSelector } from './StickerSelector';
import { WhatsappService } from '../../services/whatsappService';

interface StoryEditorProps {
    file: File | null;
    mediaType: 'text' | 'image' | 'video';
    currentUser: UserProfile;
    onClose: () => void;
    onPost: (story: any) => void;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({
    file,
    mediaType,
    currentUser,
    onClose,
    onPost
}) => {
    const [stickers, setStickers] = useState<StorySticker[]>([]);
    const [textOverlays, setTextOverlays] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState('#FFD700');
    const [showStickerSelector, setShowStickerSelector] = useState(false);
    const [visibility, setVisibility] = useState<'everyone' | 'contacts' | 'close_friends' | 'private'>('contacts');
    const [isViewOnce, setIsViewOnce] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(file ? URL.createObjectURL(file) : null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctx = useRef<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        if (canvasRef.current && (mediaType === 'image' || mediaType === 'text')) {
            ctx.current = canvasRef.current.getContext('2d');
            if (ctx.current) {
                ctx.current.lineJoin = 'round';
                ctx.current.lineCap = 'round';
                ctx.current.lineWidth = 5;
            }
        }
    }, [mediaType]);

    const handleAddSticker = (sticker: any) => {
        const newSticker: StorySticker = {
            id: Math.random().toString(36).substr(2, 9),
            type: sticker.type as any,
            x: 0.5,
            y: 0.5,
            rotation: 0,
            scale: 1,
            data: sticker.label
        };
        setStickers([...stickers, newSticker]);
        setShowStickerSelector(false);
    };

    const handlePost = async () => {
        // Upload logic would go here, then:
        const metadata: StoryMetadata = {
            stickers,
            drawing_data: canvasRef.current?.toDataURL(),
            branch_tag: currentUser.branch,
        };

        const result = await WhatsappService.postStory({
            userId: currentUser.id,
            campusId: currentUser.campus_id,
            type: mediaType,
            mediaUrl: previewUrl || '',
            metadata,
            visibility,
            isViewOnce
        });

        if (result.story) onPost(result.story);
    };

    return (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col overflow-hidden">
            {/* Control Bar (Top) */}
            <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-50">
                <button onClick={onClose} className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all">
                    <X size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsDrawing(!isDrawing)} className={`p-3 rounded-full transition-all ${isDrawing ? 'bg-brand-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}>
                        <Smile size={20} />
                    </button>
                    <button onClick={() => setShowStickerSelector(true)} className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all">
                        <StickerIcon size={20} />
                    </button>
                    <button className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all">
                        <Type size={20} />
                    </button>
                </div>
            </div>

            {/* Preview Canvas / Slide */}
            <div className="flex-1 relative flex items-center justify-center bg-campus-darker">
                {mediaType === 'image' && previewUrl && (
                    <img src={previewUrl} className="w-full h-full object-contain" alt="" />
                )}
                {mediaType === 'video' && previewUrl && (
                    <video src={previewUrl} className="w-full h-full object-contain" autoPlay muted loop />
                )}
                {mediaType === 'text' && (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center p-12">
                        <textarea
                            className="bg-transparent text-white text-3xl font-black text-center focus:outline-none placeholder:text-white/30 w-full resize-none"
                            placeholder="Type something..."
                            autoFocus
                        />
                    </div>
                )}

                {/* Stickers Drawing Overlay */}
                {stickers.map((s) => (
                    <motion.div
                        key={s.id}
                        drag
                        dragMomentum={false}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: s.scale, opacity: 1 }}
                        className="absolute z-40 cursor-move touch-none"
                        style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
                        onDragEnd={(_, info) => {
                            // Update sticker position ratio
                            // simplified for now
                        }}
                    >
                        {s.type === 'emoji' && <span className="text-5xl drop-shadow-2xl">{s.data}</span>}
                        {s.type === 'branch' && (
                            <div className="bg-brand-500 px-4 py-2 rounded-2xl shadow-glow text-white font-black italic border-2 border-white/20">
                                {s.data}
                            </div>
                        )}
                        {s.type === 'poll' && (
                            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl w-64 text-black border border-white/20">
                                <h5 className="font-bold text-sm mb-3 text-center">{s.data.question}</h5>
                                <div className="space-y-2">
                                    {s.data.options.map((opt: any, idx: number) => (
                                        <div key={idx} className="w-full py-3 rounded-2xl bg-black/5 border border-black/5 font-bold text-xs text-center">
                                            {opt.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button
                            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setStickers(stickers.filter(st => st.id !== s.id))}
                        >
                            <X size={12} />
                        </button>
                    </motion.div>
                ))}

                {/* Drawing Layer */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 z-10 pointer-events-auto"
                    width={1080}
                    height={1920}
                    style={{
                        width: '100%',
                        height: '100%',
                        cursor: isDrawing ? 'crosshair' : 'default',
                        pointerEvents: isDrawing ? 'auto' : 'none'
                    }}
                />
            </div>

            {/* Bottom Controls (Snapchat style) */}
            <div className="p-8 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-6 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsViewOnce(!isViewOnce)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isViewOnce ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white/10 border-white/20 text-white/60 hover:text-white'}`}
                        >
                            <Zap size={16} fill={isViewOnce ? 'currentColor' : 'none'} />
                            <span className="text-xs font-bold uppercase tracking-widest">View Once</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setVisibility(v => v === 'contacts' ? 'everyone' : 'contacts')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        {visibility === 'contacts' ? <Users size={16} /> : <Globe size={16} />}
                        {visibility}
                        <ChevronDown size={14} />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
                        <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-all">
                            <RotateCcw size={20} />
                        </div>
                        <span className="text-sm font-bold">Discard</span>
                    </button>

                    <button
                        onClick={handlePost}
                        className="flex items-center gap-4 bg-brand-500 hover:bg-brand-600 px-8 py-4 rounded-[32px] text-white shadow-glow transition-all active:scale-95 animate-pulse"
                    >
                        <span className="text-lg font-black uppercase tracking-widest">Share to Story</span>
                        <div className="p-2 bg-white/20 rounded-full">
                            <ArrowRight size={24} strokeWidth={3} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Content Sheets */}
            <AnimatePresence>
                {showStickerSelector && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute inset-x-0 bottom-0 z-[130]"
                    >
                        <StickerSelector onSelect={handleAddSticker} onClose={() => setShowStickerSelector(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
