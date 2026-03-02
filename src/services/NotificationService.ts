import { useAppStore } from '../stores/appStore';
import type { Message } from '../types';

class NotificationService {
    private currentConversationId: string | null = null;
    private isWindowFocused: boolean = true;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('focus', () => {
                this.isWindowFocused = true;
            });
            window.addEventListener('blur', () => {
                this.isWindowFocused = false;
            });
        }
    }

    setCurrentConversation(id: string | null) {
        this.currentConversationId = id;
    }

    async requestPermission() {
        if (!('Notification' in window)) return 'unsupported';
        const permission = await Notification.requestPermission();
        useAppStore.getState().setNotificationPermission(permission);
        return permission;
    }

    notify(message: Message, senderName: string) {
        const isCurrentlyViewing = this.isWindowFocused && (this.currentConversationId === message.conversation_id);

        if (isCurrentlyViewing) {
            // User is already reading this conversation, don't notify
            return;
        }

        // 1. In-app Toast
        useAppStore.getState().addToast(
            `${senderName}: ${message.type === 'text' ? message.content : `Sent a ${message.type}`}`,
            'info'
        );

        // 2. Browser Push Notification
        if (Notification.permission === 'granted' && !this.isWindowFocused) {
            new Notification(`New message from ${senderName}`, {
                body: message.type === 'text' ? message.content : `[${message.type}]`,
                icon: '/logo192.png', // Fallback icon
                tag: message.conversation_id, // Group by conversation
                renotify: true
            } as any);
        }
    }
}

export const notificationService = new NotificationService();
