import { Post, UserProfile, Assignment, Exam, Conversation, InterviewExperience } from '../types';

// ====================================================================
// CAMPUSLY v4.0 — ADAPTIVE RANKING ENGINE
// "Intelligence that feels like magic."
// ====================================================================

export interface RankingContext {
    examMode: boolean;
    placementMode: boolean;
    location?: { lat: number; lng: number };
}

export class RankingEngine {
    // Weights are configurable for A/B testing
    private static WEIGHTS = {
        relevance: 0.25,
        relationship: 0.15,
        engagement: 0.20,
        urgency: 0.15,
        trust: 0.15,
        freshness: 0.10
    };

    /**
     * SECTION 2: FEED RANKING
     */
    static rankPosts(posts: Post[], user: UserProfile, context: RankingContext): Post[] {
        return posts
            .map(post => {
                const score = this.calculatePostScore(post, user, context);
                return { ...post, rankingScore: score };
            })
            .sort((a: any, b: any) => b.rankingScore - a.rankingScore);
    }

    private static calculatePostScore(post: Post, user: UserProfile, context: RankingContext): number {
        let rs = 0; // Relevance
        let rls = 0; // Relationship
        let ems = 0; // Engagement
        let us = 0; // Urgency
        let ts = 0; // Trust
        let fr = 0; // Freshness

        // 1. Relevance Score
        if (post.campus_id === user.campus_id) rs += 40;
        if (post.author?.branch === user.branch) rs += 30;
        if (post.author?.semester === user.semester) rs += 25;
        // Check interests
        const commonInterests = post.content.toLowerCase().split(' ').filter(word =>
            user.interests.map(i => i.toLowerCase()).includes(word)
        );
        rs += commonInterests.length * 10;

        // 2. Relationship Score (Simplified for demo)
        if (post.author_id === user.id) rls += 50;
        // In real app, we would check follow status/friend status

        // 3. Engagement Momentum
        const rawEngagement = (post.upvotes * 3) + (post.comment_count * 5);
        const hoursSince = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
        ems = rawEngagement * Math.exp(-0.1 * hoursSince);

        // 4. Urgency Score (Category matches)
        if (post.category === 'announcement' || post.category === 'question') us += 50;
        if (context.examMode && post.category === 'question') us += 150;

        // 5. Trust Score
        ts = (post.author?.reputation_score || 0) * 0.5 + (post.author?.college_verified ? 50 : 0);

        // 6. Freshness
        fr = Math.max(0, 100 - (hoursSince * 2));

        // Mode Multipliers
        let final = (rs * this.WEIGHTS.relevance) +
            (rls * this.WEIGHTS.relationship) +
            (ems * this.WEIGHTS.engagement) +
            (us * this.WEIGHTS.urgency) +
            (ts * this.WEIGHTS.trust) +
            (fr * this.WEIGHTS.freshness);

        if (context.examMode) {
            if (post.category === 'confession' || post.category === 'marketplace') final *= 0.2;
            if (post.category === 'question' || post.category === 'announcement') final *= 2.0;
        }

        return final;
    }

    /**
     * SECTION 3: FRIEND SUGGESTIONS
     */
    static rankFriendSuggestions(profiles: UserProfile[], user: UserProfile): any[] {
        return profiles
            .map(p => {
                let score = 0;
                if (p.campus_id === user.campus_id) score += 50;
                if (p.branch === user.branch) score += 40;
                if (p.semester === user.semester) score += 35;

                // Similar interests
                const mutualInterests = p.interests.filter(i => user.interests.includes(i));
                score += mutualInterests.length * 15;

                // XP/Reputation boost
                score += Math.min(20, p.xp / 1000);

                return { profile: p, score };
            })
            .sort((a, b) => b.score - a.score);
    }

    /**
     * SECTION 4: STUDY CONTENT PRIORITIZATION
     */
    static rankStudyItems(assignments: Assignment[], exams: Exam[]): (Assignment | Exam)[] {
        const items = [...assignments, ...exams];
        return items
            .map(item => {
                let score = 0;
                const dueDate = 'due_date' in item ? (item as Assignment).due_date : (item as Exam).exam_date;
                if (dueDate) {
                    const hoursToDeadline = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60);

                    // Deadline Proximity (40%)
                    if (hoursToDeadline > 0) {
                        score += Math.max(0, (1 - (hoursToDeadline / 168))) * 100 * 0.4; // 1 week window
                    } else {
                        score += 100 * 0.4; // Past due/Immediate
                    }
                }

                // Completion/Importance (30%)
                if ('status' in item && item.status !== 'completed') score += 30;
                if ('priority' in item && (item.priority === 'high' || item.priority === 'critical')) score += 20;

                return { ...item, studyScore: score };
            })
            .sort((a: any, b: any) => b.studyScore - a.studyScore);
    }

    /**
     * SECTION 5: PLACEMENT RECOMMENDATION
     */
    static rankInterviews(experiences: InterviewExperience[], user: UserProfile): InterviewExperience[] {
        return experiences
            .map(exp => {
                let score = 0;
                if (exp.branch === user.branch) score += 40;

                // Interest match
                if (user.interests.some(i => exp.company.toLowerCase().includes(i.toLowerCase()))) score += 30;

                // Recency
                const hoursSince = (Date.now() - new Date(exp.created_at).getTime()) / (1000 * 60 * 60);
                score += Math.max(0, 30 - (hoursSince / 24));

                return { ...exp, placementScore: score };
            })
            .sort((a: any, b: any) => b.placementScore - a.placementScore);
    }

    /**
     * SECTION 6: GROUP PRIORITY
     */
    static rankGroups(groups: Conversation[]): Conversation[] {
        return groups
            .map(group => {
                let score = (group.unread_count || 0) * 5;

                if (group.type === 'subject_channel') score += 20;
                if (group.is_important) score += 30; // Assuming boolean field

                // Interaction frequency (proxy using updated_at)
                const hoursSinceUpdate = (Date.now() - new Date(group.updated_at).getTime()) / (1000 * 60 * 60);
                score += Math.max(0, 20 - (hoursSinceUpdate / 2));

                return { ...group, groupScore: score };
            })
            .sort((a: any, b: any) => b.groupScore - a.groupScore);
    }

    /**
     * SECTION 8: TRENDING ENGINE
     */
    static getTrending(posts: Post[]): string[] {
        const keywords: Record<string, number> = {};
        const stopWords = new Set(['the', 'is', 'and', 'my', 'in', 'of', 'for', 'we', 'at', 'on']);

        posts.slice(0, 100).forEach(post => {
            const words = post.content.toLowerCase().split(/\W+/);
            words.forEach(word => {
                if (word.length > 3 && !stopWords.has(word)) {
                    keywords[word] = (keywords[word] || 0) + 1 + (post.upvotes * 0.5);
                }
            });
        });

        return Object.entries(keywords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(e => e[0]);
    }
}
