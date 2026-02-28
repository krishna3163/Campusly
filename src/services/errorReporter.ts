// ===================================================================
// Campusly v4.0 — Global Error Boundary & Auto-Reporter
// Catches unhandled errors, stores locally, reports to backend.
// ===================================================================

import { insforge } from '../lib/insforge';
import { captureDeviceInfo } from './bugReportService';

let lastAction = '';

/**
 * Track the last user action for error context.
 */
export function setLastAction(action: string) {
    lastAction = action;
}

/**
 * Report an error to the backend (silent, non-blocking).
 */
async function reportError(
    errorMessage: string,
    stackTrace: string,
    userId?: string
) {
    try {
        await insforge.database.from('error_logs').insert({
            user_id: userId || null,
            error_message: errorMessage,
            stack_trace: stackTrace,
            device_info: captureDeviceInfo(),
            last_action: lastAction,
            url: window.location.href,
        });
    } catch {
        // Store locally if offline
        try {
            const errors = JSON.parse(localStorage.getItem('campusly_error_queue') || '[]');
            errors.push({
                error_message: errorMessage,
                stack_trace: stackTrace,
                device_info: captureDeviceInfo(),
                last_action: lastAction,
                url: window.location.href,
                timestamp: new Date().toISOString(),
            });
            // Keep only last 50 errors locally
            localStorage.setItem('campusly_error_queue', JSON.stringify(errors.slice(-50)));
        } catch { }
    }
}

/**
 * Flush locally queued errors to backend (called when online).
 */
export async function flushErrorQueue(userId?: string) {
    try {
        const raw = localStorage.getItem('campusly_error_queue');
        if (!raw) return;
        const errors = JSON.parse(raw);
        if (!errors.length) return;

        for (const err of errors) {
            await insforge.database.from('error_logs').insert({
                user_id: userId || null,
                ...err,
            });
        }

        localStorage.removeItem('campusly_error_queue');
    } catch { }
}

/**
 * Initialize global error handlers. Call once at app startup.
 */
export function initErrorReporting(getUserId?: () => string | undefined) {
    // Unhandled JS errors
    window.addEventListener('error', (event) => {
        reportError(
            event.message || 'Unknown error',
            event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
            getUserId?.()
        );
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        reportError(
            reason?.message || String(reason) || 'Unhandled Promise Rejection',
            reason?.stack || '',
            getUserId?.()
        );
    });

    // Flush queued errors when back online
    window.addEventListener('online', () => {
        flushErrorQueue(getUserId?.());
    });

    // Flush on startup if online
    if (navigator.onLine) {
        setTimeout(() => flushErrorQueue(getUserId?.()), 5000);
    }
}
