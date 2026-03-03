import React from 'react';
import { Github, Globe, ExternalLink, Trophy, Flame, Target, Star, Hexagon } from 'lucide-react';

interface ProfileInfo {
    platform: string;
    username: string;
    rank?: string | number;
    rating?: number;
    icon: any;
    color: string;
    link: string;
}

export default function CodingProfilesGrid({ profile }: { profile: any }) {
    const profiles: ProfileInfo[] = [
        {
            platform: 'LeetCode',
            username: profile?.leetcode_username || 'krishna3163',
            rank: '15,240',
            rating: 1945,
            icon: Target,
            color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
            link: `https://leetcode.com/${profile?.leetcode_username || 'krishna3163'}`
        },
        {
            platform: 'Codeforces',
            username: profile?.codeforces_username || 'krishna_01',
            rank: 'Candidate Master',
            rating: 1852,
            icon: Trophy,
            color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
            link: `https://codeforces.com/profile/${profile?.codeforces_username || 'krishna_01'}`
        },
        {
            platform: 'GitHub',
            username: profile?.github_username || 'krishnakumar',
            rank: '1.2k Stars',
            rating: undefined,
            icon: Github,
            color: 'text-slate-800 bg-slate-800/10 border-slate-800/20 dark:text-white dark:bg-white/10 dark:border-white/20',
            link: `https://github.com/${profile?.github_username || 'krishnakumar'}`
        },
        {
            platform: 'GFG',
            username: profile?.gfg_username || 'kk3163',
            rank: '2.5k Points',
            rating: undefined,
            icon: Star,
            color: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/20',
            link: `https://practice.geeksforgeeks.org/profile/${profile?.gfg_username || 'kk3163'}`
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-3 mb-6">
            {profiles.map((p, i) => (
                <a
                    key={p.platform}
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden ${p.color}`}
                >
                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className={`p-2 rounded-lg bg-white/40 shadow-sm`}>
                            <p.icon size={18} />
                        </div>
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="relative z-10">
                        <h4 className="font-black text-[11px] uppercase tracking-widest opacity-60 mb-1">{p.platform}</h4>
                        <p className="font-bold text-[14px] truncate">{p.username}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-tight py-0.5 px-2 rounded-full bg-white/50 border border-current opacity-80 whitespace-nowrap">
                                {p.rank}
                            </span>
                            {p.rating && (
                                <span className="text-[10px] font-black text-[#007AFF] uppercase tracking-tighter">★ {p.rating}</span>
                            )}
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
}
