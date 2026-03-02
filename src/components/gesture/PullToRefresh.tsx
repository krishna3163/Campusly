import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    children,
    disabled = false
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullProgress, setPullProgress] = useState(0); // 0 to 1
    const pullDistance = useMotionValue(0);
    const controls = useAnimation();
    const threshold = 70;
    const isPulling = useRef(false);
    const startY = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Rotate based on pull distance
    const rotate = useTransform(pullDistance, [0, threshold], [0, 360]);
    const opacity = useTransform(pullDistance, [0, threshold * 0.5], [0, 1]);
    const scale = useTransform(pullDistance, [0, threshold], [0.5, 1.2]);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (disabled || isRefreshing) return;

        // Only trigger if at top of scroll
        const container = containerRef.current;
        if (container && container.scrollTop === 0) {
            isPulling.current = true;
            startY.current = e.touches[0].clientY;
        }
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isPulling.current) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0) {
            // Apply resistance
            const pull = Math.min(diff * 0.4, threshold + 20);
            pullDistance.set(pull);
            setPullProgress(Math.min(pull / threshold, 1));

            // Prevent scrolling when pulling
            if (e.cancelable) e.preventDefault();
        } else {
            isPulling.current = false;
            pullDistance.set(0);
            setPullProgress(0);
        }
    }, [pullDistance, threshold]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current) return;
        isPulling.current = false;

        if (pullDistance.get() >= threshold) {
            setIsRefreshing(true);
            setPullProgress(0);

            // Animation for refreshing state
            await controls.start({ y: 40 });

            if (navigator.vibrate) navigator.vibrate(50);

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                pullDistance.set(0);
                await controls.start({ y: 0 });
            }
        } else {
            pullDistance.set(0);
            setPullProgress(0);
            await controls.start({ y: 0 });
        }
    }, [onRefresh, pullDistance, threshold, controls]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-y-auto scroll-smooth">
            {/* Refresh Indicator */}
            <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-50">
                <motion.div
                    style={{
                        y: isRefreshing ? 40 : pullDistance,
                        opacity,
                        scale,
                        rotate: isRefreshing ? undefined : rotate
                    }}
                    animate={isRefreshing ? { rotate: 360 } : {}}
                    transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
                    className={`mt-4 p-3 rounded-full bg-brand-500 text-white shadow-elevation-3 flex items-center justify-center`}
                >
                    <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                </motion.div>
            </div>

            <motion.div animate={controls} className="w-full h-full">
                {children}
            </motion.div>
        </div>
    );
};
