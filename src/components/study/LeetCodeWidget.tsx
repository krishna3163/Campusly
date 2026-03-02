import { useState, useEffect } from 'react';
import { LeetCodeService, LeetCodeProfile } from '../../services/LeetCodeService';
import { Target, Zap, Trophy, ChevronRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LeetCodeWidget({ userId }: { userId: string }) {
    const [profile, setProfile] = useState<LeetCodeProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (userId) loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        setLoading(true);
        const { data } = await LeetCodeService.getProfile(userId);
        setProfile(data);
        setLoading(false);
    };

    const handleSync = async () => {
        let username = profile?.username;
        if (!username) {
            username = prompt('Enter your LeetCode username:') || undefined;
            if (!username) return;
        }
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            await LeetCodeService.syncProfile(userId, username);
            await loadProfile();
        } catch (err) {
            console.error(err);
        }
        setIsSyncing(false);
    };

    if (loading) return <div className="glass-card p-6 h-48 animate-pulse bg-white/5 border border-white/10" />;

    if (!profile) {
        return (
            <div className="glass-card p-6 bg-gradient-to-br from-yellow-500/5 to-transparent border-yellow-500/10">
                <div className="flex items-center gap-3 mb-4">
                    <Target size={20} className="text-yellow-500" />
                    <h3 className="font-bold text-white text-sm">LeetCode Progress</h3>
                </div>
                <p className="text-xs text-campus-muted mb-4 leading-relaxed">Connect your LeetCode profile to track your solving streak and rank.</p>
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full py-2.5 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-bold hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-2"
                >
                    {isSyncing ? <div className="w-3 h-3 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" /> : null}
                    {isSyncing ? 'Linking...' : 'Link Profile'}
                </button>
            </div>
        );
    }

    const solvedPercentage = Math.round((profile.total_solved / 3200) * 100); // Approximate total

    return (
        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20 group-hover:scale-110 transition-transform">
                        <Target size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">LC Progress</h3>
                        <p className="text-[10px] text-campus-muted font-bold uppercase tracking-wider">@{profile.username}</p>
                    </div>
                </div>
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`p-2 rounded-lg bg-white/5 text-campus-muted hover:text-white transition-all ${isSyncing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="flex items-center gap-6 mb-6">
                <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48" cy="48" r="40"
                            stroke="currentColor" strokeWidth="8"
                            fill="transparent"
                            className="text-white/5"
                        />
                        <motion.circle
                            cx="48" cy="48" r="40"
                            stroke="currentColor" strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={251.2}
                            initial={{ strokeDashoffset: 251.2 }}
                            animate={{ strokeDashoffset: 251.2 - (251.2 * solvedPercentage) / 100 }}
                            className="text-yellow-500"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-white">{profile.total_solved}</span>
                        <span className="text-[9px] font-bold text-campus-muted uppercase">Solved</span>
                    </div>
                </div>

                <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-orange-400" />
                            <span className="text-[10px] font-bold text-campus-muted uppercase">Streak</span>
                        </div>
                        <span className="text-sm font-black text-white">{profile.streak_days}d</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                            <Trophy size={14} className="text-yellow-400" />
                            <span className="text-[10px] font-bold text-campus-muted uppercase">Rating</span>
                        </div>
                        <span className="text-sm font-black text-white">{Math.round(profile.rating || 0)}</span>
                    </div>
                </div>
            </div>

            <button className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                Full Profile <ChevronRight size={14} />
            </button>
        </div>
    );
}
