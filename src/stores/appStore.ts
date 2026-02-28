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

    // Toast
    toast: { message: string; type: 'success' | 'error' | 'info' } | null;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    hideToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
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

    // Toast
    toast: null,
    showToast: (message, type = 'info') => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 3000);
    },
    hideToast: () => set({ toast: null }),
}));

// Initialize exam mode from localStorage
const savedExamMode = localStorage.getItem('campusly_exam_mode');
if (savedExamMode) {
    useAppStore.getState().setExamMode(JSON.parse(savedExamMode));
}
