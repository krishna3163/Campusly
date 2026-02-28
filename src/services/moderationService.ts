/**
 * ModerationService — Content moderation, profanity detection, rate limiting
 */

import { insforge } from '../lib/insforge';

// Profanity word list (expandable)
const PROFANITY_LIST = [
    'badword1', 'badword2', // placeholder — replace with actual list
];

// Build regex from word list
const profanityRegex = new RegExp(
    `\\b(${PROFANITY_LIST.join('|')})\\b`,
    'gi'
);

class ModerationService {
    private postTimestamps: Map<string, number[]> = new Map();

    // === PROFANITY DETECTION ===

    containsProfanity(text: string): boolean {
        return profanityRegex.test(text);
    }

    censorText(text: string): string {
        return text.replace(profanityRegex, (match) => '*'.repeat(match.length));
    }

    // === RATE LIMITING ===

    /**
     * Check if anonymous post is within rate limit (5 per hour)
     */
    canPostAnonymous(userId: string): boolean {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const timestamps = this.postTimestamps.get(userId) || [];

        // Clean old timestamps
        const recent = timestamps.filter(t => t > oneHourAgo);
        this.postTimestamps.set(userId, recent);

        return recent.length < 5;
    }

    recordAnonymousPost(userId: string): void {
        const timestamps = this.postTimestamps.get(userId) || [];
        timestamps.push(Date.now());
        this.postTimestamps.set(userId, timestamps);
    }

    // === REPORTING ===

    async reportContent(
        reporterId: string,
        contentType: 'post' | 'comment' | 'message' | 'profile',
        contentId: string,
        reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other',
        description?: string
    ): Promise<boolean> {
        try {
            await insforge.database.from('reports').insert({
                reporter_id: reporterId,
                content_type: contentType,
                content_id: contentId,
                reason,
                description,
                status: 'pending',
            });

            // Check if auto-hide threshold reached
            const { data: reportCount } = await insforge.database
                .from('reports')
                .select('id')
                .eq('content_id', contentId)
                .eq('content_type', contentType);

            if (reportCount && reportCount.length >= 5) {
                await this.autoHideContent(contentType, contentId);
            }

            return true;
        } catch (err) {
            console.error('[Moderation] Report failed:', err);
            return false;
        }
    }

    // === AUTO-HIDE ===

    private async autoHideContent(
        contentType: 'post' | 'comment' | 'message' | 'profile',
        contentId: string
    ): Promise<void> {
        try {
            if (contentType === 'post') {
                await insforge.database
                    .from('posts')
                    .update({ is_hidden: true })
                    .eq('id', contentId);
            }

            // Flag the content
            await insforge.database.from('content_flags').insert({
                content_type: contentType,
                content_id: contentId,
                flag_type: 'auto_hidden',
                details: 'Report threshold (5) reached',
            });
        } catch (err) {
            console.error('[Moderation] Auto-hide failed:', err);
        }
    }

    // === MODERATOR ACTIONS ===

    async checkUserRole(userId: string, campusId: string): Promise<string | null> {
        try {
            const { data } = await insforge.database
                .from('campus_roles')
                .select('role')
                .eq('user_id', userId)
                .eq('campus_id', campusId)
                .single();

            return data ? (data as { role: string }).role : null;
        } catch {
            return null;
        }
    }

    async reviewReport(
        reportId: string,
        reviewerId: string,
        action: 'dismissed' | 'actioned'
    ): Promise<boolean> {
        try {
            await insforge.database
                .from('reports')
                .update({ status: action, reviewed_by: reviewerId })
                .eq('id', reportId);
            return true;
        } catch (err) {
            console.error('[Moderation] Review failed:', err);
            return false;
        }
    }
}

export const moderationService = new ModerationService();
