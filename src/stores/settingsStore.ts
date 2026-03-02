import { create } from 'zustand';
import { db } from '../lib/db';

export type SettingType = 'toggle' | 'dropdown' | 'input' | 'slider' | 'action';

export interface SettingItem {
    id: string;
    title: string;
    description: string;
    type: SettingType;
    value: any;
    options?: string[]; // For dropdown
    min?: number; // For slider
    max?: number; // For slider
    sync?: boolean;
    role?: 'user' | 'moderator' | 'admin';
    actionText?: string;
}

export interface SettingsCategory {
    id: string;
    title: string;
    icon: string;
    items: SettingItem[];
}

interface SettingsState {
    categories: SettingsCategory[];
    searchQuery: string;
    isInitialized: boolean;
    init: (userId: string) => Promise<void>;
    updateSetting: (categoryId: string, settingId: string, value: any) => Promise<void>;
    setSearchQuery: (query: string) => void;
    syncToBackend: (userId: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    categories: [
        {
            id: 'account',
            title: 'Account Settings',
            icon: 'User',
            items: [
                { id: 'name', title: 'Display Name', description: 'Your full name shown on profile', type: 'input', value: '', sync: true },
                { id: 'bio', title: 'Bio', description: 'Short description about yourself', type: 'input', value: '', sync: true },
                { id: 'branch', title: 'Branch', description: 'Academic branch (e.g., CSE, ECE)', type: 'input', value: '', sync: true },
                { id: 'semester', title: 'Semester', description: 'Current semester level', type: 'dropdown', value: '1', options: ['1', '2', '3', '4', '5', '6', '7', '8'], sync: true },
                { id: 'email', title: 'Email Address', description: 'Your academic email', type: 'input', value: '', sync: true },
                { id: 'phone', title: 'Phone Number', description: 'Used for important alerts', type: 'input', value: '', sync: true },
                { id: 'account_type', title: 'Account Type', description: 'Student or Alumni status', type: 'dropdown', value: 'Student', options: ['Student', 'Alumni'], sync: true },
                { id: 'deactivate', title: 'Deactivate Account', description: 'Temporary disable your account', type: 'action', actionText: 'Deactivate', value: null },
                { id: 'delete_account', title: 'Delete Account', description: 'Permanent deletion (cannot be undone)', type: 'action', actionText: 'Delete Forever', value: null }
            ]
        },
        {
            id: 'privacy',
            title: 'Privacy Settings',
            icon: 'Shield',
            items: [
                { id: 'visibility', title: 'Profile Visibility', description: 'Who can see your profile', type: 'dropdown', value: 'Friends only', options: ['Public', 'Campus only', 'Friends only'], sync: true },
                { id: 'last_seen', title: 'Last Seen', description: 'Show when you were last active', type: 'toggle', value: true, sync: true },
                { id: 'online_status', title: 'Online Status', description: 'Show when you are online', type: 'toggle', value: true, sync: true },
                { id: 'read_receipts', title: 'Read Receipts', description: 'Show others when you have read messages', type: 'toggle', value: true, sync: true },
                { id: 'message_restriction', title: 'Who can message me', description: 'Restrict incoming messages', type: 'dropdown', value: 'Campus only', options: ['Everyone', 'Campus only', 'Friends only'], sync: true },
                { id: 'view_resume', title: 'Who can view resume', description: 'Privacy for your CV', type: 'dropdown', value: 'Campus only', options: ['Everyone', 'Campus only', 'Friends only'], sync: true },
                { id: 'anonymous_mode', title: 'Anonymous Feed Mode', description: 'Hide identity in feed by default', type: 'toggle', value: false, sync: true }
            ]
        },
        {
            id: 'security',
            title: 'Security Settings',
            icon: 'Lock',
            items: [
                { id: 'tfa', title: 'Two-Factor Authentication', description: 'Secure your login with 2FA', type: 'toggle', value: false, sync: true },
                { id: 'biometric_lock', title: 'Biometric Lock', description: 'Fingerprint/FaceID to unlock app', type: 'toggle', value: false, sync: false },
                { id: 'app_pin', title: 'App PIN Lock', description: 'Require 4-digit PIN', type: 'toggle', value: false, sync: false },
                { id: 'encryption_status', title: 'E2E Encryption', description: 'Identity keys status', type: 'action', actionText: 'Rotate Keys', value: null }
            ]
        },
        {
            id: 'chat',
            title: 'Chat Settings',
            icon: 'MessageSquare',
            items: [
                { id: 'bubble_style', title: 'Bubble Style', description: 'Modern rounded or classic compact', type: 'dropdown', value: 'Rounded', options: ['Rounded', 'Compact'], sync: false },
                { id: 'font_size', title: 'Font Size', description: 'Text scale in messages', type: 'slider', value: 16, min: 12, max: 24, sync: false },
                { id: 'media_auto_download', title: 'Auto-download media', description: 'Mobile data saver setting', type: 'dropdown', value: 'WiFi only', options: ['WiFi only', 'Mobile data', 'Never'], sync: false },
                { id: 'enter_send', title: 'Enter to Send', description: 'Press Enter to send message', type: 'toggle', value: true, sync: false },
                { id: 'typing_indicator', title: 'Typing Indicator', description: 'Show others when you are typing', type: 'toggle', value: true, sync: true }
            ]
        },
        {
            id: 'feed',
            title: 'Campus Feed',
            icon: 'Rss',
            items: [
                { id: 'default_category', title: 'Default Category', description: 'Starting feed view', type: 'dropdown', value: 'Latest', options: ['Latest', 'Trending', 'Anonymous', 'Placement'], sync: false },
                { id: 'profanity_filter', title: 'Profanity Filter', description: 'Level of content moderation', type: 'dropdown', value: 'Medium', options: ['None', 'Medium', 'Strict'], sync: false },
                { id: 'auto_hide_voted', title: 'Auto-hide lowvoted', description: 'Hide posts with negative votes', type: 'toggle', value: true, sync: false },
                { id: 'feed_density', title: 'Feed Density', description: 'Display layout of the feed', type: 'dropdown', value: 'Comfortable', options: ['Comfortable', 'Compact'], sync: false }
            ]
        },
        {
            id: 'study',
            title: 'Study Settings',
            icon: 'BookOpen',
            items: [
                { id: 'exam_reminder', title: 'Exam Reminders', description: 'Days before notification', type: 'slider', value: 3, min: 1, max: 7, sync: false },
                { id: 'focus_mode', title: 'Auto Focus Mode', description: 'Active during study streaks', type: 'toggle', value: false, sync: false },
                { id: 'cloud_notes', title: 'Cloud Sync Notes', description: 'Backup your data to InsForge', type: 'toggle', value: true, sync: true },
                { id: 'countdown_home', title: 'Exam Countdown', description: 'Show on dashboard', type: 'toggle', value: true, sync: false }
            ]
        },
        {
            id: 'placement',
            title: 'Placement Hub',
            icon: 'Briefcase',
            items: [
                { id: 'job_alerts', title: 'Relevant Job Alerts', description: 'Push notifications for companies', type: 'toggle', value: true, sync: true },
                { id: 'auto_apply_suggestion', title: 'Auto-apply suggestions', description: 'AI-driven job mapping', type: 'toggle', value: true, sync: false },
                { id: 'hide_irrelevant_jobs', title: 'Hide non-relevant', description: 'Filters by your branch', type: 'toggle', value: true, sync: false }
            ]
        },
        {
            id: 'resume',
            title: 'Resume & CV',
            icon: 'FileUser',
            items: [
                { id: 'resume_template', title: 'Resume Template', description: 'Layout design for your CV', type: 'dropdown', value: 'Modern', options: ['Modern', 'Academic', 'Minimal'], sync: true },
                { id: 'skills_auto_update', title: 'Auto-update skills', description: 'Extract skills from activity', type: 'toggle', value: true, sync: true },
                { id: 'resume_link_sharing', title: 'Public Sharing', description: 'Enable unique sharing link', type: 'toggle', value: false, sync: true }
            ]
        },
        {
            id: 'notifications',
            title: 'Push Notifications',
            icon: 'Bell',
            items: [
                { id: 'dm_notif', title: 'Direct Messages', description: 'Push for private chats', type: 'toggle', value: true, sync: false },
                { id: 'group_notif', title: 'Group Messages', description: 'Push for group chats', type: 'toggle', value: true, sync: false },
                { id: 'sound_selector', title: 'Notification Sound', description: 'Sound theme for alerts', type: 'dropdown', value: 'Futuristic', options: ['Futuristic', 'Soft', 'Classic', 'Silent'], sync: false },
                { id: 'email_notif', title: 'Email Digests', description: 'Weekly highlights to email', type: 'toggle', value: false, sync: true }
            ]
        },
        {
            id: 'appearance',
            title: 'Aesthetics',
            icon: 'Palette',
            items: [
                { id: 'theme', title: 'App Mode', description: 'Look and feel of UI', type: 'dropdown', value: 'Dark', options: ['Light', 'Dark', 'System'], sync: false },
                { id: 'accent_color', title: 'Accent Color', description: 'Primary brand coloring', type: 'dropdown', value: 'Cyan', options: ['Cyan', 'Purple', 'Emerald', 'Amber'], sync: false },
                { id: 'animation_intensity', title: 'Animations', description: 'Smoothness transitions', type: 'dropdown', value: 'High', options: ['None', 'Low', 'High'], sync: false },
                { id: 'rounded_radius', title: 'Corner Radius', description: 'UI curve intensity', type: 'slider', value: 16, min: 0, max: 24, sync: false }
            ]
        },
        {
            id: 'accessibility',
            title: 'Accessibility',
            icon: 'Accessibility',
            items: [
                { id: 'high_contrast', title: 'High Contrast', description: 'Easily distinguishable UI', type: 'toggle', value: false, sync: false },
                { id: 'large_text', title: 'Larger Text', description: 'Accessibility text scaling', type: 'toggle', value: false, sync: false },
                { id: 'screen_reader_opt', title: 'Screen Reader Opt', description: 'Simplified UI structure', type: 'toggle', value: false, sync: false },
                { id: 'dyslexia_font', title: 'Dyslexia Friendly', description: 'Use specialized font', type: 'toggle', value: false, sync: false }
            ]
        },
        {
            id: 'data',
            title: 'Local Data',
            icon: 'Database',
            items: [
                { id: 'clear_cache', title: 'Clear Media Cache', description: 'Clears downloaded images/videos', type: 'action', actionText: 'Clear Now', value: null },
                { id: 'wipe_all', title: 'Reset App Data', description: 'Logout and clear everything', type: 'action', actionText: 'Full Wipe', value: null },
                { id: 'export_data', title: 'Export GDPR Data', description: 'Download archive of your data', type: 'action', actionText: 'Export', value: null }
            ]
        },
        {
            id: 'performance',
            title: 'Performance',
            icon: 'Zap',
            items: [
                { id: 'low_data_mode', title: 'Low Data Mode', description: 'Reduce network usage', type: 'toggle', value: false, sync: false },
                { id: 'limit_bg_processes', title: 'Limit Background', description: 'Boost UI responsiveness', type: 'toggle', value: true, sync: false },
                { id: 'media_preload', title: 'Media Preload', description: 'Faster viewing but more data', type: 'toggle', value: true, sync: false }
            ]
        },
        {
            id: 'moderation',
            title: 'Moderation',
            icon: 'ShieldAlert',
            items: [
                { id: 'view_reports', title: 'Reports Dashboard', description: 'Flagged content queue', type: 'action', actionText: 'Open', value: null, role: 'moderator' },
                { id: 'suspend_users', title: 'User Suspension', description: 'Ban management tool', type: 'action', actionText: 'Manage', value: null, role: 'admin' },
                { id: 'campus_analytics', title: 'Campus Traffic', description: 'View engagement stats', type: 'action', actionText: 'View', value: null, role: 'moderator' }
            ]
        },
        {
            id: 'legal',
            title: 'Legal & Support',
            icon: 'FileText',
            items: [
                { id: 'privacy_policy', title: 'Privacy Policy', description: 'How we handle your data', type: 'action', actionText: 'View', value: null },
                { id: 'report_bug', title: 'Report a Bug', description: 'Direct line to developers', type: 'action', actionText: 'Report', value: null }
            ]
        }
    ],
    searchQuery: '',
    isInitialized: false,

    init: async (_userId: string) => {
        try {
            const localSettings = await db.settings.toArray();
            if (localSettings.length > 0) {
                const categories = get().categories.map(cat => ({
                    ...cat,
                    items: cat.items.map(item => {
                        const saved = localSettings.find(s => s.category === cat.id && s.key === item.id);
                        return {
                            ...item,
                            value: saved ? saved.value : item.value
                        };
                    })
                }));
                set({ categories, isInitialized: true });
            } else {
                // First initialization - save defaults to local db
                const itemsToSave = get().categories.flatMap(cat =>
                    cat.items.map(item => ({
                        category: cat.id,
                        key: item.id,
                        value: item.value,
                        updatedAt: new Date().toISOString(),
                        isSynced: false
                    }))
                );
                await db.settings.bulkAdd(itemsToSave as any);
                set({ isInitialized: true });
            }
        } catch (err) {
            console.error('Failed to init settings store:', err);
        }
    },

    updateSetting: async (categoryId: string, settingId: string, value: any) => {
        const item = get().categories.find(c => c.id === categoryId)?.items.find(i => i.id === settingId);
        if (!item) return;

        // Optimistic update
        set(state => ({
            categories: state.categories.map(cat =>
                cat.id === categoryId ? {
                    ...cat,
                    items: cat.items.map(i => i.id === settingId ? { ...i, value } : i)
                } : cat
            )
        }));

        // Persist locally
        await db.settings.put({
            category: categoryId,
            key: settingId,
            value,
            updatedAt: new Date().toISOString(),
            isSynced: false
        });
    },

    setSearchQuery: (query: string) => set({ searchQuery: query }),

    syncToBackend: async (_userId: string) => {
        const pendingSync = await db.settings.filter(s => !s.isSynced).toArray();
        if (pendingSync.length === 0) return;
        // Mock sync logic
        await db.settings.bulkUpdate(pendingSync.map(s => ({
            key: [s.category, s.key],
            changes: { isSynced: true }
        })));
    }
}));
