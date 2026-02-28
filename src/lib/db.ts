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
    pollData?: Record<string, unknown>;
    reactions: Record<string, string[]>;
    metadata: Record<string, unknown>;
    syncStatus: 'synced' | 'pending' | 'failed';
    createdAt: string;
    updatedAt: string;
}

export interface LocalConversation {
    id: string;
    type: 'direct' | 'group' | 'broadcast' | 'subject_channel';
    name?: string;
    description?: string;
    avatarUrl?: string;
    subject?: string;
    semester?: number;
    createdBy?: string;
    isExamMode: boolean;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface LocalConversationMember {
    id: string;
    conversationId: string;
    userId: string;
    role: 'admin' | 'moderator' | 'member';
    muted: boolean;
    joinedAt: string;
    lastReadAt: string;
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

        // Version 2: Enhanced schema with new tables and indexes
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
