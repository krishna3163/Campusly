/**
 * SyncStatusBadge — Shows offline/syncing/failed indicator
 */

import { useSyncStatus } from '../../hooks/useSyncStatus';
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { syncService } from '../../services/syncService';

export default function SyncStatusBadge() {
    const status = useSyncStatus();

    if (status.isOnline && status.pendingCount === 0 && status.failedCount === 0) {
        return null; // All synced, hide badge
    }

    return (
        <div className="flex items-center gap-1.5">
            {!status.isOnline ? (
                <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 rounded-lg px-2 py-1">
                    <CloudOff size={12} className="text-amber-400" />
                    <span className="text-[10px] font-semibold text-amber-400">Offline</span>
                </div>
            ) : status.isSyncing ? (
                <div className="flex items-center gap-1 bg-brand-500/15 border border-brand-500/30 rounded-lg px-2 py-1">
                    <RefreshCw size={12} className="text-brand-400 animate-spin" />
                    <span className="text-[10px] font-semibold text-brand-400">Syncing {status.pendingCount}</span>
                </div>
            ) : status.failedCount > 0 ? (
                <button
                    onClick={() => syncService.retryFailed()}
                    className="flex items-center gap-1 bg-red-500/15 border border-red-500/30 rounded-lg px-2 py-1 hover:bg-red-500/25 transition-colors"
                >
                    <AlertTriangle size={12} className="text-red-400" />
                    <span className="text-[10px] font-semibold text-red-400">{status.failedCount} failed</span>
                </button>
            ) : status.pendingCount > 0 ? (
                <div className="flex items-center gap-1 bg-campus-card border border-campus-border/50 rounded-lg px-2 py-1">
                    <Cloud size={12} className="text-campus-muted" />
                    <span className="text-[10px] font-semibold text-campus-muted">{status.pendingCount} pending</span>
                </div>
            ) : null}
        </div>
    );
}
