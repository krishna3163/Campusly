import { motion, AnimatePresence } from 'framer-motion';
import { Pin, BellOff, Trash2, Archive, X } from 'lucide-react';
import { Conversation } from '../../types';

interface ChatActionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation | null;
    onPin: (conv: Conversation) => void;
    onMute: (conv: Conversation) => void;
    onDelete: (conv: Conversation) => void;
    onArchive: (conv: Conversation) => void;
}

export default function ChatActionSheet({ isOpen, onClose, conversation, onPin, onMute, onDelete, onArchive }: ChatActionSheetProps) {
    if (!conversation) return null;

    const isPinned = conversation.is_pinned_private || conversation.is_pinned_group;

    const actions = [
        { icon: Pin, label: isPinned ? 'Unpin Chat' : 'Pin Chat', onClick: () => { onPin(conversation); onClose(); }, color: 'text-brand-400' },
        { icon: BellOff, label: 'Mute Notifications', onClick: () => { onMute(conversation); onClose(); }, color: 'text-campus-muted' },
        { icon: Archive, label: 'Archive Chat', onClick: () => { onArchive(conversation); onClose(); }, color: 'text-campus-muted' },
        { icon: Trash2, label: 'Delete Chat', onClick: () => { onDelete(conversation); onClose(); }, color: 'text-red-400' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-campus-dark border-t border-white/10 rounded-t-[32px] z-[1001] px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-8 shadow-2xl"
                    >
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 cursor-pointer" onClick={onClose} />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 overflow-hidden">
                                {conversation.avatar_url ? <img src={conversation.avatar_url} className="w-full h-full object-cover" alt="" /> :
                                    <div className="w-full h-full flex items-center justify-center font-black text-xl bg-brand-500/20 text-brand-400">{(conversation.name || 'C').charAt(0)}</div>}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white leading-tight uppercase tracking-tight">{conversation.name || 'Chat Options'}</h3>
                                <p className="text-[12px] text-campus-muted font-bold uppercase tracking-widest opacity-60">Conversation Settings</p>
                            </div>
                            <button onClick={onClose} className="ml-auto w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-campus-muted hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {actions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={action.onClick}
                                    className="w-full flex items-center gap-4 p-5 rounded-3xl bg-white/[0.03] hover:bg-white/[0.08] transition-all group active:scale-[0.98]"
                                >
                                    <div className={`p-3 rounded-2xl bg-black/20 ${action.color} group-hover:scale-110 transition-transform`}>
                                        <action.icon size={22} />
                                    </div>
                                    <span className={`font-black uppercase tracking-widest text-[14px] ${action.color.includes('red') ? 'text-red-400' : 'text-white'}`}>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
