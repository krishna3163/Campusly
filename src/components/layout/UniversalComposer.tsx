import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    X,
    Vote,
    FileText,
    Image as ImageIcon,
    CheckSquare,
    Calendar,
    GraduationCap,
    StickyNote,
    Zap
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface UniversalComposerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UniversalComposer({ isOpen, onClose }: UniversalComposerProps) {
    const navigate = useNavigate();
    const { chatId } = useParams<{ chatId: string }>();

    const menuItems = [
        { label: 'Poll', icon: Vote, color: 'bg-orange-500', path: '/app/campus/post/new?type=poll' },
        { label: 'File Share', icon: FileText, color: 'bg-blue-500', path: '/app/campus/post/new?type=file', action: 'file' },
        { label: 'Media', icon: ImageIcon, color: 'bg-purple-500', path: '/app/campus/post/new?type=media', action: 'media' },
        { label: 'Task', icon: CheckSquare, color: 'bg-emerald-500', path: '/app/study?action=add-task' },
        { label: 'Event', icon: Calendar, color: 'bg-pink-500', path: '/app/study' },
        { label: 'Exam', icon: GraduationCap, color: 'bg-red-500', path: '/app/study?action=add-exam' },
        { label: 'Quick Note', icon: StickyNote, color: 'bg-amber-500', path: '/app/study' },
    ];

    const handleItemClick = (item: any) => {
        if (chatId && item.action === 'media') {
            // Special action for chat: open file input
            window.dispatchEvent(new CustomEvent('chat-action', { detail: 'open-media' }));
            onClose();
            return;
        }
        if (chatId && item.action === 'file') {
            window.dispatchEvent(new CustomEvent('chat-action', { detail: 'open-media' }));
            onClose();
            return;
        }

        navigate(item.path);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200]">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Content */}
            <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-center">
                <div className="grid grid-cols-4 gap-6 mb-12">
                    {menuItems.map((item, idx) => (
                        <motion.button
                            key={item.label}
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.05, type: 'spring', damping: 15 }}
                            onClick={() => handleItemClick(item)}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform`}>
                                <item.icon size={26} strokeWidth={2.5} />
                            </div>
                            <span className="text-[11px] font-bold text-white uppercase tracking-wider">{item.label}</span>
                        </motion.button>
                    ))}
                </div>

                <motion.button
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 135 }}
                    onClick={onClose}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black shadow-2xl active:scale-90 transition-all"
                >
                    <Plus size={32} strokeWidth={3} />
                </motion.button>
            </div>
        </div>
    );
}
