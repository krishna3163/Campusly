import { useState, useEffect } from 'react';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { Post } from '../../types';
import {
    TrendingUp,
    Calendar,
    MapPin,
    ShoppingBag,
    MessageSquare,
    Megaphone,
    HelpCircle,
    Home,
    Plus,
    ArrowUp,
    ArrowDown,
    MessageCircle,
    Share2,
    Bookmark,
    MoreHorizontal,
    Sparkles,
    Eye,
    ChevronRight,
    Image,
} from 'lucide-react';
import { RankingEngine } from '../../services/rankingService';

const categories = [
    { key: 'all', label: 'All Updates', icon: Sparkles, color: 'text-white' },
    { key: 'general', label: 'General', icon: MessageSquare, color: 'text-blue-400' },
    { key: 'event', label: 'Events & Fests', icon: Calendar, color: 'text-purple-400' },
    { key: 'question', label: 'Help & Q&A', icon: HelpCircle, color: 'text-amber-400' },
    { key: 'hostel', label: 'Hostel Life', icon: Home, color: 'text-emerald-400' },
    { key: 'confession', label: 'Anonymous', icon: Eye, color: 'text-pink-400' },
    { key: 'lost_found', label: 'Lost & Found', icon: MapPin, color: 'text-red-400' },
    { key: 'marketplace', label: 'Marketplace', icon: ShoppingBag, color: 'text-cyan-400' },
    { key: 'announcement', label: 'Notice Board', icon: Megaphone, color: 'text-yellow-400' },
];

export default function CampusFeedPage() {
    const { user } = useUser();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [showComposer, setShowComposer] = useState(false);
    const [trending, setTrending] = useState<string[]>([]);

    useEffect(() => {
        loadPosts();
    }, [activeCategory]);

    const loadPosts = async () => {
        if (!user?.profile) return;
        setLoading(true);
        try {
            let query = insforge.database
                .from('posts')
                .select('*')
                .limit(50); // Get more candidates for ranking

            if (activeCategory !== 'all') {
                query = query.eq('category', activeCategory);
            }

            const { data } = await query;
            if (data) {
                const authorIds = [...new Set((data as Post[]).map((p) => p.author_id).filter(Boolean))];
                let profiles: Record<string, any> = {};
                if (authorIds.length > 0) {
                    const { data: pData } = await insforge.database.from('profiles').select('*').in('id', authorIds);
                    pData?.forEach(p => profiles[p.id] = p);
                }

                const enrichedPosts = (data as Post[]).map(p => ({ ...p, author: profiles[p.author_id] }));

                // APPLY RANKING ENGINE
                const ranked = RankingEngine.rankPosts(enrichedPosts, (user.profile as any), {
                    examMode: (user.profile as any)?.exam_mode || false,
                    placementMode: (user.profile as any)?.placement_status === 'preparing'
                });

                setPosts(ranked);
                setTrending(RankingEngine.getTrending(enrichedPosts));
            }
        } catch (err) { } finally { setLoading(false); }
    };


    return (
        <div className="h-full bg-campus-darker overflow-y-auto">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 py-8 lg:py-12">

                {/* Left Sidebar — Categories (Discord style) */}
                <aside className="hidden lg:col-span-3 lg:flex flex-col gap-6 sticky top-8 h-fit">
                    <div className="glass-card p-4">
                        <h3 className="text-xs font-bold text-campus-muted uppercase tracking-widest mb-4 px-2">Categories</h3>
                        <nav className="space-y-1">
                            {categories.map(cat => (
                                <button
                                    key={cat.key}
                                    onClick={() => setActiveCategory(cat.key)}
                                    className={`w-full flex items-center justify-between group px-3 py-2.5 rounded-xl transition-all ${activeCategory === cat.key ? 'bg-brand-500/10 text-brand-400' : 'text-campus-muted hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <cat.icon size={18} className={activeCategory === cat.key ? 'text-brand-400' : 'opacity-70 group-hover:opacity-100'} />
                                        <span className="text-sm font-semibold">{cat.label}</span>
                                    </div>
                                    <ChevronRight size={14} className={`opacity-0 group-hover:opacity-50 transition-all ${activeCategory === cat.key ? 'opacity-50 translate-x-1' : ''}`} />
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="glass-card p-5 bg-gradient-to-br from-brand-600/20 to-purple-600/20 shadow-glow-lg border-brand-500/20">
                        <h4 className="font-bold text-white mb-2">Campus Pioneer</h4>
                        <p className="text-xs text-brand-200/70 mb-4 leading-relaxed">Refer 5 friends to unlock the exclusive Campus Pioneer badge and 500 XP!</p>
                        <button className="w-full btn-primary py-2 text-xs rounded-lg">Invite Friends</button>
                    </div>
                </aside>

                {/* Main Feed Content (Instagram Post style) */}
                <main className="lg:col-span-6 space-y-6">
                    {/* Top Creator Bar on mobile */}
                    <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-4">
                        {categories.map(cat => (
                            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeCategory === cat.key ? 'bg-brand-500 text-white' : 'bg-campus-dark border border-white/[0.05] text-campus-muted'}`}>
                                <cat.icon size={14} /> {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Quick Post Prompt */}
                    <div onClick={() => setShowComposer(true)} className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center font-bold">
                            {(user?.profile?.display_name as string)?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 bg-white/5 rounded-full px-5 py-2.5 text-campus-muted text-sm border border-white/[0.03] group-hover:border-white/10 transition-all">
                            What's happening in Campus, {(user?.profile?.display_name as string)?.split(' ')[0] || 'Student'}?
                        </div>
                        <div className="p-2 text-brand-400 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                    </div>

                    {/* Posts List */}
                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2].map(i => <div key={i} className="h-96 w-full glass-card animate-pulse" />)}
                        </div>
                    ) : (
                        posts.map((post, idx) => (
                            <article key={post.id} className="glass-card overflow-hidden animate-slide-up group" style={{ animationDelay: `${idx * 100}ms` }}>
                                {/* Post Header */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 via-purple-500 to-pink-500 p-[2px]">
                                                <div className="w-full h-full rounded-full bg-campus-dark flex items-center justify-center overflow-hidden border-2 border-campus-dark">
                                                    {post.author?.avatar_url ? <img src={post.author.avatar_url} className="w-full h-full object-cover" /> : <span className="font-bold text-sm">{post.author?.display_name?.charAt(0) || '?'}</span>}
                                                </div>
                                            </div>
                                            {post.is_anonymous && <div className="absolute -bottom-1 -right-1 bg-gray-700 rounded-full p-1 border border-campus-dark"><Eye size={8} /></div>}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold hover:text-brand-400 cursor-pointer transition-colors">{post.is_anonymous ? 'Anonymous' : (post.author?.display_name || 'Unknown')}</h4>
                                                <span className="w-1 h-1 rounded-full bg-campus-muted/50"></span>
                                                <span className="text-[11px] text-campus-muted uppercase font-bold tracking-tighter text-brand-400/80">#{post.category}</span>
                                            </div>
                                            <p className="text-[10px] text-campus-muted flex items-center gap-1">
                                                <MapPin size={8} /> {post.author?.branch || 'Campus Hub'} • {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-white/5 rounded-full transition-colors opacity-50 hover:opacity-100">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>

                                {/* Post Content */}
                                <div className="px-5 pb-3">
                                    {post.title && <h3 className="font-bold mb-2 text-white/95">{post.title}</h3>}
                                    <p className="text-sm text-white/80 leading-relaxed">{post.content}</p>
                                </div>

                                {/* Media */}
                                {post.media_urls?.length > 0 && (
                                    <div className="aspect-square w-full bg-black/20 relative cursor-pointer group">
                                        <img src={post.media_urls[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                    </div>
                                )}

                                {/* Post Actions (Instagram style) */}
                                <div className="p-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <button className="hover:scale-110 active:scale-95 transition-all text-brand-400">
                                                    <ArrowUp size={24} />
                                                </button>
                                                <span className="text-sm font-bold">{post.upvotes - post.downvotes}</span>
                                                <button className="hover:scale-110 active:scale-95 transition-all text-campus-muted">
                                                    <ArrowDown size={24} />
                                                </button>
                                            </div>
                                            <button className="hover:scale-110 transition-transform">
                                                <MessageCircle size={24} className="text-white" />
                                            </button>
                                            <button className="hover:scale-110 transition-transform">
                                                <Share2 size={24} className="text-white" />
                                            </button>
                                        </div>
                                        <button className="hover:scale-110 transition-transform">
                                            <Bookmark size={24} />
                                        </button>
                                    </div>

                                    <div className="text-xs">
                                        <span className="font-bold">Liked by {Math.floor(Math.random() * 50)} peers</span>
                                        <p className="text-campus-muted mt-1 cursor-pointer">View all {post.comment_count || 0} comments</p>
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </main>

                {/* Right Sidebar — Trending/Community (Facebook style) */}
                <aside className="hidden lg:col-span-3 lg:flex flex-col gap-6 sticky top-8 h-fit">
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold">Trending Now</h3>
                            <TrendingUp size={16} className="text-brand-400" />
                        </div>
                        <div className="space-y-4">
                            {trending.length > 0 ? trending.map((tag, i) => (
                                <div key={tag} className="flex flex-col cursor-pointer group">
                                    <span className="text-[10px] text-campus-muted font-bold uppercase tracking-widest">#{i + 1} Trending In Feed</span>
                                    <span className="text-sm font-bold group-hover:text-brand-400 transition-colors uppercase">{tag}</span>
                                    <span className="text-[10px] text-campus-muted/60">High Engagement Velocity</span>
                                </div>
                            )) : (
                                <p className="text-xs text-campus-muted italic">Scanning trends...</p>
                            )}
                        </div>
                    </div>

                    <div className="glass-card p-5">
                        <h3 className="text-sm font-bold mb-4">Top Ambassadors</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs ring-2 ring-brand-500/30">A{i}</div>
                                        <div>
                                            <p className="text-xs font-bold">Ambassador {i}</p>
                                            <p className="text-[10px] text-brand-400 font-bold">⭐ 2.4k XP</p>
                                        </div>
                                    </div>
                                    <button className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full font-bold transition-all">Follow</button>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-2 text-[11px] font-bold text-campus-muted hover:text-white transition-colors">See Leaderboard</button>
                    </div>

                    <footer className="px-4 text-[10px] text-campus-muted/40 space-y-2">
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <a>About</a><a>Guidelines</a><a>Privacy</a><a>Terms</a><a>Safety</a>
                        </div>
                        <p>© 2026 Campusly Labs. Made with ❤️ for Students.</p>
                    </footer>
                </aside>
            </div>

            {/* Post Composer handled separately or via MainLayout Create button */}
            {showComposer && <PostComposer onClose={() => setShowComposer(false)} userId={user?.id || ''} onCreated={loadPosts} />}
        </div>
    );
}

// Inline PostComposer for now (reused from earlier logic with better UI)
function PostComposer({ onClose, userId, onCreated }: { onClose: () => void; userId: string; onCreated: () => void }) {
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('general');
    const [title, setTitle] = useState('');
    const [isAnon, setIsAnon] = useState(false);

    const handlePost = async () => {
        if (!content.trim()) return;
        const { error } = await insforge.database.from('posts').insert({
            author_id: userId,
            category,
            title: title || null,
            content: content.trim(),
            is_anonymous: isAnon
        });
        if (!error) { onCreated(); onClose(); }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-xl bg-campus-dark border border-white/[0.08] rounded-[32px] p-6 shadow-premium animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-brand-400" />
                        <h2 className="text-xl font-bold">New Campus Post</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-campus-muted hover:text-white">✕</button>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                        {categories.filter(c => c.key !== 'all').map(c => (
                            <button key={c.key} onClick={() => setCategory(c.key)} className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${category === c.key ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-white/5 text-campus-muted border border-transparent'}`}>
                                <c.icon size={12} /> {c.label}
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        placeholder="Add a catchy title (optional)"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-brand-500 transition-all outline-none"
                    />

                    <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm focus:border-brand-500 transition-all outline-none min-h-[160px] resize-none"
                        placeholder="What's happening? Share events, questions or market items..."
                        autoFocus
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-brand-400 transition-colors"><Image size={20} /></button>
                            <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-purple-400 transition-colors"><Calendar size={20} /></button>
                            <label className="flex items-center gap-2 cursor-pointer group ml-2">
                                <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} className="rounded bg-white/5 border-white/10 text-brand-500 focus:ring-brand-500" />
                                <span className="text-xs text-campus-muted group-hover:text-white transition-colors">Post Anonymously</span>
                            </label>
                        </div>
                        <button
                            onClick={handlePost}
                            className="btn-primary py-2.5 px-8 rounded-2xl text-sm"
                        >
                            Publish Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
