import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import { motion } from 'framer-motion';
import {
    Trophy,
    ChevronLeft,
    ArrowUp,
    ArrowDown,
    Flame,
    Sparkles,
    Search,
    UserPlus,
    Filter,
    Award
} from 'lucide-react';

export default function LeaderboardPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');

    useEffect(() => {
        loadLeaderboard();
    }, [period]);

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const { data } = await insforge.database
                .from('profiles')
                .select('*')
                .order('xp', { ascending: false })
                .limit(50);

            if (data) {
                setPlayers(data.map((p, i) => ({
                    ...p,
                    rank: i + 1,
                    rankChange: Math.random() > 0.5 ? 'up' : 'down'
                })));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const topThree = players.slice(0, 3);
    const rest = players.slice(3);

    return (
        <div className="h-screen bg-campus-darker overflow-y-auto pb-32 safe-top custom-scrollbar scroll-smooth">
            <header className="px-8 py-10 flex items-center justify-between sticky top-0 bg-campus-darker/80 backdrop-blur-xl z-50 animate-fade-in border-b border-white/5">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-campus-muted hover:text-white transition-all active:scale-90">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
                            <Trophy size={28} className="text-amber-400" /> Hall of Fame
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-campus-muted max-w-[200px] mt-1">Global Campus Reputation</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    {(['weekly', 'monthly', 'all-time'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-brand-500 text-white shadow-glow-sm' : 'text-campus-muted hover:text-white hover:bg-white/5'}`}
                        >
                            {p.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10">

                {/* Podium Section */}
                {!loading && topThree.length > 0 && (
                    <div className="flex items-end justify-center gap-4 md:gap-10 mb-20 pt-10 px-4">
                        {/* 2nd Place */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center flex-1 max-w-[140px]"
                        >
                            <div className="relative mb-4 group">
                                <div className="w-24 h-24 rounded-[32px] bg-slate-400/20 p-1.5 ring-4 ring-slate-400/20 group-hover:scale-110 transition-transform duration-500">
                                    <div className="w-full h-full rounded-[26px] bg-campus-card flex items-center justify-center overflow-hidden border-2 border-campus-card">
                                        <img src={topThree[1].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[1].display_name}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-campus-dark px-4 py-1.5 rounded-xl text-[10px] font-black shadow-elevation-2">2ND</div>
                            </div>
                            <p className="text-sm font-black text-white text-center truncate w-full mb-1">{topThree[1].display_name}</p>
                            <p className="text-[11px] font-black text-slate-400 bg-slate-400/10 px-3 py-1 rounded-lg uppercase tracking-widest">{topThree[1].xp} XP</p>
                            <div className="h-24 w-full bg-slate-400/10 mt-6 rounded-t-3xl border-x border-t border-slate-400/20" />
                        </motion.div>

                        {/* 1st Place */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col items-center flex-1 max-w-[180px] -mt-10"
                        >
                            <div className="relative mb-6 group">
                                <Flame size={48} className="absolute -top-12 left-1/2 -translate-x-1/2 text-amber-500 drop-shadow-glow animate-pulse" />
                                <div className="w-32 h-32 rounded-[40px] bg-amber-500/20 p-2 ring-4 ring-amber-500/30 shadow-glow-brand group-hover:scale-110 transition-transform duration-500">
                                    <div className="w-full h-full rounded-[32px] bg-campus-card flex items-center justify-center overflow-hidden border-2 border-campus-card">
                                        <img src={topThree[0].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[0].display_name}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-6 py-2 rounded-2xl text-xs font-black shadow-glow-brand transform scale-110">👑 THE GOAT</div>
                                <Sparkles size={24} className="absolute -top-4 -right-4 text-brand-400 animate-spin-slow" />
                            </div>
                            <p className="text-xl font-black text-white text-center truncate w-full mb-1 italic uppercase tracking-tighter">{topThree[0].display_name}</p>
                            <p className="text-[12px] font-black text-amber-400 bg-amber-400/10 px-4 py-1.5 rounded-xl uppercase tracking-[0.2em] shadow-glow-sm">{topThree[0].xp} XP</p>
                            <div className="h-40 w-full bg-amber-500/10 mt-6 rounded-t-[40px] border-x border-t border-amber-500/30" />
                        </motion.div>

                        {/* 3rd Place */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col items-center flex-1 max-w-[140px]"
                        >
                            <div className="relative mb-4 group">
                                <div className="w-24 h-24 rounded-[32px] bg-orange-700/20 p-1.5 ring-4 ring-orange-700/20 group-hover:scale-110 transition-transform duration-500">
                                    <div className="w-full h-full rounded-[26px] bg-campus-card flex items-center justify-center overflow-hidden border-2 border-campus-card">
                                        <img src={topThree[2].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topThree[2].display_name}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-700 text-white px-4 py-1.5 rounded-xl text-[10px] font-black shadow-elevation-2">3RD</div>
                            </div>
                            <p className="text-sm font-black text-white text-center truncate w-full mb-1">{topThree[2].display_name}</p>
                            <p className="text-[11px] font-black text-orange-400 bg-orange-700/10 px-3 py-1 rounded-lg uppercase tracking-widest">{topThree[2].xp} XP</p>
                            <div className="h-20 w-full bg-orange-700/10 mt-6 rounded-t-3xl border-x border-t border-orange-700/20" />
                        </motion.div>
                    </div>
                )}

                {/* Search & Filters */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-1 relative group">
                        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-campus-muted opacity-40 group-focus-within:text-brand-400 group-focus-within:opacity-100 transition-all" />
                        <input
                            type="text"
                            placeholder="Find a legend by name or branch..."
                            className="w-full bg-white/[0.03] border border-white/5 rounded-3xl pl-14 pr-6 py-5 text-sm font-bold focus:border-brand-500/50 outline-none transition-all placeholder:italic"
                        />
                    </div>
                    <button className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl text-campus-muted hover:text-white transition-all active:scale-95">
                        <Filter size={20} />
                    </button>
                </div>

                {/* Rest of the List */}
                <div className="space-y-4">
                    {loading ? (
                        [1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 w-full glass-card animate-pulse rounded-3xl border border-white/5" />)
                    ) : (
                        rest.map((p, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={p.id}
                                className="flex items-center justify-between p-5 glass-card bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-[32px] group transition-all duration-300"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-10 text-center text-sm font-black italic text-campus-muted group-hover:text-brand-400 transition-colors">#{p.rank}</div>
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 p-1 border border-white/10 group-hover:border-brand-500/30 overflow-hidden ring-2 ring-transparent group-hover:ring-brand-500/20 transition-all">
                                            <img src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.display_name}`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        {p.rankChange === 'up' ? (
                                            <ArrowUp size={12} className="absolute -top-1 -right-1 text-emerald-400 bg-campus-dark rounded-full border border-emerald-500/30" strokeWidth={4} />
                                        ) : (
                                            <ArrowDown size={12} className="absolute -bottom-1 -right-1 text-red-400 bg-campus-dark rounded-full border border-red-500/30" strokeWidth={4} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-black text-white/90 group-hover:text-brand-400 transition-colors">{p.display_name}</p>
                                        <p className="text-[10px] font-black text-campus-muted uppercase tracking-widest">{p.branch || 'General Hub'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="hidden md:flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1.5 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                                            <Flame size={12} className="text-brand-400" />
                                            <span className="text-xs font-black text-brand-400 uppercase tracking-widest">{p.xp} XP</span>
                                        </div>
                                    </div>
                                    <button className="p-3 bg-white/5 hover:bg-brand-500/20 rounded-2xl text-campus-muted hover:text-brand-400 transition-all active:scale-90 border border-transparent hover:border-brand-500/20">
                                        <UserPlus size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Self Status Mini Card */}
                {!loading && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-[60] animate-slide-up">
                        <div className="glass-card p-6 bg-brand-500 shadow-glow-brand flex items-center justify-between border-none rounded-[40px] text-white">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 p-1 overflow-hidden shadow-elevation-2">
                                    <img src={user?.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.profile?.display_name}`} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div>
                                    <p className="text-sm font-black italic uppercase tracking-tighter">Your Current Standing</p>
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Rank #420</h4>
                                        <span className="text-[10px] bg-black/20 px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">
                                            <Award size={10} /> Tier 4 Legend
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Vibe</p>
                                <p className="text-3xl font-black leading-none italic">920 <span className="text-xs ml-1 opacity-70">XP</span></p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
