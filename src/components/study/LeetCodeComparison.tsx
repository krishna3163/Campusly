import { useState, useEffect } from 'react';
import { LeetCodeService } from '../../services/LeetCodeService';
import { Users, Trophy, ChevronRight, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LeetCodeComparison({ userId }: { userId: string }) {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) loadFriends();
    }, [userId]);

    const loadFriends = async () => {
        setLoading(true);
        const data = await LeetCodeService.getFriendsProfiles(userId);
        setFriends(data || []);
        setLoading(false);
    };

    if (loading) return <div className="glass-card p-6 h-64 animate-pulse" />;

    return (
        <div className="bg-campus-card rounded-[24px] p-6 border border-campus-border shadow-card mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                        <Users size={20} />
                    </div>
                    <h3 className="font-bold text-white text-lg tracking-tight">Friend Leaderboard</h3>
                </div>
                <button onClick={loadFriends} className="text-[10px] font-black uppercase tracking-widest text-brand-400 hover:underline">Fresh Sweep</button>
            </div>

            <div className="space-y-3">
                {friends.length > 0 ? friends.slice(0, 5).map((friend, idx) => (
                    <div key={friend.user_id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all group">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-campus-muted w-4">{idx + 1}</span>
                            <div className="relative">
                                {friend.profile?.avatar_url ? (
                                    <img src={friend.profile.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-400">
                                        {friend.profile?.display_name?.charAt(0)}
                                    </div>
                                )}
                                {idx === 0 && <Trophy size={14} className="absolute -top-1 -right-1 text-yellow-500 bg-campus-dark rounded-full p-0.5" />}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white">{friend.profile?.display_name}</p>
                                <p className="text-[10px] text-campus-muted font-bold uppercase tracking-wider">@{friend.username}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-lg font-black text-white italic leading-none">{friend.total_solved}</span>
                            <span className="text-[9px] font-bold text-campus-muted uppercase mt-1">Solved</span>
                        </div>
                    </div>
                )) : (
                    <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <Users className="mx-auto mb-2 text-campus-muted" size={32} strokeWidth={1} />
                        <p className="text-xs text-campus-muted px-6">No friends have linked their LeetCode accounts yet. Be the first to start a streak!</p>
                    </div>
                )}
            </div>

            <button className="w-full mt-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-brand-500 transition-all flex items-center justify-center gap-2 group">
                Challenge Sync <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
