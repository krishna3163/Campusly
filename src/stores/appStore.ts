/**
 * App Store — Global application state (exam mode, sync, notifications)
 */

import { create } from 'zustand';
import type { SyncStatus } from '../types';

interface AppState {
    // Exam Mode
    examMode: boolean;
    examCountdownTarget?: string;
    setExamMode: (enabled: boolean) => void;
    setExamCountdownTarget: (date?: string) => void;

    // Sync Status
    syncStatus: SyncStatus;
    setSyncStatus: (status: SyncStatus) => void;

    // Network
    isOnline: boolean;
    setOnline: (online: boolean) => void;

    // Notifications
    unreadNotifications: number;
    setUnreadNotifications: (count: number) => void;

    // Onboarding
    onboardingStep: number;
    setOnboardingStep: (step: number) => void;

    toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info'; duration: number }>;
    addToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
    removeToast: (id: string) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    hideToast: () => void;

    // Permissions
    notificationPermission: NotificationPermission | 'unsupported';
    setNotificationPermission: (perm: NotificationPermission | 'unsupported') => void;

    // Theme Management
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Exam Mode
    examMode: false,
    examCountdownTarget: undefined,
    setExamMode: (examMode) => {
        set({ examMode });
        localStorage.setItem('campusly_exam_mode', JSON.stringify(examMode));
    },
    setExamCountdownTarget: (examCountdownTarget) => set({ examCountdownTarget }),

    // Sync
    syncStatus: { pending: 0, failed: 0, isOnline: true },
    setSyncStatus: (syncStatus) => set({ syncStatus }),

    // Network
    isOnline: navigator.onLine,
    setOnline: (isOnline) => set({ isOnline }),

    // Notifications
    unreadNotifications: 0,
    setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),

    // Onboarding
    onboardingStep: 0,
    setOnboardingStep: (onboardingStep) => set({ onboardingStep }),

    // Toast Queue
    toasts: [],
    addToast: (message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type, duration }]
        }));

        if (duration > 0) {
            setTimeout(() => {
                get().removeToast(id);
            }, duration);
        }
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter(t => t.id !== id)
        }));
    },
    showToast: (message, type = 'info') => get().addToast(message, type),
    hideToast: () => {
        const first = get().toasts[0];
        if (first) get().removeToast(first.id);
    },

    // Permissions
    notificationPermission: (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'unsupported',
    setNotificationPermission: (notificationPermission) => set({ notificationPermission }),

    // Theme Management
    theme: (localStorage.getItem('campusly_theme') as 'light' | 'dark') || 'dark',
    setTheme: (theme) => {
        set({ theme });
        localStorage.setItem('campusly_theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
    },
    toggleTheme: () => {
        const nextSync = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(nextSync);
    },
}));

// Initialize settings from localStorage
const savedExamMode = localStorage.getItem('campusly_exam_mode');
if (savedExamMode) {
    useAppStore.getState().setExamMode(JSON.parse(savedExamMode));
}
const savedTheme = localStorage.getItem('campusly_theme') as 'light' | 'dark';
if (savedTheme) {
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
} else {
    // Default to dark mode if no theme is saved
    document.documentElement.classList.toggle('dark', true);
}
