// ===================================================================
// Campusly v4.0 — Bug Report Service
// Submit, track, and manage bug reports with admin notifications.
// ===================================================================

import { insforge } from '../lib/insforge';
import type { BugReport, DeviceInfo } from '../types/social';
import { ADMIN_USER_ID, APP_VERSION } from '../types/social';

/**
 * Capture device info automatically.
 */
export function captureDeviceInfo(): DeviceInfo {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        online: navigator.onLine,
        cookiesEnabled: navigator.cookieEnabled,
        memoryGB: (navigator as any).deviceMemory,
    };
}

/**
 * Submit a bug report.
 */
export async function submitBugReport(
    userId: string,
    data: {
        title: string;
        description?: string;
        steps?: string;
        screenshotFile?: File;
    }
): Promise<BugReport | null> {
    let screenshotUrl: string | undefined;

    // Upload screenshot if provided
    if (data.screenshotFile) {
        const path = `bug-reports/${userId}/${Date.now()}.webp`;
        const { data: uploadData, error: uploadError } = await insforge.storage
            .from('media')
            .upload(path, data.screenshotFile, { upsert: true });

        if (!uploadError && uploadData) {
            const { data: urlData } = insforge.storage.from('media').getPublicUrl(uploadData.path);
            screenshotUrl = urlData.publicUrl;
        }
    }

    const { data: report, error } = await insforge.database
        .from('bug_reports')
        .insert({
            user_id: userId,
            title: data.title,
            description: data.description,
            steps: data.steps,
            screenshot_url: screenshotUrl,
            device_info: captureDeviceInfo(),
            app_version: APP_VERSION,
            status: 'open',
        })
        .select()
        .single();

    if (error || !report) {
        console.error('Failed to submit bug report:', error);
        return null;
    }

    // Notify admin
    await insforge.database.from('notifications').insert({
        user_id: ADMIN_USER_ID,
        type: 'bug_report',
        title: `🐛 New Bug Report: ${data.title}`,
        body: data.description?.substring(0, 200),
        data: { bug_report_id: report.id, reporter_id: userId },
        is_read: false,
    });

    return report as BugReport;
}

/**
 * Get user's bug reports.
 */
export async function getUserBugReports(userId: string): Promise<BugReport[]> {
    const { data } = await insforge.database
        .from('bug_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return (data as BugReport[]) || [];
}

/**
 * Get all bug reports (admin only).
 */
export async function getAllBugReports(): Promise<BugReport[]> {
    const { data } = await insforge.database
        .from('bug_reports')
        .select('*, user:profiles(display_name, avatar_url, email)')
        .order('created_at', { ascending: false });

    return (data as BugReport[]) || [];
}

/**
 * Admin respond to bug report.
 */
export async function respondToBugReport(
    reportId: string,
    adminId: string,
    response: string,
    newStatus: 'reviewing' | 'resolved' | 'closed'
): Promise<boolean> {
    const { error } = await insforge.database
        .from('bug_reports')
        .update({
            admin_response: response,
            responded_by: adminId,
            responded_at: new Date().toISOString(),
            status: newStatus,
        })
        .eq('id', reportId);

    if (!error) {
        // Get the report to notify the user
        const { data: report } = await insforge.database
            .from('bug_reports')
            .select('user_id, title')
            .eq('id', reportId)
            .single();

        if (report) {
            await insforge.database.from('notifications').insert({
                user_id: report.user_id,
                type: 'bug_report_update',
                title: `🔔 Bug Report Updated: ${report.title}`,
                body: `Status changed to ${newStatus}. Admin response: ${response.substring(0, 100)}`,
                data: { bug_report_id: reportId },
                is_read: false,
            });
        }
    }

    return !error;
}
