/**
 * Campus Feed Seeding Service
 * Generates realistic fake posts for campus feed (100+ per campus).
 * Run via admin or one-time migration.
 * Categories: Study, Hostel, Events, Meme, Lost & Found, Placement, Internship, Faculty
 */

import { insforge } from '../lib/insforge';

const CATEGORIES = ['general', 'hostel', 'event', 'question', 'lost_found', 'marketplace', 'announcement'] as const;
const STUDY_LINES = ['Anyone have notes for DS midterm?', 'Best resources for DBMS?', 'PYQ ka answer key milega?', 'Group study tomorrow 4pm library?'];
const HOSTEL_LINES = ['Mess food today was something else 😭', 'Power cut at 2am vibes', 'Who wants to order from outside?', 'Quiet hours please 🛑'];
const EVENT_LINES = ['Tech fest registration is open!', 'Cultural night this Saturday', 'Hackathon registrations closing soon', 'Sports day next week'];
const MEME_LINES = ['When prof says open book but...', 'That moment before results', 'Semester end mood', 'Placement season in a nutshell'];
const LOST_LINES = ['Lost keys near block A', 'Found a wallet near canteen', 'Anyone saw a blue bag?', 'Lost calculator in lab 3'];
const INTERNSHIP_LINES = ['Summer intern hunt 2026', 'Referral for company Y?', 'Internship vs placement prep', 'Remote internship experiences?'];
const FACULTY_LINES = ['Sir ne assignment extend kiya', 'Best faculty for ML?', 'Office hours kab hain?', 'Attendance leniency?'];

function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

function generatePost(campusId: string, authorId: string, category: (typeof CATEGORIES)[number]): Record<string, unknown> {
    const isAnonymous = Math.random() > 0.6;
    let content = '';
    switch (category) {
        case 'general': content = pick(STUDY_LINES); break;
        case 'hostel': content = pick(HOSTEL_LINES); break;
        case 'event': content = pick(EVENT_LINES); break;
        case 'question': content = pick(STUDY_LINES); break;
        case 'lost_found': content = pick(LOST_LINES); break;
        case 'marketplace': content = pick(INTERNSHIP_LINES); break;
        case 'announcement': content = pick(FACULTY_LINES); break;
        default: content = pick(STUDY_LINES);
    }
    if (Math.random() > 0.7) content = pick(MEME_LINES);
    return {
        author_id: authorId,
        campus_id: campusId,
        category,
        content,
        media_urls: [],
        is_anonymous: isAnonymous,
        is_pinned: false,
        is_hidden: false,
        upvotes: randInt(2, 50),
        downvotes: randInt(0, 5),
        comment_count: randInt(2, 5),
        report_count: 0,
        created_at: daysAgo(randInt(0, 30)),
    };
}

export async function seedCampusFeed(campusId: string, authorId: string, count = 100): Promise<{ ok: number; err: number }> {
    let ok = 0;
    let err = 0;
    const batchSize = 20;

    for (let i = 0; i < count; i += batchSize) {
        const batch: Record<string, unknown>[] = [];
        for (let j = 0; j < batchSize && i + j < count; j++) {
            const cat = pick([...CATEGORIES]);
            batch.push(generatePost(campusId, authorId, cat));
        }
        try {
            const { error } = await insforge.database.from('posts').insert(batch);
            if (error) {
                err += batch.length;
            } else {
                ok += batch.length;
            }
        } catch {
            err += batch.length;
        }
    }

    return { ok, err };
}
