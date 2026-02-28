// ===================================================================
// CAMPUSLY v3.0 — Extended Type Definitions
// Messaging & Group System Upgrade
// EXTENDS existing types. Does NOT remove or modify any existing type.
// ===================================================================

// ===== GROUP ASSIGNMENTS =====
export interface GroupAssignment {
    id: string;
    group_id: string;
    title: string;
    description?: string;
    subject?: string;
    due_date: string;
    created_by: string;
    is_important: boolean;
    attachments: AttachmentMeta[];
    created_at: string;
    updated_at: string;
    // Client-side enrichment
    completion_count?: number;
    total_members?: number;
    creator?: UserProfile;
    is_completed_by_me?: boolean;
}

export interface GroupAssignmentCompletion {
    id: string;
    assignment_id: string;
    user_id: string;
    completed_at: string;
    user?: UserProfile;
}

// ===== GROUP EVENTS =====
export interface GroupEvent {
    id: string;
    group_id: string;
    type: 'test' | 'exam' | 'seminar' | 'class' | 'workshop' | 'deadline';
    title: string;
    description?: string;
    syllabus_coverage?: string;
    revision_resources: RevisionResource[];
    event_date: string;
    location?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    creator?: UserProfile;
}

export interface RevisionResource {
    title: string;
    url?: string;
    type: 'pdf' | 'link' | 'video' | 'note';
}

// ===== GROUP ROLES & PERMISSIONS =====
export type GroupRoleType =
    | 'owner'
    | 'admin'
    | 'co_admin'
    | 'class_representative'
    | 'placement_coordinator'
    | 'moderator'
    | 'member';

export type GroupPermission =
    | 'delete_group'
    | 'assign_roles'
    | 'remove_admins'
    | 'add_assignments'
    | 'add_events'
    | 'pin_messages'
    | 'remove_members'
    | 'moderate_chat'
    | 'post_updates'
    | 'delete_messages'
    | 'warn_users'
    | 'manage_settings';

export interface GroupRole {
    id: string;
    group_id: string;
    user_id: string;
    role: GroupRoleType;
    assigned_by?: string;
    assigned_at: string;
    user?: UserProfile;
}

export interface RolePermission {
    id: string;
    role: GroupRoleType;
    permission: GroupPermission;
}

// ===== MESSAGE REACTIONS =====
export interface MessageReaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
    user?: UserProfile;
}

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

// ===== EXTENDED MESSAGE TYPE =====
export type ExtendedMessageType =
    | 'text' | 'image' | 'video' | 'gif'
    | 'voice' | 'file' | 'sticker'
    | 'contact' | 'location' | 'audio'
    | 'poll' | 'link' | 'system';

// ===== MEDIA CACHE =====
export interface MediaCacheEntry {
    id: string;
    message_id: string;
    original_url?: string;
    compressed_url?: string;
    thumbnail_url?: string;
    file_size_original?: number;
    file_size_compressed?: number;
    mime_type?: string;
    width?: number;
    height?: number;
    duration_seconds?: number;
    encryption_key?: string;
    created_at: string;
}

// ===== SCHEDULED MESSAGES =====
export interface ScheduledMessage {
    id: string;
    user_id: string;
    conversation_id: string;
    content: string;
    message_type: string;
    attachments: AttachmentMeta[];
    scheduled_time: string;
    status: 'pending' | 'sent' | 'cancelled' | 'failed';
    sent_at?: string;
    created_at: string;
}

// ===== STICKER SYSTEM =====
export interface StickerPack {
    id: string;
    name: string;
    description?: string;
    author?: string;
    thumbnail_url?: string;
    is_default: boolean;
    is_campus_official: boolean;
    campus_id?: string;
    stickers?: Sticker[];
    created_at: string;
}

export interface Sticker {
    id: string;
    pack_id: string;
    emoji_tag?: string;
    image_url: string;
    width: number;
    height: number;
    sort_order: number;
    created_at: string;
}

// ===== COMMUNITY SYSTEM =====
export interface Community {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    campus_id?: string;
    announcement_channel_id?: string;
    created_by: string;
    max_groups: number;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
    // Client enrichment
    groups?: Conversation[];
    member_count?: number;
}

export interface CommunityGroup {
    id: string;
    community_id: string;
    group_id: string;
    sort_order: number;
    added_at: string;
}

export interface CommunityMember {
    id: string;
    community_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'moderator' | 'member';
    joined_at: string;
    user?: UserProfile;
}

// ===== CALL SYSTEM =====
export type CallType = 'voice' | 'video' | 'group_voice' | 'group_video';
export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed' | 'declined';

export interface Call {
    id: string;
    conversation_id: string;
    type: CallType;
    status: CallStatus;
    initiated_by: string;
    started_at?: string;
    ended_at?: string;
    duration_seconds?: number;
    ice_servers?: object[];
    created_at: string;
    // Client enrichment
    initiator?: UserProfile;
    participants?: CallParticipant[];
}

export interface CallParticipant {
    id: string;
    call_id: string;
    user_id: string;
    joined_at: string;
    left_at?: string;
    is_muted: boolean;
    is_camera_off: boolean;
    is_screen_sharing: boolean;
    user?: UserProfile;
}

// ===== GROUP JOIN / INVITE =====
export interface GroupJoinRequest {
    id: string;
    group_id: string;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by?: string;
    message?: string;
    created_at: string;
    reviewed_at?: string;
    user?: UserProfile;
}

export interface GroupInviteLink {
    id: string;
    group_id: string;
    code: string;
    created_by: string;
    max_uses?: number;
    use_count: number;
    expires_at?: string;
    is_active: boolean;
    created_at: string;
}

// ===== PRACTICE MODE =====
export interface PracticeTest {
    id: string;
    group_id: string;
    title: string;
    subject?: string;
    description?: string;
    time_limit_minutes: number;
    created_by: string;
    is_active: boolean;
    created_at: string;
    // Client enrichment
    question_count?: number;
    attempt_count?: number;
    my_attempt?: PracticeAttempt;
}

export interface PracticeQuestion {
    id: string;
    test_id: string;
    question_text: string;
    options: string[];
    correct_option: number;
    explanation?: string;
    points: number;
    sort_order: number;
}

export interface PracticeAttempt {
    id: string;
    test_id: string;
    user_id: string;
    answers: Record<string, number>;
    score: number;
    max_score: number;
    time_taken_seconds?: number;
    started_at: string;
    completed_at?: string;
    user?: UserProfile;
}

// ===== EXTENDED CONVERSATION (augmented fields) =====
export interface ConversationExtended {
    pinned_message_ids?: string[];
    is_broadcast?: boolean;
    join_approval_required?: boolean;
    invite_link_code?: string;
    community_id?: string;
}

// ===== GROUP TAB NAVIGATION =====
export type GroupTab = 'chat' | 'assignments' | 'events' | 'media' | 'members';

// Re-export existing types so this file can be used as a standalone import
import type { UserProfile, Conversation, AttachmentMeta } from './index';
export type { UserProfile, Conversation, AttachmentMeta };
