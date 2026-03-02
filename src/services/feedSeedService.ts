/**
 * Campus Feed Seeding Service
 * Generates realistic fake posts for campus feed (100+ per campus).
 * Run via admin or one-time migration.
 * Categories: Study, Hostel, Events, Meme, Lost & Found, Placement, Internship, Faculty
 */

import { insforge } from '../lib/insforge';

const CATEGORIES = [
    'general',
    'hostel',
    'event',
    'question',
    'lost_found',
    'marketplace',
    'announcement',
    'anonymous'
] as const;

const DEMO_POSTS = [
    { category: 'event', title: 'TechFest 2026 Registrations Open!', content: 'Registrations for TechFest are now live. Robotics, Hackathon, Gaming tournaments included. Early bird discount till Friday.' },
    { category: 'hostel', title: 'Mess Food Review – Block C', content: 'Aaj ka paneer thoda rubber jaisa tha 😭 Anyone else facing same issue?' },
    { category: 'question', title: 'Best way to prepare for DSA before placements?', content: '6 months left. Should I focus on LeetCode or CodeStudio?' },
    { category: 'anonymous', title: 'Confession', content: 'I think I chose the wrong branch. Anyone else feeling lost?' },
    { category: 'marketplace', title: 'Selling Scientific Calculator', content: 'Casio FX-991ES Plus, barely used. ₹900.' },
    { category: 'lost_found', title: 'Lost Wallet near Library', content: 'Brown leather wallet. ID inside. Please DM if found.' },
    { category: 'announcement', title: 'Mid Semester Exams Schedule Released', content: 'Timetable uploaded on ERP portal.' },
    { category: 'general', title: 'Anyone up for badminton tonight?', content: '7PM, Sports complex.' },
    { category: 'event', title: 'Cultural Night Auditions Tomorrow', content: 'Dance, singing, stand-up entries open.' },
    { category: 'hostel', title: 'WiFi Down Again?', content: 'Block A internet not working since morning.' },
    { category: 'question', title: 'OS viva tips?', content: 'External examiner strict hai kya?' },
    { category: 'marketplace', title: 'Looking for Roommate', content: '2BHK near campus. Sharing basis.' },
    { category: 'anonymous', title: 'Placement Anxiety', content: 'Everyone seems ahead. Feeling pressured.' },
    { category: 'general', title: 'Sunrise from Admin Block', content: 'Today’s view was unreal 🌄' },
    { category: 'announcement', title: 'Library Timing Extended', content: 'Now open till 12 AM during exams.' },
    { category: 'event', title: 'Hackathon Teams Forming', content: 'Need frontend dev. DM fast.' },
    { category: 'question', title: 'Machine Learning Resources?', content: 'Any good free course suggestions?' },
    { category: 'lost_found', title: 'Found AirPods in Canteen', content: 'Tell case color to claim.' },
    { category: 'hostel', title: 'Power Cut Alert', content: 'Maintenance tonight 11PM–1AM.' },
    { category: 'general', title: 'Freshers Meetup?', content: 'Let’s plan unofficial intro meet.' },
];

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

export async function seedDemoPosts(campusId: string, authorId: string): Promise<{ ok: number; err: number }> {
    let ok = 0;
    let err = 0;

    // Check if already seeded to avoid duplicates
    try {
        const { count } = await insforge.database
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('campus_id', campusId)
            .ilike('content', '%TechFest 2026%');

        if (count && count > 0) return { ok: 0, err: 0 };
    } catch (e) { }

    const postsToInsert = DEMO_POSTS.map(post => ({
        user_id: authorId,
        campus_id: campusId,
        category: post.category,
        content: `**${post.title}**\n${post.content}`,
        media_url: null,
        is_anonymous: post.category === 'anonymous',
        likes_count: randInt(5, 120),
        dislikes_count: randInt(0, 5),
        comments_count: randInt(0, 25),
        created_at: daysAgo(randInt(0, 7)),
    }));

    try {
        const { error } = await insforge.database.from('posts').insert(postsToInsert);
        if (!error) {
            ok = postsToInsert.length;
        } else {
            err = postsToInsert.length;
        }
    } catch {
        err = postsToInsert.length;
    }

    return { ok, err };
}

// Keep the old one if needed but update it to use the new categories
export async function seedCampusFeed(campusId: string, authorId: string, count = 100): Promise<{ ok: number; err: number }> {
    let ok = 0;
    let err = 0;
    const batchSize = 20;

    for (let i = 0; i < count; i += batchSize) {
        const batch: any[] = [];
        for (let j = 0; j < batchSize && i + j < count; j++) {
            const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
            const isAnonymous = cat === 'anonymous' || Math.random() > 0.8;
            batch.push({
                author_id: authorId,
                campus_id: campusId,
                category: cat,
                content: `Random post content for ${cat} section ${i + j}`,
                media_urls: [],
                is_anonymous: isAnonymous,
                upvotes: randInt(2, 50),
                downvotes: randInt(0, 5),
                comment_count: randInt(2, 5),
                created_at: daysAgo(randInt(0, 30)),
            });
        }
        try {
            const { error } = await insforge.database.from('posts').insert(batch);
            if (!error) ok += batch.length; else err += batch.length;
        } catch { err += batch.length; }
    }
    return { ok, err };
}
