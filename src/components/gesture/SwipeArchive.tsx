import React, { useState, useCallback } from 'react';
import { Archive } from 'lucide-react';
import { motion, useAnimation, PanInfo } from 'framer-motion';

interface SwipeArchiveProps {
    children: React.ReactNode;
    onArchive: () => void;
    disabled?: boolean;
}

export const SwipeArchive: React.FC<SwipeArchiveProps> = ({ children, onArchive, disabled = false }) => {
    const [isSwiping, setIsSwiping] = useState(false);
    const controls = useAnimation();
    const threshold = -80; // Negative for left swipe

    const onPan = useCallback((_: any, info: PanInfo) => {
        if (disabled) return;

        // Only allow swiping left
        if (info.offset.x < 0) {
            setIsSwiping(info.offset.x < threshold);
        } else {
            setIsSwiping(false);
        }
    }, [disabled]);

    const onPanEnd = useCallback((_: any, info: PanInfo) => {
        if (disabled) return;

        if (info.offset.x < threshold) {
            onArchive();
            if (navigator.vibrate) navigator.vibrate(50);
        }

        controls.start({ x: 0 });
        setIsSwiping(false);
    }, [disabled, onArchive, controls]);

    return (
        <div className="relative w-full overflow-hidden rounded-[36px]">
            {/* Archive Revealed Background */}
            <div className={`absolute inset-0 z-0 flex items-center justify-end px-12 transition-colors duration-300 ${isSwiping ? 'bg-emerald-500/20' : 'bg-transparent'}`}>
                <motion.div
                    animate={{
                        scale: isSwiping ? 1.4 : 1,
                        opacity: isSwiping ? 1 : 0
                    }}
                    className="text-emerald-400"
                >
                    <Archive size={24} />
                </motion.div>
            </div>

            <motion.div
                className="w-full h-full z-10"
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
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
