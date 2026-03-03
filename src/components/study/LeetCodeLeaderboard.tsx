import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, MessageSquare, Plus, Search, Users, Star } from 'lucide-react';
import { CodingService } from '../../services/codingService';
import { useUser } from '@insforge/react';

export default function LeetCodeLeaderboard() {
    const { user } = useUser();
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) loadFriends();
    }, [user?.id]);

    const loadFriends = async () => {
        setLoading(true);
        const { data } = await CodingService.getLeaderboardFriends(user!.id);
        const sorted = (data || []).sort((a: any, b: any) => (b.friend?.leetcode?.total_solved || 0) - (a.friend?.leetcode?.total_solved || 0));
        setFriends(sorted);
        setLoading(false);
    };

    if (loading) return <div className="p-4 bg-[var(--surface)] rounded-2xl animate-pulse h-40" />;

    return (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="text-amber-500" size={20} />
                    <h3 className="font-bold text-[15px]">LeetCode Leaderboard</h3>
                </div>
                <button className="text-[#007AFF] text-[13px] font-bold flex items-center gap-1 hover:underline">
                    <Plus size={14} /> Add Friend
                </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                {friends.length === 0 ? (
                    <div className="p-10 text-center text-[#8E8E93]">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-[14px]">No friends on leaderboard yet.</p>
                        <p className="text-[12px] mt-1">Add friends to compete!</p>
                    </div>
                ) : (
                    friends.map((f, i) => (
                        <div key={f.id} className="p-4 flex items-center justify-between hover:bg-[var(--background)] transition-colors border-b border-[var(--border)] last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 flex items-center justify-center">
                                    {i === 0 ? <Crown size={18} className="text-amber-500" /> :
                                        i === 1 ? <Medal size={18} className="text-slate-400" /> :
                                            i === 2 ? <Medal size={18} className="text-amber-800" /> :
                                                <span className="text-[13px] font-bold text-[#8E8E93]">{i + 1}</span>}
                                </div>
                                <img
                                    src={f.friend?.avatar_url || `https://ui-avatars.com/api/?name=${f.friend?.display_name || 'User'}`}
                                    className="w-10 h-10 rounded-full bg-[var(--background)] border border-[var(--border)]"
                                    alt=""
                                />
                                <div>
                                    <h4 className="text-[14px] font-bold">{f.friend?.display_name}</h4>
                                    <p className="text-[11px] text-[#8E8E93] uppercase font-bold tracking-tight">@{f.friend?.leetcode?.username || 'no-link'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[16px] font-black text-[#007AFF]">{f.friend?.leetcode?.total_solved || 0}</div>
                                <div className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-widest">SOLVED</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
