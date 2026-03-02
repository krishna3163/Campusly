import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type GesturePriority = 'voice' | 'edge' | 'swipe' | 'tab' | 'scroll' | 'none';

interface GestureContextType {
    activeGesture: GesturePriority;
    isLocked: boolean;
    lock: (p: GesturePriority) => boolean;
    release: () => void;

    // Legacy support (to avoid breaking current modules)
    activePriority?: GesturePriority;
    setEdgeSwiping: (v: boolean, p?: number) => void;
    edgeSwipeProgress: number;
    isEdgeSwiping: boolean;
}

const GestureContext = createContext<GestureContextType | undefined>(undefined);

export const useGesture = () => {
    const context = useContext(GestureContext);
    if (!context) throw new Error('useGesture must be used within a GestureProvider');
    return context;
};

const PRIORITY_LEVELS: Record<GesturePriority, number> = {
    voice: 100,
    edge: 80,
    swipe: 60,
    tab: 40,
    scroll: 20,
    none: 0
};

export const GestureManager: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeGesture, setActiveGesture] = useState<GesturePriority>('none');
    const [isLocked, setIsLocked] = useState(false);
    const [isEdgeSwiping, setIsEdgeSwiping] = useState(false);
    const [edgeSwipeProgress, setEdgeSwipeProgress] = useState(0);

    const lock = useCallback((p: GesturePriority) => {
        if (isLocked && PRIORITY_LEVELS[p] <= PRIORITY_LEVELS[activeGesture]) {
            return false;
        }

        setActiveGesture(p);
        setIsLocked(true);
        return true;
    }, [activeGesture, isLocked]);

    const release = useCallback(() => {
        setActiveGesture('none');
        setIsLocked(false);
    }, []);

    const setEdgeSwiping = (v: boolean, p = 0) => {
        setIsEdgeSwiping(v);
        setEdgeSwipeProgress(p);
    };

    // Global conflict resolution for scroll
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (isLocked && activeGesture !== 'scroll') {
                e.preventDefault();
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isLocked && activeGesture !== 'scroll') {
                if (e.cancelable) e.preventDefault();
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isLocked, activeGesture]);

    return (
        <GestureContext.Provider value={{
            activeGesture,
            activePriority: activeGesture, // Map legacy
            isLocked,
            lock,
            release,
            setEdgeSwiping,
            edgeSwipeProgress,
            isEdgeSwiping,
        }}>
            <div className={`gesture-root h-screen w-screen overflow-hidden flex flex-col relative ${isLocked ? 'pointer-events-none' : ''}`}>
                {/* Background Dim for Edge Swipe */}
                {isEdgeSwiping && (
                    <div
                        className="fixed inset-0 bg-black z-[9998] pointer-events-none transition-opacity duration-150"
                        style={{ opacity: edgeSwipeProgress * 0.5 }}
                    />
                )}

                <div className="flex-1 overflow-hidden relative pointer-events-auto">
                    {children}
                </div>
            </div>
        </GestureContext.Provider>
    );
};
