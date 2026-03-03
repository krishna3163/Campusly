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
    privacy_settings: PrivacySettings;
    status_privacy: 'all' | 'contacts' | 'none';
}

export interface PrivacySettings {
    last_seen: 'all' | 'contacts' | 'none';
    profile_photo: 'all' | 'contacts' | 'none';
    about: 'all' | 'contacts' | 'none';
    read_receipts: boolean;
    group_add_permission: 'all' | 'contacts' | 'none';
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
    type: 'private' | 'group' | 'supergroup' | 'channel' | 'community' | 'direct' | 'subject_channel' | 'broadcast';
    name?: string;
    description?: string;
    avatar_url?: string;
    subject?: string;
    semester?: number;
    created_by?: string;
    is_exam_mode: boolean;
    is_important: boolean;
    is_public: boolean;
    invite_link?: string;
    slow_mode_delay?: number; // In seconds
    topic_enabled: boolean;
    member_count: number;
    subscriber_count: number;
    max_members: number;
    disappearing_timer?: number; // In seconds (86400, 604800, etc)
    is_archived: boolean;
    is_muted: boolean;
    muted?: boolean; // From conversation_members
    mute_until?: string;
    wallpaper?: string;
    community_id?: string; // If part of a community
    is_announcement: boolean; // For community announcement groups
    is_pinned_private: boolean;
    is_pinned_group: boolean;
    visibility: 'public' | 'private';
    invite_link_code?: string;

    created_at: string;
    updated_at: string;
    // Client-side computed
    last_message?: Message;
    unread_count?: number;
    members?: ConversationMember[];
    other_user?: UserProfile;
    channel_settings?: ChannelSettings;
}

export interface ConversationMember {
    id: string;
    conversation_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'moderator' | 'member';
    muted: boolean;
    muted_until?: string;
    joined_at: string;
    last_read_at: string;
    permissions?: string[]; // Custom permissions override
    profile?: UserProfile;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'error';

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content?: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'voice_note' | 'document' | 'poll' | 'link' | 'system';
    reply_to?: string;
    reply_to_message_id?: string;
    reply_thread_id?: string; // For supergroup topics
    forward_from_id?: string; // Original message sender ID if forwarded
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
    poll_id?: string;
    poll_data?: Poll; // Populated poll data
    reactions: Record<string, string[]>;
    view_count: number; // For channel posts
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    scheduled_at?: string; // For scheduled messages
    is_view_once: boolean;
    is_hd: boolean;
    starred_by: string[]; // User IDs who starred this
    expires_at?: string; // For disappearing messages
    is_viewed: boolean;
    view_timestamp?: string;
    encryption_type: 'none' | 'signal' | 'campusly_v1';
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

export interface Poll {
    id: string;
    conversation_id: string;
    creator_id: string;
    question: string;
    options: string[]; // Option texts
    options_votes?: Record<number, string[]>; // Map of option index to user IDs
    is_anonymous: boolean;
    is_multiple_choice: boolean;
    is_quiz: boolean;
    correct_option_index?: number;
    total_votes: number;
    expires_at?: string;
    created_at: string;
}

export interface PollVote {
    id: string;
    poll_id: string;
    user_id: string;
    option_index: number;
    created_at: string;
}

export interface GroupInvite {
    id: string;
    conversation_id: string;
    created_by: string;
    code: string;
    max_uses?: number;
    current_uses: number;
    expires_at?: string;
    is_revoked: boolean;
    created_at: string;
}

export interface JoinRequest {
    id: string;
    conversation_id: string;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: string;
    processed_by?: string;
    processed_at?: string;
}

export interface AdminLog {
    id: string;
    group_id: string;
    performed_by: string;
    action_type: string;
    target_user?: string;
    details?: Record<string, any>;
    created_at: string;
    performer?: UserProfile;
    target?: UserProfile;
}

export interface ChannelSettings {
    conversation_id: string;
    comment_enabled: boolean;
    allow_reactions: boolean;
    auto_delete_days: number;
    slow_mode: number;
    public_visibility: boolean;
    updated_at: string;
}

// ===== WHATSAPP SPECIFIC FEATURES =====

export interface StatusStory {
    id: string;
    user_id: string;
    campus_id?: string;
    type: 'text' | 'image' | 'video';
    content?: string;
    media_url?: string;
    thumbnail_url?: string;
    duration?: number;
    metadata: StoryMetadata;
    music_id?: string;
    link_attachment?: string;

    view_count: number;
    reaction_count: number;
    reply_count: number;
    screenshot_count: number;
    forward_count: number;

    visibility: 'everyone' | 'contacts' | 'close_friends' | 'private';
    is_view_once: boolean;

    expires_at: string;
    created_at: string;
    // Client enrichment
    user?: UserProfile;
    views?: StatusView[];
    reactions?: StoryReaction[];
    my_reaction?: string;
    poll?: StoryPoll;
}

export interface StoryMetadata {
    bg_color?: string;
    type?: 'vibe_check';
    emoji?: string;
    stickers?: StorySticker[];
    drawing_data?: any;
    text_styles?: any;
    location?: { lat: number; lng: number; name: string };
    department_tag?: string;
    branch_tag?: string;
    exam_countdown?: string;
    event_id?: string;
    mentions?: string[]; // User IDs
    hashtags?: string[];
}

export interface StorySticker {
    id: string;
    type: 'emoji' | 'location' | 'time' | 'poll' | 'question' | 'countdown' | 'mention' | 'hashtag' | 'branch' | 'exam' | 'placement' | 'event';
    x: number;
    y: number;
    rotation: number;
    scale: number;
    data: any;
}

export interface StatusView {
    id: string;
    story_id: string;
    user_id: string;
    viewed_at: string;
    user?: UserProfile;
}

export interface StoryReaction {
    id: string;
    story_id: string;
    user_id: string;
    type: 'like' | 'emoji';
    emoji?: string;
    created_at: string;
    user?: UserProfile;
}

export interface StoryHighlight {
    id: string;
    user_id: string;
    name: string;
    cover_url?: string;
    created_at: string;
    items?: StatusStory[];
}

export interface StoryPoll {
    id: string;
    story_id: string;
    question: string;
    options: { text: string; count: number }[];
    created_at: string;
    my_vote?: number;
}

export interface StoryPollVote {
    id: string;
    poll_id: string;
    user_id: string;
    option_index: number;
    created_at: string;
}

export interface StoryScreenshotLog {
    id: string;
    story_id: string;
    user_id: string;
    logged_at: string;
}

export interface CloseFriendEntry {
    id: string;
    owner_id: string;
    friend_id: string;
    created_at: string;
}

export interface BroadcastList {
    id: string;
    creator_id: string;
    name: string;
    member_count: number;
    created_at: string;
    updated_at: string;
}

export interface BroadcastMember {
    id: string;
    list_id: string;
    user_id: string;
    joined_at: string;
}

export interface Community {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    creator_id: string;
    announcement_group_id: string;
    member_count: number;
    group_count: number;
    created_at: string;
    updated_at: string;
}

export interface CommunityGroup {
    id: string;
    community_id: string;
    conversation_id: string;
    added_at: string;
}

export interface Call {
    id: string;
    type: 'audio' | 'video';
    conversation_id?: string; // For group calls
    initiator_id: string;
    status: 'ringing' | 'active' | 'ended' | 'missed' | 'rejected' | 'busy';
    is_group: boolean;
    started_at: string;
    ended_at?: string;
    participants: CallParticipant[];
}

export interface CallParticipant {
    id: string;
    call_id: string;
    user_id: string;
    status: 'ringing' | 'accepted' | 'rejected' | 'left';
    joined_at?: string;
    left_at?: string;
}

export interface LinkedDevice {
    id: string;
    user_id: string;
    device_name: string;
    device_type: 'web' | 'desktop' | 'mobile';
    last_active: string;
    is_trusted: boolean;
    public_key: string;
    created_at: string;
}

// ===== CAMPUS FEED =====
export interface Post {
    id: string;
    user_id: string;
    campus_id: string;
    category: string;
    content: string;
    media_url?: string | null;
    media_type?: string | null;
    type: 'text' | 'photo' | 'video' | 'quote' | 'poll' | 'remix' | 'media';
    original_post_id?: string | null;
    hashtags?: string[];
    likes_count: number;
    dislikes_count: number;
    repost_count: number;
    comments_count: number;
    is_anonymous: boolean;
    created_at: string;
    rankingScore?: number;
    // Client enrichment
    author?: UserProfile;
    original_post?: Post;
    user_vote?: 'like' | 'dislike' | null;
}

export interface Comment {
    id: string;
    post_id: string;
    author_id: string;
    parent_id?: string | null;
    upvotes?: number;
    content: string;
    created_at: string;
    // Client enrichment
    author?: UserProfile;
    replies?: Comment[];
    user_reaction?: string | null;
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
