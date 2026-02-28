import { create } from 'zustand';
import type { UserProfile } from '../types';

interface AuthState {
    user: { id: string; email: string; profile: UserProfile } | null;
    isLoading: boolean;
    isOnboarded: boolean;
    setUser: (user: AuthState['user']) => void;
    setLoading: (loading: boolean) => void;
    setOnboarded: (onboarded: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isOnboarded: false,
    setUser: (user) => set({ user, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
    setOnboarded: (isOnboarded) => set({ isOnboarded }),
    logout: () => set({ user: null, isLoading: false }),
}));
