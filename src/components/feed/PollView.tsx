import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2 } from 'lucide-react';
import { FeedService } from '../../services/feedService';
import { insforge } from '../../lib/insforge';

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
        const isSelected = userVotes.includes(index);
        let nextVotes = [...userVotes];

        if (isSelected) {
            nextVotes = nextVotes.filter(v => v !== index);
        } else {
            if (!poll.is_multiple_choice && userVotes.length > 0) return;
            nextVotes.push(index);
        }

        try {
            const { data, error } = await FeedService.votePoll(postId, userId, nextVotes as any);
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
        Object.values(votes).filter(v => Array.isArray(v) ? v.includes(i) : v === i).length
    );

    return (
        <div className="p-6 bg-white/[0.03] rounded-[32px] border border-white/5 space-y-3 mt-4">
            <div className="flex items-center justify-between mb-2">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 flex items-center gap-2">
                    <BarChart3 size={14} /> Campus Census
                </h5>
                <span className="text-[10px] font-bold text-campus-muted uppercase tracking-widest">{totalVotes} signals</span>
            </div>

            <div className="space-y-2">
                {poll.options.map((option: string, i: number) => {
                    const count = optionCounts[i];
                    const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const isSelected = userVotes.includes(i);

                    return (
                        <button
                            key={i}
                            disabled={!poll.is_multiple_choice && userVotes.length > 0}
                            onClick={() => handleVote(i)}
                            className={`w-full relative h-12 rounded-2xl border transition-all overflow-hidden group ${isSelected ? 'border-brand-500/50' : 'border-white/5 hover:border-white/20'}`}
                        >
                            {/* Bar */}
                            <div
                                className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ${isSelected ? 'bg-brand-500/20' : 'bg-white/5'}`}
                                style={{ width: `${percent}%` }}
                            />

                            <div className="absolute inset-0 px-5 flex items-center justify-between z-10">
                                <span className={`text-sm font-bold flex items-center gap-2 ${isSelected ? 'text-brand-400' : 'text-white/80'}`}>
                                    {option}
                                    {isSelected && <CheckCircle2 size={14} />}
                                </span>
                                <span className="text-xs font-black italic text-campus-muted">{percent}%</span>
                            </div>
                        </button>
                    );
                })}
            </div>
            {userVotes.length === 0 && (
                <p className="text-[9px] font-bold text-campus-muted text-center uppercase tracking-widest mt-2">
                    {poll.is_multiple_choice ? 'Selective Signal: Choose One or More' : 'Participation required to view results'}
                </p>
            )}
        </div>
    );
};
