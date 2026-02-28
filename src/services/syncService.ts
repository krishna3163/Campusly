/**
 * SyncService — Offline-first sync engine with exponential backoff
 * Manages outgoing message queue, retry logic, and conflict resolution
 */

import { db, type SyncQueueItem } from '../lib/db';
import { insforge } from '../lib/insforge';

type SyncListener = (status: SyncServiceStatus) => void;

export interface SyncServiceStatus {
    isOnline: boolean;
    pendingCount: number;
    failedCount: number;
    isSyncing: boolean;
    lastSyncAt?: string;
}

class SyncService {
    private listeners: Set<SyncListener> = new Set();
    private syncing = false;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private online = navigator.onLine;

    constructor() {
        window.addEventListener('online', () => {
            this.online = true;
            this.notifyListeners();
            this.processQueue();
        });
        window.addEventListener('offline', () => {
            this.online = false;
            this.notifyListeners();
        });
    }

    // === PUBLIC API ===

    start(intervalMs = 5000): void {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => {
            if (this.online && !this.syncing) this.processQueue();
        }, intervalMs);
        // Immediate first sync
        if (this.online) this.processQueue();
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    subscribe(listener: SyncListener): () => void {
        this.listeners.add(listener);
        this.getStatus().then(listener);
        return () => this.listeners.delete(listener);
    }

    async enqueue(operation: SyncQueueItem['operation'], table: string, data: Record<string, unknown>): Promise<void> {
        const item: SyncQueueItem = {
            id: crypto.randomUUID(),
            operation,
            table,
            data,
            status: 'pending',
            retryCount: 0,
            maxRetries: 5,
            createdAt: new Date().toISOString(),
        };
        await db.syncQueue.add(item);
        this.notifyListeners();

        if (this.online && !this.syncing) {
            this.processQueue();
        }
    }

    async retryFailed(): Promise<void> {
        await db.syncQueue
            .where('status')
            .equals('failed')
            .modify({ status: 'pending', retryCount: 0, nextRetryAt: undefined, errorMessage: undefined });
        this.notifyListeners();
        if (this.online) this.processQueue();
    }

    async getStatus(): Promise<SyncServiceStatus> {
        const pending = await db.syncQueue.where('status').anyOf(['pending', 'syncing']).count();
        const failed = await db.syncQueue.where('status').equals('failed').count();
        return {
            isOnline: this.online,
            pendingCount: pending,
            failedCount: failed,
            isSyncing: this.syncing,
            lastSyncAt: undefined,
        };
    }

    // === PRIVATE ===

    private async processQueue(): Promise<void> {
        if (this.syncing || !this.online) return;
        this.syncing = true;
        this.notifyListeners();

        try {
            const now = new Date().toISOString();
            const items = await db.syncQueue
                .where('status')
                .equals('pending')
                .filter(item => !item.nextRetryAt || item.nextRetryAt <= now)
                .sortBy('createdAt');

            for (const item of items) {
                await this.processSingleItem(item);
            }
        } catch (err) {
            console.error('[SyncService] Queue processing error:', err);
        } finally {
            this.syncing = false;
            this.notifyListeners();
        }
    }

    private async processSingleItem(item: SyncQueueItem): Promise<void> {
        try {
            await db.syncQueue.update(item.id, { status: 'syncing' });

            switch (item.operation) {
                case 'insert':
                    await insforge.database.from(item.table).insert(item.data);
                    break;
                case 'update': {
                    const { id, ...rest } = item.data;
                    await insforge.database.from(item.table).update(rest).eq('id', id as string);
                    break;
                }
                case 'delete':
                    await insforge.database.from(item.table).delete().eq('id', item.data.id as string);
                    break;
            }

            // Success — remove from queue
            await db.syncQueue.delete(item.id);

            // Update local record sync status if applicable
            if (item.data.id) {
                const localTable = db.table(item.table);
                if (localTable) {
                    try {
                        await localTable.update(item.data.id as string, { syncStatus: 'synced' });
                    } catch {
                        // Table might not have syncStatus column
                    }
                }
            }
        } catch (err) {
            const newRetryCount = item.retryCount + 1;
            if (newRetryCount >= item.maxRetries) {
                await db.syncQueue.update(item.id, {
                    status: 'failed',
                    retryCount: newRetryCount,
                    errorMessage: err instanceof Error ? err.message : 'Unknown error',
                });
            } else {
                // Exponential backoff: 2^retry * 1000ms (1s, 2s, 4s, 8s, 16s)
                const backoffMs = Math.pow(2, newRetryCount) * 1000;
                const nextRetry = new Date(Date.now() + backoffMs).toISOString();
                await db.syncQueue.update(item.id, {
                    status: 'pending',
                    retryCount: newRetryCount,
                    nextRetryAt: nextRetry,
                    errorMessage: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }
    }

    private async notifyListeners(): Promise<void> {
        const status = await this.getStatus();
        this.listeners.forEach(l => l(status));
    }
}

export const syncService = new SyncService();
