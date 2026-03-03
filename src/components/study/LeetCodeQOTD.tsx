import { useState, useEffect } from 'react';
import { ExternalLink, Calendar, Tag, Flame, RefreshCw } from 'lucide-react';

interface DailyQuestion {
    title: string;
    titleSlug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topicTags: string[];
    link: string;
    date: string;
}

export default function LeetCodeQOTD() {
    const [question, setQuestion] = useState<DailyQuestion | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDailyQuestion();
    }, []);

    const fetchDailyQuestion = async () => {
        setLoading(true);
        try {
            // Try fetching from LeetCode GraphQL API via proxy
            const res = await fetch('https://leetcode.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query questionOfToday { activeDailyCodingChallengeQuestion { date link question { title titleSlug difficulty topicTags { name } } } }`
                })
            });

            if (res.ok) {
                const json = await res.json();
                const q = json.data?.activeDailyCodingChallengeQuestion;
                if (q) {
                    setQuestion({
                        title: q.question.title,
                        titleSlug: q.question.titleSlug,
                        difficulty: q.question.difficulty,
                        topicTags: q.question.topicTags?.map((t: any) => t.name) || [],
                        link: `https://leetcode.com${q.link}`,
                        date: q.date
                    });
                    setLoading(false);
                    return;
                }
            }
        } catch {
            // CORS may block — use fallback
        }

        // Fallback: Generate a consistent daily question from a curated list
        const dailyProblems: DailyQuestion[] = [
            { title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy', topicTags: ['Array', 'Hash Table'], link: 'https://leetcode.com/problems/two-sum/', date: '' },
            { title: 'Longest Substring Without Repeating Characters', titleSlug: 'longest-substring-without-repeating-characters', difficulty: 'Medium', topicTags: ['String', 'Sliding Window'], link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', date: '' },
            { title: 'Median of Two Sorted Arrays', titleSlug: 'median-of-two-sorted-arrays', difficulty: 'Hard', topicTags: ['Array', 'Binary Search'], link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', date: '' },
            { title: 'Valid Parentheses', titleSlug: 'valid-parentheses', difficulty: 'Easy', topicTags: ['String', 'Stack'], link: 'https://leetcode.com/problems/valid-parentheses/', date: '' },
            { title: 'Merge Two Sorted Lists', titleSlug: 'merge-two-sorted-lists', difficulty: 'Easy', topicTags: ['Linked List', 'Recursion'], link: 'https://leetcode.com/problems/merge-two-sorted-lists/', date: '' },
            { title: 'Maximum Subarray', titleSlug: 'maximum-subarray', difficulty: 'Medium', topicTags: ['Array', 'DP'], link: 'https://leetcode.com/problems/maximum-subarray/', date: '' },
            { title: 'Climbing Stairs', titleSlug: 'climbing-stairs', difficulty: 'Easy', topicTags: ['Math', 'DP'], link: 'https://leetcode.com/problems/climbing-stairs/', date: '' },
            { title: 'Best Time to Buy and Sell Stock', titleSlug: 'best-time-to-buy-and-sell-stock', difficulty: 'Easy', topicTags: ['Array', 'Greedy'], link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', date: '' },
            { title: 'Container With Most Water', titleSlug: 'container-with-most-water', difficulty: 'Medium', topicTags: ['Array', 'Two Pointers'], link: 'https://leetcode.com/problems/container-with-most-water/', date: '' },
            { title: 'Reverse Linked List', titleSlug: 'reverse-linked-list', difficulty: 'Easy', topicTags: ['Linked List'], link: 'https://leetcode.com/problems/reverse-linked-list/', date: '' },
            { title: 'Longest Palindromic Substring', titleSlug: 'longest-palindromic-substring', difficulty: 'Medium', topicTags: ['String', 'DP'], link: 'https://leetcode.com/problems/longest-palindromic-substring/', date: '' },
            { title: 'Course Schedule', titleSlug: 'course-schedule', difficulty: 'Medium', topicTags: ['Graph', 'BFS', 'DFS'], link: 'https://leetcode.com/problems/course-schedule/', date: '' },
            { title: 'Word Break', titleSlug: 'word-break', difficulty: 'Medium', topicTags: ['String', 'DP'], link: 'https://leetcode.com/problems/word-break/', date: '' },
            { title: 'Trapping Rain Water', titleSlug: 'trapping-rain-water', difficulty: 'Hard', topicTags: ['Array', 'Stack', 'Two Pointers'], link: 'https://leetcode.com/problems/trapping-rain-water/', date: '' },
            { title: 'Binary Tree Level Order Traversal', titleSlug: 'binary-tree-level-order-traversal', difficulty: 'Medium', topicTags: ['Tree', 'BFS'], link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', date: '' },
            { title: 'Coin Change', titleSlug: 'coin-change', difficulty: 'Medium', topicTags: ['Array', 'DP'], link: 'https://leetcode.com/problems/coin-change/', date: '' },
            { title: 'Number of Islands', titleSlug: 'number-of-islands', difficulty: 'Medium', topicTags: ['Graph', 'DFS', 'BFS'], link: 'https://leetcode.com/problems/number-of-islands/', date: '' },
            { title: 'House Robber', titleSlug: 'house-robber', difficulty: 'Medium', topicTags: ['Array', 'DP'], link: 'https://leetcode.com/problems/house-robber/', date: '' },
            { title: 'Rotate Image', titleSlug: 'rotate-image', difficulty: 'Medium', topicTags: ['Array', 'Matrix'], link: 'https://leetcode.com/problems/rotate-image/', date: '' },
            { title: 'Group Anagrams', titleSlug: 'group-anagrams', difficulty: 'Medium', topicTags: ['String', 'Hash Table'], link: 'https://leetcode.com/problems/group-anagrams/', date: '' },
            { title: 'Serialize and Deserialize Binary Tree', titleSlug: 'serialize-and-deserialize-binary-tree', difficulty: 'Hard', topicTags: ['Tree', 'Design', 'BFS'], link: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', date: '' },
            { title: '3Sum', titleSlug: '3sum', difficulty: 'Medium', topicTags: ['Array', 'Two Pointers', 'Sorting'], link: 'https://leetcode.com/problems/3sum/', date: '' },
            { title: 'Search in Rotated Sorted Array', titleSlug: 'search-in-rotated-sorted-array', difficulty: 'Medium', topicTags: ['Array', 'Binary Search'], link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', date: '' },
            { title: 'Kth Largest Element in an Array', titleSlug: 'kth-largest-element-in-an-array', difficulty: 'Medium', topicTags: ['Array', 'Sorting', 'Heap'], link: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', date: '' },
            { title: 'Product of Array Except Self', titleSlug: 'product-of-array-except-self', difficulty: 'Medium', topicTags: ['Array', 'Prefix Sum'], link: 'https://leetcode.com/problems/product-of-array-except-self/', date: '' },
            { title: 'Min Stack', titleSlug: 'min-stack', difficulty: 'Medium', topicTags: ['Stack', 'Design'], link: 'https://leetcode.com/problems/min-stack/', date: '' },
            { title: 'Combination Sum', titleSlug: 'combination-sum', difficulty: 'Medium', topicTags: ['Array', 'Backtracking'], link: 'https://leetcode.com/problems/combination-sum/', date: '' },
            { title: 'LRU Cache', titleSlug: 'lru-cache', difficulty: 'Medium', topicTags: ['Hash Table', 'Design', 'Linked List'], link: 'https://leetcode.com/problems/lru-cache/', date: '' },
            { title: 'Merge Intervals', titleSlug: 'merge-intervals', difficulty: 'Medium', topicTags: ['Array', 'Sorting'], link: 'https://leetcode.com/problems/merge-intervals/', date: '' },
            { title: 'Edit Distance', titleSlug: 'edit-distance', difficulty: 'Medium', topicTags: ['String', 'DP'], link: 'https://leetcode.com/problems/edit-distance/', date: '' },
        ];

        // Pick one based on day of year for consistency
        const now = new Date();
        const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
        const idx = dayOfYear % dailyProblems.length;
        const picked = dailyProblems[idx];
        picked.date = now.toISOString().split('T')[0];
        setQuestion(picked);
        setLoading(false);
    };

    const difficultyColor = (d: string) => {
        switch (d) {
            case 'Easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Hard': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    if (loading) {
        return <div className="bg-[var(--surface)] rounded-[16px] border border-[var(--border)] p-5 animate-pulse h-32" />;
    }

    if (!question) return null;

    return (
        <div className="bg-[var(--surface)] rounded-[16px] border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Flame size={18} className="text-orange-400" />
                        <h3 className="font-bold text-[15px] text-[var(--foreground)]">Daily Challenge</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-[var(--foreground-muted)]" />
                        <span className="text-[11px] text-[var(--foreground-muted)]">{question.date}</span>
                    </div>
                </div>

                <h4 className="font-bold text-[17px] text-[var(--foreground)] mb-3 leading-tight">
                    {question.title}
                </h4>

                <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${difficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                    </span>
                    {question.topicTags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-[var(--background)] text-[var(--foreground-muted)] text-[10px] font-medium border border-[var(--border)]">
                            {tag}
                        </span>
                    ))}
                </div>

                <a
                    href={question.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block py-3 rounded-xl bg-[#FFA116]/10 text-[#FFA116] border border-[#FFA116]/20 text-[13px] font-bold text-center hover:bg-[#FFA116]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <ExternalLink size={14} /> Solve on LeetCode
                </a>
            </div>
        </div>
    );
}
