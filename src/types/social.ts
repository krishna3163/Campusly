// ===================================================================
// Campusly v4.0 — Trust, Reporting & Social Graph Types
// EXTENDS existing type system. No existing types modified.
// ===================================================================

import type { UserProfile } from './index';

// ===== BUG REPORTS =====
export interface BugReport {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    steps?: string;
    screenshot_url?: string;
    device_info: DeviceInfo;
    app_version: string;
    status: 'open' | 'reviewing' | 'resolved' | 'closed';
    admin_response?: string;
    responded_by?: string;
    responded_at?: string;
    created_at: string;
    user?: UserProfile;
}

export interface DeviceInfo {
    userAgent: string;
    platform: string;
    language: string;
    screenWidth: number;
    screenHeight: number;
    online: boolean;
    cookiesEnabled: boolean;
    memoryGB?: number;
}

// ===== ERROR LOGS =====
export interface ErrorLog {
    id: string;
    user_id?: string;
    error_message: string;
    stack_trace?: string;
    device_info: DeviceInfo;
    last_action?: string;
    url?: string;
    created_at: string;
}

// ===== FRIEND SYSTEM =====
export interface FriendRequest {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
    sender?: UserProfile;
    receiver?: UserProfile;
}

export interface Friendship {
    id: string;
    user_id_1: string;
    user_id_2: string;
    created_at: string;
    friend?: UserProfile;
}

// ===== SUGGESTION SYSTEM =====
export interface UserSuggestion {
    user: UserProfile;
    reason: 'same_campus' | 'same_branch' | 'same_semester' | 'mutual_friends' | 'top_contributor' | 'active_user' | 'admin' | 'peer';
    score: number;
}

export interface SuggestionAction {
    id: string;
    user_id: string;
    suggested_user_id: string;
    action: 'dismissed' | 'connected' | 'followed';
    created_at: string;
}

// ===== DEVELOPER INFO =====
export const DEVELOPER_INFO = {
    name: 'Krishna Kumar',
    title: 'Software Developer — Problem Solver — Open Source Contributor',
    location: 'Lucknow, Uttar Pradesh, India',
    email: 'kk3163019@gmail.com',
    links: {
        linkedin: 'https://www.linkedin.com/in/krishna0858',
        github: 'https://github.com/krishna3163',
        instagram: 'https://www.instagram.com/krishna.0858/',
        email: 'mailto:kk3163019@gmail.com',
    },
} as const;

export const ADMIN_USER_ID = 'db98f974-752b-4f66-a9ed-1dd35fcfbb93';
export const APP_VERSION = '0.1.0';
