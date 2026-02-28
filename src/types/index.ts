// ===== USER & AUTH =====
export interface User {
    id: string;
    email: string;
    profile: UserProfile;
}

export interface UserProfile {
    id: string;
    display_name: string;
    avatar_url?: string;
    branch?: string;
    semester?: number;
    campus_id?: string;
    college_email?: string;
    college_verified?: boolean;
    skills: string[];
    interests: string[];
    placement_status: string;
    study_goals?: string;
    bio?: string;
    is_senior: boolean;
    reputation_score: number;
    badges: string[];
    anonymous_alias?: string;
    activity_status?: string;
    privacy_level: string;
    last_seen: string;
    xp: number;
    streak_days: number;
    streak_last_date?: string;
    referral_code?: string;
    referred_by?: string;
    exam_mode: boolean;
}

export interface Campus {
    id: string;
    name: string;
    short_name?: string;
    university?: string;
    city?: string;
    state?: string;
    logo_url?: string;
    feature_flags?: Record<string, boolean>;
}

// ===== CONVERSATIONS & MESSAGES =====
export interface Conversation {
    id: string;
    type: 'direct' | 'group' | 'broadcast' | 'subject_channel';
    name?: string;
    description?: string;
    avatar_url?: string;
    subject?: string;
    semester?: number;
    created_by?: string;
    is_exam_mode: boolean;
    is_important: boolean;
    max_members: number;
    created_at: string;
    updated_at: string;
    // Client-side computed
    last_message?: Message;
    unread_count?: number;
    members?: ConversationMember[];
    other_user?: UserProfile;
}

export interface ConversationMember {
    id: string;
    conversation_id: string;
    user_id: string;
    role: 'admin' | 'moderator' | 'member';
    muted: boolean;
    muted_until?: string;
    joined_at: string;
    last_read_at: string;
    profile?: UserProfile;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content?: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'voice_note' | 'document' | 'poll' | 'link' | 'system';
    reply_to?: string;
    reply_to_message_id?: string;
    thread_root?: string;
    is_doubt: boolean;
    is_important: boolean;
    is_edited: boolean;
    is_deleted: boolean;
    edited_at?: string;
    deleted_at?: string;
    status: MessageStatus;
    media_url?: string;
    media_key?: string;
    media_local_id?: string;
    media_size?: number;
    media_mime?: string;
    attachments_metadata?: AttachmentMeta[];
    poll_data?: PollData;
    reactions: Record<string, string[]>;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    // Client enrichment
    sender?: UserProfile;
    reply_message?: Message;
}

export interface AttachmentMeta {
    name: string;
    size: number;
    mime: string;
    url?: string;
    local_id?: string;
    thumbnail_url?: string;
}

export interface PollData {
    question: string;
    options: PollOption[];
    multiple_choice: boolean;
    expires_at?: string;
}

export interface PollOption {
    id: string;
    text: string;
    votes: string[];
}

// ===== CAMPUS FEED =====
export interface Post {
    id: string;
    author_id: string;
    campus_id: string;
    category: 'general' | 'event' | 'hostel' | 'lost_found' | 'confession' | 'marketplace' | 'announcement' | 'question';
    title?: string;
    content: string;
    media_urls: string[];
    is_anonymous: boolean;
    is_pinned: boolean;
    is_hidden: boolean;
    upvotes: number;
    downvotes: number;
    comment_count: number;
    report_count: number;
    price?: number;
    event_date?: string;
    event_location?: string;
    created_at: string;
    rankingScore?: number;
    // Client enrichment
    author?: UserProfile;
    user_vote?: 'up' | 'down' | null;
}

export interface Comment {
    id: string;
    post_id: string;
    author_id: string;
    parent_id?: string;
    content: string;
    is_anonymous: boolean;
    upvotes: number;
    created_at: string;
    author?: UserProfile;
    replies?: Comment[];
}

// ===== STUDY =====
export interface Note {
    id: string;
    user_id: string;
    campus_id?: string;
    title: string;
    content?: string;
    subject?: string;
    semester?: number;
    tags: string[];
    type: 'note' | 'pyq' | 'summary' | 'recording';
    file_url?: string;
    file_key?: string;
    ai_summary?: string;
    is_shared: boolean;
    folder_path: string;
    download_count: number;
    rating: number;
    created_at: string;
}

export interface Assignment {
    id: string;
    user_id: string;
    title: string;
    subject?: string;
    description?: string;
    due_date?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    priority: 'low' | 'medium' | 'high' | 'critical';
    conversation_id?: string;
    created_at: string;
}

export interface Exam {
    id: string;
    user_id: string;
    campus_id?: string;
    title: string;
    subject?: string;
    exam_date: string;
    exam_type: 'internal' | 'external' | 'quiz' | 'viva';
    syllabus?: string;
    marks_total?: number;
    marks_obtained?: number;
    conversation_id?: string;
    created_at: string;
}

// ===== PLACEMENT =====
export interface InterviewExperience {
    id: string;
    author_id: string;
    campus_id?: string;
    company: string;
    role?: string;
    batch_year?: number;
    branch?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    result: 'selected' | 'rejected' | 'waitlisted' | 'pending';
    rounds: InterviewRound[];
    preparation_tips?: string;
    salary_offered?: string;
    interview_date?: string;
    upvotes: number;
    created_at: string;
    author?: UserProfile;
}

export interface InterviewRound {
    name: string;
    type: string;
    questions: string[];
    tips: string;
}

// ===== NOTIFICATIONS =====
export interface AppNotification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body?: string;
    data: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}

// ===== MODERATION =====
export interface Report {
    id: string;
    reporter_id: string;
    content_type: 'post' | 'comment' | 'message' | 'profile';
    content_id: string;
    reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
    description?: string;
    status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
    reviewed_by?: string;
    created_at: string;
}

export interface CampusRole {
    id: string;
    user_id: string;
    campus_id: string;
    role: 'ambassador' | 'moderator' | 'admin';
    granted_by?: string;
    created_at: string;
}

export interface ContentFlag {
    id: string;
    content_type: 'post' | 'comment' | 'message';
    content_id: string;
    flag_type: 'profanity' | 'spam' | 'auto_hidden' | 'manual_review';
    details?: string;
    created_at: string;
}

// ===== REFERRAL & GAMIFICATION =====
export interface Referral {
    id: string;
    inviter_id: string;
    invited_user_id: string;
    campus_id: string;
    created_at: string;
}

export interface XPEvent {
    id: string;
    user_id: string;
    action: 'message_sent' | 'note_shared' | 'doubt_answered' | 'post_created' | 'daily_login' | 'streak_bonus' | 'referral';
    xp_amount: number;
    created_at: string;
}

export interface LeaderboardEntry {
    user_id: string;
    display_name: string;
    avatar_url?: string;
    branch?: string;
    xp: number;
    rank: number;
}

// ===== CAMPUS METRICS =====
export interface CampusMetrics {
    id: string;
    campus_id: string;
    date: string;
    dau: number;
    messages_count: number;
    assignments_added: number;
    feed_posts_count: number;
    new_users: number;
    created_at: string;
}

// ===== SYNC =====
export interface SyncStatus {
    pending: number;
    failed: number;
    lastSyncAt?: string;
    isOnline: boolean;
}

// ===== P2P =====
export interface P2PTransfer {
    id: string;
    peer_id: string;
    file_name: string;
    file_size: number;
    transferred: number;
    status: 'pairing' | 'transferring' | 'completed' | 'failed';
    direction: 'send' | 'receive';
}

export type TabRoute = 'chats' | 'campus' | 'study' | 'placement' | 'profile';
