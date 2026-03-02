/**
 * GesturePriorityManager
 * Handles priority of active gestures to prevent conflicts.
 */

export const GestureType = {
    VOICE_RECORDING: 1,
    EDGE_BACK: 2,
    TAB_SWIPE: 3,
    SCROLL: 4,
    PULL_TO_REFRESH: 5,
    NONE: 99
} as const;

export type GestureType = typeof GestureType[keyof typeof GestureType];

class GesturePriorityManager {
    private activeGesture: GestureType = GestureType.NONE;
    private locks: Set<string> = new Set();

    /**
     * Tries to claim a gesture. Returns true if successful.
     * Higher priority (lower number) can override or block lower priority.
     */
    public claim(type: GestureType, id: string = 'default'): boolean {
        if (this.activeGesture === GestureType.NONE) {
            this.activeGesture = type;
            this.locks.add(id);
            return true;
        }

        // If a higher priority gesture is already active, lower priority can't claim
        if (type > this.activeGesture) {
            return false;
        }

        // If the same priority or higher, allow override (unless specific rules prevent it)
        this.activeGesture = type;
        this.locks.add(id);
        return true;
    }

    public release(id: string = 'default') {
        this.locks.delete(id);
        if (this.locks.size === 0) {
            this.activeGesture = GestureType.NONE;
        }
    }

    public getActiveGesture(): GestureType {
        return this.activeGesture;
    }

    public isLocked(): boolean {
        return this.activeGesture !== GestureType.NONE;
    }
}

export const gesturePriorityManager = new GesturePriorityManager();
