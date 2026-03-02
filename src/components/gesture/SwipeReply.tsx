import React, { useState, useRef, useCallback } from 'react';
import { Reply } from 'lucide-react';
import { motion, useAnimation, PanInfo } from 'framer-motion';

interface SwipeReplyProps {
    children: React.ReactNode;
    onReply: () => void;
    disabled?: boolean;
}

export const SwipeReply: React.FC<SwipeReplyProps> = ({ children, onReply, disabled = false }) => {
    const [isSwiping, setIsSwiping] = useState(false);
    const controls = useAnimation();
    const threshold = 40;

    const onPan = useCallback((_: any, info: PanInfo) => {
        if (disabled) return;

        // Only allow swiping right
        if (info.offset.x > 0) {
            setIsSwiping(info.offset.x > threshold);
        } else {
            setIsSwiping(false);
        }
    }, [disabled]);

    const onPanEnd = useCallback((_: any, info: PanInfo) => {
        if (disabled) return;

        if (info.offset.x > threshold) {
            onReply();
            if (navigator.vibrate) navigator.vibrate(50);
        }

        controls.start({ x: 0 });
        setIsSwiping(false);
    }, [disabled, onReply, controls]);

    return (
        <div className="relative w-full flex items-center">
            {/* Reply Indicator Icon */}
            <motion.div
                className="absolute left-0 z-0 p-2 text-brand-400"
                animate={{
                    opacity: isSwiping ? 1 : 0,
                    scale: isSwiping ? 1.2 : 0.8,
                    x: isSwiping ? 10 : -20
                }}
            >
                <Reply size={20} />
            </motion.div>

            <motion.div
                className="w-full h-full z-10"
                drag="x"
                dragConstraints={{ left: 0, right: 100 }}
                dragElastic={0.4}
                onPan={onPan}
                onPanEnd={onPanEnd}
                animate={controls}
                style={{ cursor: disabled ? 'default' : 'grab' }}
            >
                {children}
            </motion.div>
        </div>
    );
};
