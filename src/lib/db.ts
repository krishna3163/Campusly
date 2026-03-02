import Dexie, { type Table } from 'dexie';

// ===== LOCAL INTERFACES =====

export interface LocalMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: string;
    replyTo?: string;
    replyToMessageId?: string;
    replyThreadId?: string; // For supergroup topics
    forwardFromId?: string; // Original message sender ID if forwarded
    isDoubt: boolean;
    isImportant: boolean;
    isEdited: boolean;
    isDeleted: boolean;
    editedAt?: string;
    deletedAt?: string;
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    mediaUrl?: string;
    mediaKey?: string;
    mediaLocalId?: string;
    mediaSize?: number;
    mediaMime?: string;
    attachmentsMetadata?: Array<{
        name: string;
        size: number;
        mime: string;
        url?: string;
        localId?: string;
        thumbnailUrl?: string;
    }>;
    pollId?: string; // Reference to polls table
    viewCount: number; // For channel posts
    metadata: Record<string, unknown>;
    syncStatus: 'synced' | 'pending' | 'failed';
    updatedAt: string;
    scheduledAt?: string; // For scheduled messages
    isViewOnce: boolean;
    isHD: boolean;
    expiresAt?: string; // For disappearing messages
    encryptionType: string;
}

export interface LocalConversation {
    id: string;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    name?: string;
    description?: string;
    avatarUrl?: string;
    subject?: string;
    semester?: number;
    createdBy?: string;
    isExamMode: boolean;
    isPublic: boolean;
    inviteLink?: string;
    slowModeDelay?: number; // In seconds
    topicEnabled?: boolean;
    memberCount: number;
    subscriberCount: number;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    disappearingTimer?: number;
    isArchived: boolean;
    isMuted: boolean;
    muteUntil?: string;
    wallpaper?: string;
    communityId?: string;
    isAnnouncement: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LocalConversationMember {
    id: string;
    conversationId: string;
    userId: string;
    role: 'owner' | 'admin' | 'moderator' | 'member';
    muted: boolean;
    joinedAt: string;
    lastReadAt: string;
    permissions?: string[]; // Custom permissions override
}

export interface LocalGroupInvite {
    id: string;
    conversationId: string;
    createdBy: string;
    code: string;
    maxUses?: number;
    currentUses: number;
    expiresAt?: string;
    isRevoked: boolean;
    createdAt: string;
}

export interface LocalGroupJoinRequest {
    id: string;
    conversationId: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
    processedBy?: string;
    processedAt?: string;
}

export interface LocalPinnedMessage {
    id: string;
    conversationId: string;
    messageId: string;
    pinnedBy: string;
    order: number;
    pinnedAt: string;
}

export interface LocalReaction {
    id: string;
    messageId: string;
    userId: string;
    emoji: string;
    createdAt: string;
}

export interface LocalPoll {
    id: string;
    conversationId: string;
    creatorId: string;
    question: string;
    options: string[];
    isAnonymous: boolean;
    isMultipleChoice: boolean;
    isQuiz: boolean;
    correctOptionIndex?: number;
    totalVotes: number;
    expiresAt?: string;
    createdAt: string;
}

export interface LocalPollVote {
    id: string;
    pollId: string;
    userId: string;
    optionIndex: number;
    createdAt: string;
}

export interface LocalAdminLog {
    id: string;
    conversationId: string;
    adminId: string;
    action: 'user_added' | 'user_removed' | 'permission_changed' | 'message_deleted' | 'slow_mode_changed' | 'topic_created' | 'info_edited';
    targetId?: string;
    details: Record<string, unknown>;
    createdAt: string;
}

export interface LocalChannelSetting {
    conversationId: string;
    commentEnabled: boolean;
    allowReactions: boolean;
    autoDeleteDays: number; // 0 for disabled
    slowMode: number;
    publicVisibility: boolean;
    updatedAt: string;
}

export interface LocalProfile {
    id: string;
    displayName: string;
    avatarUrl?: string;
    branch?: string;
    semester?: number;
    campusId?: string;
    skills: string[];
    interests: string[];
    placementStatus: string;
    isSenior: boolean;
    reputationScore: number;
    badges: string[];
    lastSeen: string;
    xp: number;
    streakDays: number;
    streakLastDate?: string;
    examMode: boolean;
    privacySettings: Record<string, any>;
    statusPrivacy: string;
}

export interface LocalStatusStory {
    id: string;
    userId: string;
    type: 'text' | 'image' | 'video';
    content?: string;
    mediaUrl?: string;
    mediaLocalId?: string;
    caption?: string;
    backgroundColor?: string;
    fontStyle?: string;
    viewCount: number;
    expiresAt: string;
    createdAt: string;
}

export interface LocalStatusView {
    id: string;
    statusId: string;
    userId: string;
    viewedAt: string;
}

export interface LocalBroadcastList {
    id: string;
    creatorId: string;
    name: string;
    memberCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface LocalBroadcastMember {
    id: string;
    listId: string;
    userId: string;
    joinedAt: string;
}

export interface LocalCommunity {
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    creatorId: string;
    announcementGroupId: string;
    memberCount: number;
    groupCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface LocalCommunityGroup {
    id: string;
    communityId: string;
    conversationId: string;
    addedAt: string;
}

export interface LocalCall {
    id: string;
    type: 'audio' | 'video';
    conversationId?: string;
    initiatorId: string;
    status: 'ringing' | 'active' | 'ended' | 'missed' | 'rejected' | 'busy';
    isGroup: boolean;
    startedAt: string;
    endedAt?: string;
}

export interface LocalCallParticipant {
    id: string;
    callId: string;
    userId: string;
    status: string;
    joinedAt?: string;
    leftAt?: string;
}

export interface LocalLinkedDevice {
    id: string;
    userId: string;
    deviceName: string;
    deviceType: string;
    lastActive: string;
    isTrusted: boolean;
    publicKey: string;
    createdAt: string;
}

export interface LocalStarredMessage {
    id: string;
    messageId: string;
    userId: string;
    createdAt: string;
}

export interface LocalNote {
    id: string;
    userId: string;
    campusId?: string;
    title: string;
    content?: string;
    subject?: string;
    semester?: number;
    tags: string[];
    type: 'note' | 'pyq' | 'summary' | 'recording';
    fileUrl?: string;
    fileLocalId?: string;
    fileSize?: number;
    fileMime?: string;
    aiSummary?: string;
    isShared: boolean;
    folderPath: string;
    syncStatus: 'synced' | 'pending' | 'failed';
    createdAt: string;
    updatedAt: string;
}

export interface LocalAssignment {
    id: string;
    userId: string;
    title: string;
    subject?: string;
    description?: string;
    dueDate?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    priority: 'low' | 'medium' | 'high' | 'critical';
    syncStatus: 'synced' | 'pending' | 'failed';
    createdAt: string;
}

export interface LocalExam {
    id: string;
    userId: string;
    campusId?: string;
    title: string;
    subject?: string;
    examDate: string;
    examType: 'internal' | 'external' | 'quiz' | 'viva';
    syllabus?: string;
    marksTotal?: number;
    marksObtained?: number;
    syncStatus: 'synced' | 'pending' | 'failed';
    createdAt: string;
}

export interface LocalMediaCache {
    id: string;
    messageId?: string;
    blob: Blob;
    mimeType: string;
    size: number;
    cachedAt: string;
}

export interface SyncQueueItem {
    id: string;
    operation: 'insert' | 'update' | 'delete';
    table: string;
    data: Record<string, unknown>;
    status: 'pending' | 'syncing' | 'synced' | 'failed';
    retryCount: number;
    maxRetries: number;
    nextRetryAt?: string;
    errorMessage?: string;
    createdAt: string;
}

export interface LocalNotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body?: string;
    data: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
}

export interface LocalXPEvent {
    id: string;
    userId: string;
    action: string;
    xpAmount: number;
    createdAt: string;
    synced: boolean;
}

export interface LocalPreference {
    key: string;
    value: string;
    updatedAt: string;
}

export interface LocalSetting {
    category: string;
    key: string;
    value: any;
    updatedAt: string;
    isSynced: boolean;
}

// ===== DATABASE CLASS =====

class CampuslyDB extends Dexie {
    messages!: Table<LocalMessage>;
    conversations!: Table<LocalConversation>;
    conversationMembers!: Table<LocalConversationMember>;
    profiles!: Table<LocalProfile>;
    notes!: Table<LocalNote>;
    assignments!: Table<LocalAssignment>;
    exams!: Table<LocalExam>;
    mediaCache!: Table<LocalMediaCache>;
    syncQueue!: Table<SyncQueueItem>;
    notifications!: Table<LocalNotification>;
    xpEvents!: Table<LocalXPEvent>;
    preferences!: Table<LocalPreference>;
    settings!: Table<LocalSetting>;
    groupInvites!: Table<LocalGroupInvite>;
    groupJoinRequests!: Table<LocalGroupJoinRequest>;
    pinnedMessages!: Table<LocalPinnedMessage>;
    reactionsTable!: Table<LocalReaction>;
    polls!: Table<LocalPoll>;
    pollVotes!: Table<LocalPollVote>;
    adminLogs!: Table<LocalAdminLog>;
    channelSettings!: Table<LocalChannelSetting>;
    statuses!: Table<LocalStatusStory>;
    statusViews!: Table<LocalStatusView>;
    broadcastLists!: Table<LocalBroadcastList>;
    broadcastMembers!: Table<LocalBroadcastMember>;
    communities!: Table<LocalCommunity>;
    communityGroups!: Table<LocalCommunityGroup>;
    callsTable!: Table<LocalCall>;
    callParticipants!: Table<LocalCallParticipant>;
    linkedDevices!: Table<LocalLinkedDevice>;
    starredMessages!: Table<LocalStarredMessage>;

    constructor() {
        super('CampuslyDB');

        // Version 1: Original schema
        this.version(1).stores({
            messages: 'id, conversationId, senderId, createdAt, syncStatus, [conversationId+createdAt]',
            conversations: 'id, type, updatedAt, lastMessageAt',
            conversationMembers: 'id, conversationId, userId, [conversationId+userId]',
            profiles: 'id, campusId',
            notes: 'id, userId, subject, semester, folderPath, syncStatus',
            assignments: 'id, userId, status, dueDate, syncStatus',
            exams: 'id, userId, examDate, syncStatus',
            mediaCache: 'id, messageId, cachedAt',
            syncQueue: 'id, status, table, createdAt',
            notifications: 'id, userId, isRead, createdAt',
        });

        // Version 2: Enhanced schema
        this.version(2).stores({
            messages: 'id, conversationId, senderId, createdAt, syncStatus, status, [conversationId+createdAt]',
            conversations: 'id, type, updatedAt, lastMessageAt',
            conversationMembers: 'id, conversationId, userId, [conversationId+userId]',
            profiles: 'id, campusId, examMode',
            notes: 'id, userId, subject, semester, folderPath, syncStatus, campusId',
            assignments: 'id, userId, status, dueDate, syncStatus, [userId+dueDate]',
            exams: 'id, userId, examDate, syncStatus, campusId, [campusId+examDate]',
            mediaCache: 'id, messageId, cachedAt',
            syncQueue: 'id, status, table, createdAt, nextRetryAt',
            notifications: 'id, userId, isRead, createdAt, [userId+isRead+createdAt]',
            xpEvents: 'id, userId, action, createdAt, synced',
            preferences: 'key, updatedAt',
            settings: '[category+key], category, key, updatedAt',
        });

        // Version 3: Telegram Expansion (Groups, Channels, Polls, Admin Logs)
        this.version(3).stores({
            messages: 'id, conversationId, senderId, createdAt, syncStatus, status, type, replyThreadId, forwardFromId, scheduledAt, [conversationId+createdAt]',
            conversations: 'id, type, updatedAt, lastMessageAt, isPublic, createdBy',
            conversationMembers: 'id, conversationId, userId, role, [conversationId+userId]',
            groupInvites: 'id, conversationId, code, createdBy, isRevoked',
            groupJoinRequests: 'id, conversationId, userId, status, requestedAt',
            pinnedMessages: 'id, conversationId, messageId, [conversationId+order]',
            reactionsTable: 'id, messageId, userId, emoji, [messageId+userId]',
            polls: 'id, conversationId, creatorId, createdAt',
            pollVotes: 'id, pollId, userId, [pollId+userId]',
            adminLogs: 'id, conversationId, adminId, action, createdAt',
            channelSettings: 'conversationId, updatedAt',
            profiles: 'id, campusId, examMode',
            notes: 'id, userId, subject, semester, folderPath, syncStatus, campusId',
            assignments: 'id, userId, status, dueDate, syncStatus, [userId+dueDate]',
            exams: 'id, userId, examDate, syncStatus, campusId, [campusId+examDate]',
            mediaCache: 'id, messageId, cachedAt',
            syncQueue: 'id, status, table, createdAt, nextRetryAt',
            notifications: 'id, userId, isRead, createdAt, [userId+isRead+createdAt]',
            xpEvents: 'id, userId, action, createdAt, synced',
            preferences: 'key, updatedAt',
            settings: '[category+key], category, key, updatedAt',
        });

        // Version 4: WhatsApp Expansion (Status, Broadcast, Community, Calls, Encryption)
        this.version(4).stores({
            messages: 'id, conversationId, senderId, createdAt, syncStatus, status, type, replyThreadId, expiresAt, encryptionType, [conversationId+createdAt]',
            conversations: 'id, type, updatedAt, lastMessageAt, isPublic, isArchived, communityId, [type+updatedAt]',
            conversationMembers: 'id, conversationId, userId, role, [conversationId+userId]',
            groupInvites: 'id, conversationId, code, createdBy',
            groupJoinRequests: 'id, conversationId, userId, status, requestedAt',
            pinnedMessages: 'id, conversationId, messageId, [conversationId+order]',
            reactionsTable: 'id, messageId, userId, emoji, [messageId+userId]',
            polls: 'id, conversationId, creatorId, createdAt',
            pollVotes: 'id, pollId, userId, [pollId+userId]',
            adminLogs: 'id, conversationId, adminId, action, createdAt',
            channelSettings: 'conversationId, updatedAt',
            statuses: 'id, userId, type, expiresAt, createdAt',
            statusViews: 'id, statusId, userId, viewedAt, [statusId+userId]',
            broadcastLists: 'id, creatorId, name, updatedAt',
            broadcastMembers: 'id, listId, userId, [listId+userId]',
            communities: 'id, creatorId, name, announcementGroupId',
            communityGroups: 'id, communityId, conversationId, [communityId+conversationId]',
            callsTable: 'id, initiatorId, status, startedAt',
            callParticipants: 'id, callId, userId, [callId+userId]',
            linkedDevices: 'id, userId, lastActive',
            starredMessages: 'id, messageId, userId, [messageId+userId]',
            profiles: 'id, campusId, examMode',
            notes: 'id, userId, subject, semester, folderPath, syncStatus, campusId',
            assignments: 'id, userId, status, dueDate, syncStatus, [userId+dueDate]',
            exams: 'id, userId, examDate, syncStatus, campusId, [campusId+examDate]',
            mediaCache: 'id, messageId, cachedAt',
            syncQueue: 'id, status, table, createdAt, nextRetryAt',
            notifications: 'id, userId, isRead, createdAt, [userId+isRead+createdAt]',
            xpEvents: 'id, userId, action, createdAt, synced',
            preferences: 'key, updatedAt',
            settings: '[category+key], category, key, updatedAt',
        });
    }
}

export const db = new CampuslyDB();

// ===== LRU CACHE MANAGEMENT =====

const MAX_CACHE_SIZE_MB = 100;

export async function enforceMediaCacheLimit(): Promise<void> {
    const allMedia = await db.mediaCache.orderBy('cachedAt').toArray();
    let totalSize = allMedia.reduce((sum, m) => sum + m.size, 0);
    const maxBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;

    while (totalSize > maxBytes && allMedia.length > 0) {
        const oldest = allMedia.shift();
        if (oldest) {
            await db.mediaCache.delete(oldest.id);
            totalSize -= oldest.size;
        }
    }
}

// ===== PREFERENCE HELPERS =====

export async function getPreference(key: string): Promise<string | undefined> {
    const pref = await db.preferences.get(key);
    return pref?.value;
}

export async function setPreference(key: string, value: string): Promise<void> {
    await db.preferences.put({ key, value, updatedAt: new Date().toISOString() });
}
