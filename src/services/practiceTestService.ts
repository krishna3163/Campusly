// ===================================================================
// Campusly v3.0 — Practice Test Service
// MCQ practice mode inside groups with scoring and leaderboards.
// ===================================================================

import { insforge } from '../lib/insforge';
import type { PracticeTest, PracticeQuestion, PracticeAttempt } from '../types/messaging';

/**
 * Create a new practice test in a group.
 */
export async function createPracticeTest(
    groupId: string,
    createdBy: string,
    testData: {
        title: string;
        subject?: string;
        description?: string;
        time_limit_minutes?: number;
    },
    questions: Array<{
        question_text: string;
        options: string[];
        correct_option: number;
        explanation?: string;
        points?: number;
    }>
): Promise<PracticeTest | null> {
    // Create test
    const { data: test, error } = await insforge.database
        .from('practice_tests')
        .insert({
            group_id: groupId,
            created_by: createdBy,
            title: testData.title,
            subject: testData.subject,
            description: testData.description,
            time_limit_minutes: testData.time_limit_minutes || 30,
        })
        .select()
        .single();

    if (error || !test) return null;

    // Insert questions
    const questionsToInsert = questions.map((q, i) => ({
        test_id: test.id,
        question_text: q.question_text,
        options: q.options,
        correct_option: q.correct_option,
        explanation: q.explanation,
        points: q.points || 1,
        sort_order: i,
    }));

    await insforge.database.from('practice_questions').insert(questionsToInsert);

    // Notify group
    await insforge.database.from('messages').insert({
        conversation_id: groupId,
        sender_id: createdBy,
        content: `🧪 New Practice Test: "${testData.title}" — ${questions.length} questions, ${testData.time_limit_minutes || 30} min limit`,
        type: 'system',
    });

    return test as PracticeTest;
}

/**
 * Get all practice tests for a group.
 */
export async function getGroupPracticeTests(groupId: string): Promise<PracticeTest[]> {
    const { data } = await insforge.database
        .from('practice_tests')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    return (data as PracticeTest[]) || [];
}

/**
 * Get questions for a test.
 */
export async function getTestQuestions(testId: string): Promise<PracticeQuestion[]> {
    const { data } = await insforge.database
        .from('practice_questions')
        .select('*')
        .eq('test_id', testId)
        .order('sort_order', { ascending: true });

    return (data as PracticeQuestion[]) || [];
}

/**
 * Submit a practice test attempt.
 */
export async function submitAttempt(
    testId: string,
    userId: string,
    answers: Record<string, number>,
    timeTakenSeconds: number
): Promise<PracticeAttempt | null> {
    // Get correct answers
    const questions = await getTestQuestions(testId);
    let score = 0;
    let maxScore = 0;

    for (const q of questions) {
        maxScore += q.points;
        if (answers[q.id] === q.correct_option) {
            score += q.points;
        }
    }

    const { data, error } = await insforge.database
        .from('practice_attempts')
        .upsert({
            test_id: testId,
            user_id: userId,
            answers,
            score,
            max_score: maxScore,
            time_taken_seconds: timeTakenSeconds,
            completed_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) return null;
    return data as PracticeAttempt;
}

/**
 * Get leaderboard for a practice test.
 */
export async function getTestLeaderboard(testId: string): Promise<PracticeAttempt[]> {
    const { data } = await insforge.database
        .from('practice_attempts')
        .select('*, user:profiles(display_name, avatar_url, branch)')
        .eq('test_id', testId)
        .not('completed_at', 'is', null)
        .order('score', { ascending: false })
        .order('time_taken_seconds', { ascending: true })
        .limit(50);

    return (data as PracticeAttempt[]) || [];
}
