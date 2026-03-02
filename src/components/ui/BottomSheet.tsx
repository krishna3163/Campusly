import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    children,
    title
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (navigator.vibrate) navigator.vibrate(20);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!mounted) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sheet Content */}
                    <motion.div
                        className="fixed bottom-0 left-0 right-0 bg-campus-dark border-t border-white/10 rounded-t-[32px] z-[1001] safe-bottom pb-8 overflow-hidden shadow-elevation-3"
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.05}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) {
                                onClose();
                            }
                        }}
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center p-3">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        {title && (
                            <div className="px-6 py-2 pb-4">
                                <h3 className="text-xl font-bold">{title}</h3>
                            </div>
                        )}

                        <div className="px-2">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

interface BottomSheetItemProps {
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

export const BottomSheetItem: React.FC<BottomSheetItemProps> = ({
    icon,
    label,
    onClick,
    variant = 'default'
}) => (
    <button
        onClick={() => {
            onClick();
        }}
        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 transition-colors text-left ${variant === 'danger' ? 'text-red-400' : 'text-white'}`}
    >
        {icon && <span className="opacity-80 scale-110">{icon}</span>}
        <span className="text-[15px] font-medium">{label}</span>
    </button>
);
