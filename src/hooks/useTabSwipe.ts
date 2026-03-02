import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gesturePriorityManager, GestureType } from '../services/GesturePriorityManager';

const TAB_ROUTES = [
    '/app/chats',
    '/app/campus',
    '/app/study',
    '/app/placement',
    '/app/profile'
];

export const useTabSwipe = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isTabSwiping, setIsTabSwiping] = useState(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const currentX = useRef(0);
    const currentY = useRef(0);
    const isHorizontalMove = useRef(false);

    const getCurrentTabIndex = useCallback(() => {
        const index = TAB_ROUTES.findIndex(route => location.pathname.startsWith(route));
        return index !== -1 ? index : 0;
    }, [location.pathname]);

    const isInsideScrollable = (element: HTMLElement | null): boolean => {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        const isScrollable = style.overflowX === 'auto' || style.overflowX === 'scroll' ||
            element.scrollWidth > element.clientWidth;

        if (isScrollable) return true;
        return isInsideScrollable(element.parentElement);
    };

    const handleTouchStart = useCallback((e: TouchEvent) => {
        // Only allow tab swipe on root tab pages
        const index = TAB_ROUTES.findIndex(route => location.pathname === route);
        if (index === -1) return;

        const touch = e.touches[0];

        // Only trigger if starting from center area (not inside horizontal scroll)
        const target = e.target as HTMLElement;
        if (isInsideScrollable(target)) return;

        startX.current = touch.clientX;
        startY.current = touch.clientY;
        currentX.current = touch.clientX;
        currentY.current = touch.clientY;
        isHorizontalMove.current = false;
        setIsTabSwiping(false);
    }, [location.pathname]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (gesturePriorityManager.getActiveGesture() < GestureType.TAB_SWIPE &&
            gesturePriorityManager.getActiveGesture() !== GestureType.NONE) return;

        const touch = e.touches[0];
        const diffX = touch.clientX - startX.current;
        const diffY = touch.clientY - startY.current;

        // Determine if it's horizontal swipe early
        if (!isHorizontalMove.current && Math.abs(diffX) > 10) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (gesturePriorityManager.claim(GestureType.TAB_SWIPE, 'tab-swipe')) {
                    isHorizontalMove.current = true;
                    setIsTabSwiping(true);
                }
            } else {
                // If vertical, it's a scroll
                // gesturePriorityManager.claim(GestureType.SCROLL, 'scroll');
            }
        }

        if (isHorizontalMove.current) {
            currentX.current = touch.clientX;
            currentY.current = touch.clientY;

            // Visual feedback - slide effect
            const shift = diffX * 0.5;
            document.body.style.transform = `translateX(${shift}px)`;

            // Prevent default to disable browser default swipe navigation (on some mobile browsers)
            if (e.cancelable) e.preventDefault();
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!isTabSwiping) return;

        const diffX = currentX.current - startX.current;
        const threshold = 100;
        const currentIndex = getCurrentTabIndex();

        document.body.style.transform = '';

        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // Swipe right -> previous tab
                const prevIndex = (currentIndex - 1 + TAB_ROUTES.length) % TAB_ROUTES.length;
                navigate(TAB_ROUTES[prevIndex]);
            } else {
                // Swipe left -> next tab
                const nextIndex = (currentIndex + 1) % TAB_ROUTES.length;
                navigate(TAB_ROUTES[nextIndex]);
            }
        }

        setIsTabSwiping(false);
        isHorizontalMove.current = false;
        gesturePriorityManager.release('tab-swipe');
    }, [isTabSwiping, getCurrentTabIndex, navigate]);

    useEffect(() => {
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { isTabSwiping };
};
