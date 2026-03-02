import { useState, useEffect } from 'react';
import { LeetCodeService, LeetCodeProfile } from '../../services/LeetCodeService';
import { GitHubService, GitHubProfile } from '../../services/GitHubService';
import { insforge } from '../../lib/insforge';
import { Code, Github, Zap, Trophy, Star, Target, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import PinnedProjectCard from './PinnedProjectCard';
import BadgeWall, { Badge } from './BadgeWall';

export default function ProfileIntegrations({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
    const [lcProfile, setLcProfile] = useState<LeetCodeProfile | null>(null);
    const [ghProfile, setGhProfile] = useState<GitHubProfile | null>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (userId) loadAll();
    }, [userId]);

    const loadAll = async () => {
        setLoading(true);
        const [lc, gh, bg] = await Promise.all([
            LeetCodeService.getProfile(userId),
            GitHubService.getProfile(userId),
            insforge.database.from('user_badges').select('*').eq('user_id', userId)
        ]);
        setLcProfile(lc.data);
        setGhProfile(gh.data);
        setBadges(bg.data || []);
        setLoading(false);
    };

    const handleSync = async (type: 'leetcode' | 'github') => {
        setIsSyncing(true);
        const username = type === 'leetcode' ? lcProfile?.username : ghProfile?.username;
        if (username) {
            if (type === 'leetcode') await LeetCodeService.syncProfile(userId, username);
            else await GitHubService.syncProfile(userId, username);
            await loadAll();
        }
        setIsSyncing(false);
    };

    const togglePrivacy = async () => {
        if (!lcProfile) return;
        const newMode = lcProfile.privacy_mode === 'private' ? 'public' : 'private';

        setLcProfile({ ...lcProfile, privacy_mode: newMode });

        await insforge.database
            .from('leetcode_profiles')
            .update({ privacy_mode: newMode })
            .eq('user_id', userId);
    };

    if (loading) return <div className="space-y-8 animate-pulse"><div className="h-64 glass-card bg-white/5" /><div className="h-64 glass-card bg-white/5" /></div>;

    const showLeetCode = lcProfile && (isOwnProfile || lcProfile.privacy_mode !== 'private');

    return (
        <div className="space-y-12 pb-20">
            {/* BADGE WALL (Section 7) */}
            <BadgeWall badges={badges} />

            {/* LEETCODE SECTION (Section 4) */}
            {showLeetCode && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-white/50 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Code size={18} className="text-yellow-500" /> LeetCode Intelligence
                        </h3>
                        {isOwnProfile && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={togglePrivacy}
                                    title={`Mode: ${lcProfile.privacy_mode}`}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all border
                                        ${lcProfile.privacy_mode === 'private' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
                                >
                                    {lcProfile.privacy_mode === 'private' ? 'Private' : 'Public'}
                                </button>
                                <button onClick={() => handleSync('leetcode')} className={`p-2 rounded-xl bg-white/5 text-campus-muted hover:text-white transition-all ${isSyncing ? 'animate-spin' : ''}`}>
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-4 glass-card p-8 bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-3xl bg-campus-dark border-4 border-yellow-500/20 flex items-center justify-center text-3xl font-black text-yellow-500 mb-6 shadow-glow">
                                {lcProfile.total_solved}
                            </div>
                            <h4 className="text-lg font-black text-white italic">Elite Solver</h4>
                            <p className="text-[10px] text-campus-muted font-bold uppercase tracking-widest mt-1">Global Rank: #{lcProfile.ranking || '—'}</p>

                            <div className="w-full mt-8 space-y-3">
                                <DifficultyBar label="Easy" count={lcProfile.easy_count} color="bg-emerald-500" />
                                <DifficultyBar label="Medium" count={lcProfile.medium_count} color="bg-yellow-500" />
                                <DifficultyBar label="Hard" count={lcProfile.hard_count} color="bg-rose-500" />
                            </div>
                        </div>

                        <div className="md:col-span-8 grid grid-cols-2 gap-4">
                            <StatBox icon={Zap} label="Current Streak" value={`${lcProfile.streak_days} Days`} color="text-orange-400" />
                            <StatBox icon={Trophy} label="Contest Rating" value={Math.round(lcProfile.rating || 0).toString()} color="text-yellow-400" />
                            <StatBox icon={Target} label="Percentile" value="Top 4.2%" color="text-brand-400" />
                            <StatBox icon={Star} label="Total Badges" value={lcProfile.badges?.length?.toString() || '0'} color="text-purple-400" />
                        </div>
                    </div>
                </section>
            )}

            {/* GITHUB SECTION (Section 5 & 6) */}
            {ghProfile && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-white/50 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Github size={18} className="text-white" /> Open Source Pulse
                        </h3>
                        {isOwnProfile && (
                            <button onClick={() => handleSync('github')} className="p-2 rounded-xl bg-white/5 text-campus-muted hover:text-white transition-all">
                                <RefreshCw size={14} />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass-card p-6 border-white/5 text-center">
                            <div className="text-2xl font-black text-white">{ghProfile.total_contributions}</div>
                            <div className="text-[9px] font-bold text-campus-muted uppercase tracking-widest mt-1">Contributions</div>
                        </div>
                        <div className="glass-card p-6 border-white/5 text-center">
                            <div className="text-2xl font-black text-white">{ghProfile.total_stars}</div>
                            <div className="text-[9px] font-bold text-campus-muted uppercase tracking-widest mt-1">Total Stars</div>
                        </div>
                        <div className="glass-card p-6 border-white/5 text-center">
                            <div className="text-2xl font-black text-white">{ghProfile.contribution_streak}d</div>
                            <div className="text-[9px] font-bold text-campus-muted uppercase tracking-widest mt-1">Current Streak</div>
                        </div>
                        <div className="glass-card p-6 border-white/5 text-center">
                            <div className="text-2xl font-black text-white">{ghProfile.total_repos}</div>
                            <div className="text-[9px] font-bold text-campus-muted uppercase tracking-widest mt-1">Public Repos</div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-10">
                        <h4 className="text-[10px] font-black italic text-campus-muted uppercase tracking-[0.4em] flex items-center gap-3">
                            <Star size={14} className="text-brand-400" /> Pinned Architecture
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(ghProfile.pinned_projects as any[])?.map((p, i) => (
                                <PinnedProjectCard key={i} project={p} index={i} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

function DifficultyBar({ label, count, color }: { label: string; count: number; color: string }) {
    const total = 1000; // Normalizing for bars
    const percentage = Math.min((count / total) * 100, 100);
    return (
        <div className="w-full">
            <div className="flex justify-between text-[9px] font-bold uppercase mb-1">
                <span className="text-campus-muted">{label}</span>
                <span className="text-white">{count}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${color}`}
                />
            </div>
        </div>
    )
}

function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    return (
        <div className="glass-card p-6 border-white/5 flex flex-col items-center justify-center text-center group hover:bg-white/[0.04] transition-all">
            <div className={`${color} mb-3 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <h5 className="text-lg font-black text-white italic">{value}</h5>
            <p className="text-[10px] text-campus-muted font-bold uppercase tracking-widest mt-1">{label}</p>
        </div>
    )
}
