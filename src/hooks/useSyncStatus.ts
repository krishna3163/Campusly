/**
 * useSyncStatus — Hook to monitor offline sync engine status
 */

import { useState, useEffect } from 'react';
import { syncService, type SyncServiceStatus } from '../services/syncService';

export function useSyncStatus(): SyncServiceStatus {
    const [status, setStatus] = useState<SyncServiceStatus>({
        isOnline: navigator.onLine,
        pendingCount: 0,
        failedCount: 0,
        isSyncing: false,
    });

    useEffect(() => {
        const unsubscribe = syncService.subscribe(setStatus);
        return unsubscribe;
    }, []);

    return status;
}
