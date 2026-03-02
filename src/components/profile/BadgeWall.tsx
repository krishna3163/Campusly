import { motion } from 'framer-motion';
import { Award, Zap, Code, ShieldCheck, Heart, Star, Trophy, Sparkles } from 'lucide-react';

export interface Badge {
    id: string;
    badge_type: string;
    issued_by: string;
    metadata: any;
    earned_at: string;
}

const BADGE_MAP: Record<string, any> = {
    'leetcode_knight': { label: 'LC Knight', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    'leetcode_guardian': { label: 'LC Guardian', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    'github_star': { label: 'Star Contributor', icon: Star, color: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/20' },
    'campus_ambassador': { label: 'Ambassador', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    'dev_master': { label: 'Elite Developer', icon: Code, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'streak_master': { label: 'Consistency King', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    'top_contributor': { label: 'Top Peer', icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

export default function BadgeWall({ badges }: { badges: Badge[] }) {
    if (badges.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
                <Award size={16} /> Badge Wall
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {badges.map((b, i) => {
                    const cfg = BADGE_MAP[b.badge_type] || { label: b.badge_type, icon: Award, color: 'text-campus-muted', bg: 'bg-white/5', border: 'border-white/10' };
                    const Icon = cfg.icon;

                    return (
                        <motion.div
                            key={b.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-4 rounded-2xl ${cfg.bg} ${cfg.border} border flex flex-col items-center text-center group cursor-help transition-all hover:scale-105 active:scale-95`}
                        >
                            <div className={`${cfg.color} mb-3 group-hover:scale-110 transition-transform`}>
                                <Icon size={24} />
                            </div>
                            <span className="text-[10px] font-black text-white leading-tight uppercase tracking-tighter">{cfg.label}</span>
                            <span className="text-[8px] font-bold text-campus-muted mt-1 uppercase tracking-widest">{new Date(b.earned_at).getFullYear()}</span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
