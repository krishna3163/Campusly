import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2 } from 'lucide-react';
import { FeedService } from '../../services/feedService';

interface PollViewProps {
    postId: string;
    userId: string;
}

export const PollView: React.FC<PollViewProps> = ({ postId, userId }) => {
    const [poll, setPoll] = useState<any>(null);
    const [userVotes, setUserVotes] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPoll();
    }, [postId]);

    const loadPoll = async () => {
        try {
            const { data } = await FeedService.getPoll(postId);
            if (data) {
                setPoll(data);
                const votes = typeof data.votes === 'string' ? JSON.parse(data.votes) : (data.votes || {});
                if (votes[userId] !== undefined) {
                    const val = votes[userId];
                    setUserVotes(Array.isArray(val) ? val : [val]);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (index: number) => {
        if (!poll) return;

        let nextVotes = [...userVotes];
        const isSelected = nextVotes.includes(index);

        if (isSelected) {
            nextVotes = nextVotes.filter(v => v !== index);
        } else {
            if (!poll.is_multiple_choice) {
                nextVotes = [index];
            } else {
                nextVotes.push(index);
            }
        }

        try {
            const { data, error } = await FeedService.votePoll(postId, userId, nextVotes);
            if (!error) {
                setUserVotes(nextVotes);
                setPoll((prev: any) => ({ ...prev, votes: data }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading || !poll) return null;

    const votes = typeof poll.votes === 'string' ? JSON.parse(poll.votes) : (poll.votes || {});
    const totalVotes = Object.keys(votes).length;
    const optionCounts = poll.options.map((_: any, i: number) =>
        Object.values(votes).filter((v: any) => Array.isArray(v) ? v.includes(i) : v === i).length
    );

    const hasVoted = userVotes.length > 0;

    return (
        <div className="bg-[#F2F2F7] rounded-[24px] p-4 border border-black/5 space-y-3">
            <div className="flex items-center justify-between mb-1 px-1">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
                    <BarChart3 size={14} /> Campus Poll
                </h5>
                <span className="text-[11px] font-medium text-[#8E8E93]">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
            </div>

            <div className="space-y-2">
                {poll.options.map((option: string, i: number) => {
                    const count = optionCounts[i];
                    const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const isSelected = userVotes.includes(i);

                    return (
                        <button
                            key={i}
                            onClick={() => handleVote(i)}
                            className={`w-full relative h-12 rounded-2xl border transition-all overflow-hidden active:scale-[0.98] ${isSelected ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-black/5 bg-white hover:border-[#007AFF]/50'}`}
                        >
                            {/* Bar - only show if someone has voted */}
                            {totalVotes > 0 && (
                                <div
                                    className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out ${isSelected ? 'bg-[#007AFF]/10' : 'bg-[#F2F2F7]'}`}
                                    style={{ width: `${percent}%` }}
                                />
                            )}

                            <div className="absolute inset-0 px-4 flex items-center justify-between z-10">
                                <span className={`text-[15px] font-semibold flex items-center gap-2 ${isSelected ? 'text-[#007AFF]' : 'text-black'}`}>
                                    {option}
                                    {isSelected && <CheckCircle2 size={16} fill="white" />}
                                </span>
                                {totalVotes > 0 && (
                                    <span className={`text-[13px] font-bold ${isSelected ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>
                                        {percent}%
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {!hasVoted && (
                <p className="text-[11px] text-[#8E8E93] text-center font-medium mt-1">
                    {poll.is_multiple_choice ? 'Choose one or more options' : 'Select an option to vote'}
                </p>
            )}
        </div>
    );
};
