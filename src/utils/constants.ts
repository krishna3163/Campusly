/**
 * Constants — App-wide configuration values
 */

// Pagination
export const PAGE_SIZE = 20;
export const MESSAGES_PER_BATCH = 20;

// File limits
export const MAX_IMAGE_SIZE_PX = 1920;
export const JPEG_QUALITY = 0.75;
export const MAX_FILE_SIZE_MB = 50;
export const MAX_MEDIA_CACHE_MB = 100;

// Rate limits
export const ANONYMOUS_POSTS_PER_HOUR = 5;
export const REPORT_AUTO_HIDE_THRESHOLD = 5;

// Realtime
export const TYPING_DEBOUNCE_MS = 500;
export const TYPING_AUTO_STOP_MS = 3000;
export const HEARTBEAT_INTERVAL_MS = 20000;

// Sync
export const SYNC_INTERVAL_MS = 5000;
export const MAX_RETRY_COUNT = 5;

// Gamification
export const XP_VALUES = {
    message_sent: 1,
    note_shared: 10,
    doubt_answered: 15,
    post_created: 5,
    daily_login: 3,
    streak_bonus: 5,
    referral: 25,
} as const;

// P2P
export const CHUNK_SIZE = 16 * 1024; // 16KB
export const STUN_SERVERS = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
];
