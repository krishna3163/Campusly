import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gesturePriorityManager, GestureType } from '../services/GesturePriorityManager';

export const useEdgeSwipeBack = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [swipeProgress, setSwipeProgress] = useState(0); // 0 to 1
    const [isSwiping, setIsSwiping] = useState(false);
    const startX = useRef(0);
    const currentX = useRef(0);
    const velocity = useRef(0);
    const lastTime = useRef(0);

    // Disable for root tabs
    const isRootTab = useCallback(() => {
        const rootTabs = ['/app/chats', '/app/campus', '/app/study', '/app/placement', '/app/profile'];
        // Check if exactly one of these (without subpaths like /app/chats/123)
        return rootTabs.includes(location.pathname);
    }, [location.pathname]);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (isRootTab()) return;

        const touch = e.touches[0];
        // Only trigger near left edge (within 20px)
        if (touch.clientX < 20) {
            if (gesturePriorityManager.claim(GestureType.EDGE_BACK, 'edge-back')) {
                startX.current = touch.clientX;
                currentX.current = touch.clientX;
                lastTime.current = performance.now();
                setIsSwiping(true);
                setSwipeProgress(0);
            }
        }
    }, [isRootTab]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isSwiping) return;

        const touch = e.touches[0];
        const diff = touch.clientX - startX.current;

        if (diff < 0) return; // Swiping left from left edge shouldn't do anything

        const now = performance.now();
        const timeDiff = now - lastTime.current;
        const xDiff = touch.clientX - currentX.current;

        if (timeDiff > 0) {
            velocity.current = xDiff / timeDiff;
        }

        currentX.current = touch.clientX;
        lastTime.current = now;

        // Visual feedback based on movement
        const progress = Math.min(diff / window.innerWidth, 1);
        setSwipeProgress(progress);

        // Apply page shift and dimming effects
        // Shift right up to 20% of screen width
        const shift = Math.min(diff * 0.3, window.innerWidth * 0.2);
        document.body.style.transform = `translateX(${shift}px)`;
        document.body.style.backgroundColor = `rgba(0,0,0,${Math.max(0, 0.5 - progress * 0.5)})`;
    }, [isSwiping]);

    const handleTouchEnd = useCallback(() => {
        if (!isSwiping) return;

        const diff = currentX.current - startX.current;
        const threshold = 80;
        const velocityThreshold = 0.5;

        // Reset body styles
        document.body.style.transform = '';
        document.body.style.backgroundColor = '';

        if (diff > threshold || velocity.current > velocityThreshold) {
            navigate(-1);
        }

        setIsSwiping(false);
        setSwipeProgress(0);
        gesturePriorityManager.release('edge-back');
    }, [isSwiping, navigate]);

    useEffect(() => {
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { isSwiping, swipeProgress };
};
