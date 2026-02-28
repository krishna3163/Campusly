/**
 * GamificationService — XP, streaks, badges, and leaderboard
 */

import { insforge } from '../lib/insforge';
import { db } from '../lib/db';

const XP_VALUES: Record<string, number> = {
    message_sent: 1,
    note_shared: 10,
    doubt_answered: 15,
    post_created: 5,
    daily_login: 3,
    streak_bonus: 5,     // per day of streak
    referral: 25,
};

const BADGES: Record<string, { name: string; description: string; condition: (xp: number, extras?: Record<string, number>) => boolean }> = {
    campus_pioneer: {
        name: '🏕️ Campus Pioneer',
        description: 'Invited 5 classmates who joined',
        condition: (_, extras) => (extras?.referrals ?? 0) >= 5,
    },
    streak_7: {
        name: '🔥 Week Warrior',
        description: '7-day study streak',
        condition: (_, extras) => (extras?.streak ?? 0) >= 7,
    },
    streak_30: {
        name: '⚡ Monthly Legend',
        description: '30-day study streak',
        condition: (_, extras) => (extras?.streak ?? 0) >= 30,
    },
    helper_100: {
        name: '🎓 Senior Mentor',
        description: 'Answered 100 doubts',
        condition: (_, extras) => (extras?.doubts_answered ?? 0) >= 100,
    },
    xp_1000: {
        name: '🌟 Rising Star',
        description: 'Earned 1000 XP',
        condition: (xp) => xp >= 1000,
    },
    xp_5000: {
        name: '💎 Campus Legend',
        description: 'Earned 5000 XP',
        condition: (xp) => xp >= 5000,
    },
    top_contributor: {
        name: '🏆 Top Contributor',
        description: 'Reached #1 on leaderboard',
        condition: (_, extras) => (extras?.rank ?? 999) === 1,
    },
};

class GamificationService {
    // === XP ===

    async awardXP(userId: string, action: keyof typeof XP_VALUES): Promise<number> {
        const amount = XP_VALUES[action] || 0;
        if (amount === 0) return 0;

        // Save locally
        await db.xpEvents.add({
            id: crypto.randomUUID(),
            userId,
            action,
            xpAmount: amount,
            createdAt: new Date().toISOString(),
            synced: false,
        });

        // Update local profile XP
        const profile = await db.profiles.get(userId);
        if (profile) {
            await db.profiles.update(userId, {
                xp: (profile.xp || 0) + amount,
            });
        }

        // Sync to cloud (fire and forget)
        try {
            await insforge.database.from('xp_events').insert({
                user_id: userId,
                action,
                xp_amount: amount,
            });

            // Update remote profile XP
            await insforge.database
                .from('profiles')
                .update({ xp: (profile?.xp || 0) + amount })
                .eq('id', userId);
        } catch {
            // Will be synced later by syncService
        }

        return amount;
    }

    // === STREAKS ===

    async checkAndUpdateStreak(userId: string): Promise<{ days: number; isNew: boolean }> {
        const profile = await db.profiles.get(userId);
        if (!profile) return { days: 0, isNew: false };

        const today = new Date().toISOString().split('T')[0];
        const lastDate = profile.streakLastDate;

        if (lastDate === today) {
            return { days: profile.streakDays, isNew: false };
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let newStreak: number;

        if (lastDate === yesterday) {
            newStreak = (profile.streakDays || 0) + 1;
        } else {
            newStreak = 1; // Streak broken, start fresh
        }

        await db.profiles.update(userId, {
            streakDays: newStreak,
            streakLastDate: today,
        });

        // Award streak bonus
        if (newStreak > 1) {
            await this.awardXP(userId, 'streak_bonus');
        }
        await this.awardXP(userId, 'daily_login');

        // Sync to cloud
        try {
            await insforge.database
                .from('profiles')
                .update({
                    streak_days: newStreak,
                    streak_last_date: today,
                })
                .eq('id', userId);
        } catch {
            // Will sync later
        }

        return { days: newStreak, isNew: true };
    }

    // === BADGES ===

    async checkBadges(userId: string): Promise<string[]> {
        const profile = await db.profiles.get(userId);
        if (!profile) return [];

        const currentBadges = profile.badges || [];
        const newBadges: string[] = [];

        // Gather extras for badge conditions
        const extras: Record<string, number> = {
            streak: profile.streakDays || 0,
        };

        for (const [key, badge] of Object.entries(BADGES)) {
            if (!currentBadges.includes(key) && badge.condition(profile.xp || 0, extras)) {
                newBadges.push(key);
            }
        }

        if (newBadges.length > 0) {
            const allBadges = [...currentBadges, ...newBadges];
            await db.profiles.update(userId, { badges: allBadges });

            try {
                await insforge.database
                    .from('profiles')
                    .update({ badges: allBadges })
                    .eq('id', userId);
            } catch {
                // Will sync later
            }
        }

        return newBadges;
    }

    // === LEADERBOARD ===

    async getLeaderboard(campusId: string, limit = 20): Promise<Array<{
        user_id: string;
        display_name: string;
        avatar_url?: string;
        branch?: string;
        xp: number;
        rank: number;
    }>> {
        try {
            const { data } = await insforge.database
                .from('profiles')
                .select('id, display_name, avatar_url, branch, xp')
                .eq('campus_id', campusId)
                .order('xp', { ascending: false })
                .limit(limit);

            if (!data) return [];

            return (data as Array<Record<string, unknown>>).map((entry, index) => ({
                user_id: entry.id as string,
                display_name: entry.display_name as string,
                avatar_url: entry.avatar_url as string | undefined,
                branch: entry.branch as string | undefined,
                xp: (entry.xp as number) || 0,
                rank: index + 1,
            }));
        } catch {
            return [];
        }
    }

    // === REFERRALS ===

    generateReferralCode(userId: string): string {
        const hash = userId.substring(0, 6).toUpperCase();
        return `CAMP-${hash}`;
    }

    async trackReferral(inviterId: string, invitedUserId: string, campusId: string): Promise<void> {
        try {
            await insforge.database.from('referrals').insert({
                inviter_id: inviterId,
                invited_user_id: invitedUserId,
                campus_id: campusId,
            });
            await this.awardXP(inviterId, 'referral');
        } catch (err) {
            console.error('[Gamification] Referral tracking failed:', err);
        }
    }

    getBadgeInfo(badgeKey: string): { name: string; description: string } | undefined {
        return BADGES[badgeKey];
    }

    getAllBadges(): Record<string, { name: string; description: string }> {
        const result: Record<string, { name: string; description: string }> = {};
        for (const [key, badge] of Object.entries(BADGES)) {
            result[key] = { name: badge.name, description: badge.description };
        }
        return result;
    }
}

export const gamificationService = new GamificationService();
