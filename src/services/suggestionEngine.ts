// ===================================================================
// Campusly v4.0 — User Suggestion Engine
// First-time onboarding: suggest classmates, admin, top contributors.
// ===================================================================

import { insforge } from '../lib/insforge';
import type { UserProfile } from '../types';
import type { UserSuggestion } from '../types/social';
import { ADMIN_USER_ID } from '../types/social';
import { RankingEngine } from './rankingService';

/**
 * Generate suggestions for a new user.
 * Algorithm:
 *  1. Same campus + branch + semester (highest priority)
 *  2. Same campus + same branch (different semester)
 *  3. Admin user
 *  4. Top contributors (highest XP)
 *  5. Recently active users
 */
export async function generateSuggestions(
    userId: string,
    profile: UserProfile,
    limit = 15
): Promise<UserSuggestion[]> {
    const suggestions: UserSuggestion[] = [];
    const seenIds = new Set<string>([userId]);

    // 1. Same campus + branch + semester
    if (profile.campus_id && profile.branch) {
        const { data: classmates } = await insforge.database
            .from('profiles')
            .select('*')
            .eq('campus_id', profile.campus_id)
            .eq('branch', profile.branch)
            .eq('semester', profile.semester || 1)
            .neq('id', userId)
            .limit(10);

        if (classmates) {
            for (const c of classmates) {
                if (!seenIds.has(c.id)) {
                    suggestions.push({ user: c as UserProfile, reason: 'same_semester', score: 100 });
                    seenIds.add(c.id);
                }
            }
        }
    }

    // 2. Same campus + branch (different semester)
    if (profile.campus_id && profile.branch) {
        const { data: branchmates } = await insforge.database
            .from('profiles')
            .select('*')
            .eq('campus_id', profile.campus_id)
            .eq('branch', profile.branch)
            .neq('semester', profile.semester || 0)
            .neq('id', userId)
            .limit(5);

        if (branchmates) {
            for (const b of branchmates) {
                if (!seenIds.has(b.id)) {
                    suggestions.push({ user: b as UserProfile, reason: 'same_branch', score: 80 });
                    seenIds.add(b.id);
                }
            }
        }
    }

    // 3. Always suggest Admin
    if (!seenIds.has(ADMIN_USER_ID)) {
        const { data: admin } = await insforge.database
            .from('profiles')
            .select('*')
            .eq('id', ADMIN_USER_ID)
            .maybeSingle();

        if (admin) {
            suggestions.push({ user: admin as UserProfile, reason: 'admin', score: 95 });
            seenIds.add(ADMIN_USER_ID);
        }
    }

    // 4. Top contributors (highest XP)
    const { data: topContributors } = await insforge.database
        .from('profiles')
        .select('*')
        .order('xp', { ascending: false })
        .limit(5);

    if (topContributors) {
        for (const t of topContributors) {
            if (!seenIds.has(t.id)) {
                suggestions.push({ user: t as UserProfile, reason: 'top_contributor', score: 70 });
                seenIds.add(t.id);
            }
        }
    }

    // 5. Recently active (same campus)
    if (profile.campus_id) {
        const { data: active } = await insforge.database
            .from('profiles')
            .select('*')
            .eq('campus_id', profile.campus_id)
            .order('last_seen', { ascending: false })
            .limit(20);

        if (active) {
            for (const a of active) {
                if (!seenIds.has(a.id)) {
                    suggestions.push({
                        user: a as UserProfile,
                        reason: 'active_user',
                        score: 0 // Will be recalculated by engine
                    });
                    seenIds.add(a.id);
                }
            }
        }
    }

    const profilesToRank = suggestions.map(s => s.user);
    const rankedProfiles = RankingEngine.rankFriendSuggestions(profilesToRank, profile);

    // Re-map back to UserSuggestion format
    const finalSuggestions: UserSuggestion[] = rankedProfiles.map((rp: any) => ({
        user: rp.profile,
        score: rp.score,
        reason: (suggestions.find(s => s.user.id === rp.profile.id)?.reason || 'peer') as any
    }));

    // Filter already actioned suggestions
    const { data: actioned } = await insforge.database
        .from('user_suggestion_actions')
        .select('suggested_user_id')
        .eq('user_id', userId);

    const actionedIds = new Set((actioned || []).map((a: any) => a.suggested_user_id));

    return finalSuggestions
        .filter(s => !actionedIds.has(s.user.id))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Record a user's action on a suggestion.
 */
export async function recordSuggestionAction(
    userId: string,
    suggestedUserId: string,
    action: 'dismissed' | 'connected' | 'followed'
): Promise<void> {
    const { data: existing } = await insforge.database
        .from('user_suggestion_actions')
        .select('id')
        .eq('user_id', userId)
        .eq('suggested_user_id', suggestedUserId)
        .maybeSingle();

    if (existing) {
        await insforge.database
            .from('user_suggestion_actions')
            .update({ action })
            .eq('id', existing.id);
    } else {
        await insforge.database.from('user_suggestion_actions').insert({
            user_id: userId,
            suggested_user_id: suggestedUserId,
            action,
        });
    }
}

/**
 * Mark onboarding as completed.
 */
export async function completeOnboarding(userId: string): Promise<void> {
    await insforge.database
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId);
}
