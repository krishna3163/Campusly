/**
 * RealtimeService — Enhanced realtime with typing debounce, presence heartbeat,
 * auto-disconnect on tab close, and memory-safe subscription management
 */

import { insforge } from '../lib/insforge';

type CleanupFn = () => void;

class RealtimeService {
    private typingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private cleanups: CleanupFn[] = [];
    private isTypingActive: Map<string, boolean> = new Map();

    constructor() {
        // Auto clean on tab close
        window.addEventListener('beforeunload', () => this.destroy());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.stopHeartbeat();
            } else {
                this.startHeartbeat();
            }
        });
    }

    // === TYPING ===

    /**
     * Debounced typing indicator (500ms debounce, auto-stop after 3s)
     */
    sendTyping(channelId: string, userId: string, displayName: string): void {
        const key = `${channelId}:${userId}`;

        // Clear existing timeouts
        const existingTimeout = this.typingTimeouts.get(key);
        if (existingTimeout) clearTimeout(existingTimeout);

        // Only send "start typing" if not already active
        if (!this.isTypingActive.get(key)) {
            this.isTypingActive.set(key, true);
            insforge.realtime.publish(`typing:${channelId}`, 'typing', {
                userId,
                displayName,
                isTyping: true,
            });
        }

        // Auto-stop after 3 seconds of inactivity
        const timeout = setTimeout(() => {
            this.stopTyping(channelId, userId, displayName);
        }, 3000);
        this.typingTimeouts.set(key, timeout);
    }

    stopTyping(channelId: string, userId: string, displayName: string): void {
        const key = `${channelId}:${userId}`;
        const timeout = this.typingTimeouts.get(key);
        if (timeout) clearTimeout(timeout);
        this.typingTimeouts.delete(key);

        if (this.isTypingActive.get(key)) {
            this.isTypingActive.set(key, false);
            insforge.realtime.publish(`typing:${channelId}`, 'typing', {
                userId,
                displayName,
                isTyping: false,
            });
        }
    }

    // === PRESENCE HEARTBEAT ===

    startHeartbeat(userId?: string, intervalMs = 20000): void {
        this.stopHeartbeat();
        if (!userId) return;

        this.heartbeatInterval = setInterval(() => {
            insforge.realtime.publish('presence', 'heartbeat', {
                userId,
                timestamp: Date.now(),
                online: true,
            });
        }, intervalMs);

        // Immediate first heartbeat
        insforge.realtime.publish('presence', 'heartbeat', {
            userId,
            timestamp: Date.now(),
            online: true,
        });
    }

    stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // === CHANNEL SUBSCRIPTIONS (MEMORY-SAFE) ===

    subscribeToChannel(
        channelName: string,
        event: string,
        callback: (payload: Record<string, unknown>) => void
    ): CleanupFn {
        // Connect if needed
        if (!insforge.realtime.isConnected) {
            insforge.realtime.connect();
        }

        insforge.realtime.subscribe(channelName);
        insforge.realtime.on(event, callback);

        const cleanup = () => {
            insforge.realtime.unsubscribe?.(channelName);
            insforge.realtime.off?.(event, callback);
        };

        this.cleanups.push(cleanup);
        return cleanup;
    }

    // === VOICE CHANNEL ISOLATION ===

    joinVoiceRoom(roomId: string, userId: string): CleanupFn {
        insforge.realtime.publish(`voice:${roomId}`, 'join', {
            userId,
            timestamp: Date.now(),
        });

        const cleanup = () => {
            insforge.realtime.publish(`voice:${roomId}`, 'leave', {
                userId,
                timestamp: Date.now(),
            });
        };

        this.cleanups.push(cleanup);
        return cleanup;
    }

    // === CLEANUP ===

    destroy(): void {
        // Stop all typing
        this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.typingTimeouts.clear();
        this.isTypingActive.clear();

        // Stop heartbeat
        this.stopHeartbeat();

        // Run all cleanups
        this.cleanups.forEach(fn => fn());
        this.cleanups = [];
    }
}

export const realtimeService = new RealtimeService();
