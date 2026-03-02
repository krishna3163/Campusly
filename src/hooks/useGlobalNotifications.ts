import { useEffect } from 'react';
import { useUser } from '@insforge/react';
import { insforge } from '../lib/insforge';
import { notificationService } from '../services/NotificationService';
import { useAppStore } from '../stores/appStore';

export function useGlobalNotifications() {
    const { user } = useUser();
    const { addToast } = useAppStore();

    useEffect(() => {
        if (!user?.id) return;

        // 1. Subscribe to Global Message Notifications
        // In a real app, this would be a specialized notification channel
        // For this demo, we can listen to "all_messages" or similar if the backend supports it
        // Or we subscribe to user's personal notification channel
        const setupGlobalRealtime = async () => {
            const channel = insforge.realtime.subscribe(`user_notifications:${user.id}`);

            insforge.realtime.on('new_notification', (payload: any) => {
                const { type, title, message, data } = payload;

                // Show in-app toast
                addToast(`${title}: ${message}`, 'info');

                // Browser notification
                if (Notification.permission === 'granted' && document.visibilityState === 'hidden') {
                    new Notification(title, {
                        body: message,
                        icon: '/logo192.png',
                        tag: type,
                        renotify: true
                    } as NotificationOptions);
                }
            });

            // Listen for friend requests specifically
            insforge.realtime.on('friend_request', (payload: any) => {
                addToast(`New Pulse Request from ${payload.sender_name}`, 'info');
            });

            insforge.realtime.on('friend_accept', (payload: any) => {
                addToast(`${payload.sender_name} accepted your pulse!`, 'success');
            });
        };

        setupGlobalRealtime();

        return () => {
            insforge.realtime.unsubscribe(`user_notifications:${user.id}`);
        };
    }, [user?.id, addToast]);
}
