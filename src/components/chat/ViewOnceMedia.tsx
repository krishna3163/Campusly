import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X, ShieldAlert } from 'lucide-react';

interface ViewOnceMediaProps {
    url: string;
    type: 'image' | 'video' | 'audio' | 'document';
    onViewed: () => void;
}

export default function ViewOnceMedia({ url, type, onViewed }: ViewOnceMediaProps) {
    const [isOpened, setIsOpened] = useState(false);

    const handleOpen = () => {
        setIsOpened(true);
    };

    const handleClose = () => {
        setIsOpened(false);
        onViewed();
    };

    return (
        <>
            <div
                onClick={handleOpen}
                className="relative group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
            >
                <div className="aspect-square relative flex items-center justify-center p-8">
                    {type === 'image' && (
                        <div className="absolute inset-0 blur-2xl opacity-40 scale-110">
                            <img src={url} className="w-full h-full object-cover" alt="" />
                        </div>
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                        <div className="w-14 h-14 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30 group-hover:scale-110 transition-transform shadow-glow">
                            <Eye size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-widest text-white">One-Time {type}</p>
                            <p className="text-[10px] text-campus-muted uppercase font-bold mt-1 opacity-60">Tap to Reveal</p>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isOpened && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-xl"
                    >
                        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-white">One-Time View</h4>
                                    <p className="text-[10px] text-campus-muted flex items-center gap-1 uppercase font-bold">
                                        <ShieldAlert size={10} className="text-brand-400" /> screenshot protection active
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all active:scale-95"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="max-w-4xl w-full max-h-[70vh] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-white/5"
                        >
                            {type === 'image' && (
                                <img
                                    src={url}
                                    className="max-w-full max-h-full object-contain pointer-events-none select-none"
                                    alt="One time view"
                                    onContextMenu={(e) => e.preventDefault()}
                                />
                            )}
                            {type === 'video' && (
                                <video
                                    src={url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-full"
                                    onEnded={handleClose}
                                    controlsList="nodownload"
                                />
                            )}
                            {type === 'audio' && (
                                <audio src={url} controls autoPlay className="w-full max-w-sm" onEnded={handleClose} />
                            )}
                        </motion.div>

                        <div className="mt-12 text-center max-w-xs space-y-4 px-6 animate-pulse">
                            <p className="text-xs text-campus-muted font-bold uppercase tracking-widest leading-relaxed opacity-60">
                                This media will be permanently deleted after you close it.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
