import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    TrendingUp,
    Hash,
    Users,
    ChevronRight,
    Sparkles,
    Flame,
    Compass,
    Loader2
} from 'lucide-react';
import { useUser } from '@insforge/react';
import { FeedService } from '../../services/feedService';
import { UserService } from '../../services/userService';
import { useDebounce } from '../../hooks/useDebounce';

const SUGGESTED_COMMUNITIES = [
    { name: 'Coding Hub', members: '1.5k', icon: '💻' },
    { name: 'Photography Club', members: '800', icon: '📸' },
    { name: 'Sports Arena', members: '2.2k', icon: '⚽' },
    { name: 'Anime Society', members: '1.1k', icon: '✨' },
    { name: 'Music Jam', members: '950', icon: '🎸' }
];

export default function ExplorePage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 300);
    const [recentPosts, setRecentPosts] = useState<any[]>([]);
    const [trendingTags, setTrendingTags] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<{ users: any[], posts: any[] }>({ users: [], posts: [] });
    const [searchMode, setSearchMode] = useState<'users' | 'posts'>('posts');
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const campusId = (user?.profile as any)?.campus_id || 'befcc309-623b-47eb-b3f3-83911eae09c7';

    useEffect(() => {
        loadDiscoveryContent();
    }, []);

    useEffect(() => {
        if (debouncedQuery.trim()) {
            performSearch();
        } else {
            setSearchResults({ users: [], posts: [] });
        }
    }, [debouncedQuery]);

    const performSearch = async () => {
        setSearching(true);
        const [usersRes, postsRes] = await Promise.all([
            UserService.searchProfiles(debouncedQuery, campusId),
            FeedService.getFeed(campusId, 'all', 10, 0, debouncedQuery.startsWith('#') ? debouncedQuery : undefined)
        ]);

        // If not a hashtag search, we should probably search content too
        // For now, getFeed with offset 0 and query works if we update it, but let's keep it simple
        setSearchResults({
            users: usersRes.data || [],
            posts: postsRes.data || []
        });
        setSearching(false);
    };

    const loadDiscoveryContent = async () => {
        setLoading(true);
        const [postsRes, tagsRes] = await Promise.all([
            FeedService.getFeed(campusId, 'all', 5, 0),
            FeedService.getTrendingHashtags(6)
        ]);
        setRecentPosts(postsRes.data || []);
        setTrendingTags(tagsRes.data || []);
        setLoading(false);
    };

    const handleHashtagClick = (tag: string) => {
        // For now, navigate back to feed with hashtag filter
        navigate('/app/campus', { state: { hashtag: tag } });
    };

    return (
        <div className="h-full bg-[var(--background)] flex flex-col overflow-hidden animate-fade-in">
            {/* Search Header */}
            <div className="bg-[var(--surface)] px-4 pt-4 pb-2 border-b border-[var(--border)]">
                <div className="relative group">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] group-focus-within:text-[#007AFF] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search posts, hashtags, or users..."
                        className="w-full bg-[var(--background)] border border-transparent focus:border-[#007AFF]/30 rounded-2xl px-10 py-3 text-[15px] focus:outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {(searching || searchQuery) && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                            {searching ? <Loader2 size={16} className="animate-spin" /> : '×'}
                        </button>
                    )}
                </div>

                {searchQuery.trim() && (
                    <div className="flex gap-4 mt-4 px-2">
                        <button
                            onClick={() => setSearchMode('posts')}
                            className={`pb-2 text-sm font-bold transition-all border-b-2 ${searchMode === 'posts' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-[var(--foreground-muted)]'}`}
                        >
                            Posts
                        </button>
                        <button
                            onClick={() => setSearchMode('users')}
                            className={`pb-2 text-sm font-bold transition-all border-b-2 ${searchMode === 'users' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-[var(--foreground-muted)]'}`}
                        >
                            Users
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-10">
                {searchQuery.trim() ? (
                    <section className="px-5 space-y-4">
                        {searchMode === 'posts' ? (
                            searchResults.posts.length > 0 ? (
                                searchResults.posts.map(post => renderPostCard(post))
                            ) : (
                                <p className="text-center py-10 text-[var(--foreground-muted)] font-medium italic">No matches in the mesh.</p>
                            )
                        ) : (
                            searchResults.users.length > 0 ? (
                                searchResults.users.map(u => renderUserCard(u))
                            ) : (
                                <p className="text-center py-10 text-[var(--foreground-muted)] font-medium italic">No students found matching your signal.</p>
                            )
                        )}
                    </section>
                ) : (
                    <>
                        {/* Trending Tags */}
                        <section className="mb-8">
                            <div className="px-5 mb-3 flex items-center justify-between">
                                <h4 className="text-[13px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                    <Hash size={16} className="text-[#007AFF]" /> Trending Now
                                </h4>
                                <button className="text-[13px] font-semibold text-[#007AFF]">See All</button>
                            </div>
                            <div className="flex flex-wrap gap-2 px-5">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="w-24 h-10 bg-[var(--surface-low)] animate-pulse rounded-2xl" />
                                    ))
                                ) : trendingTags.length > 0 ? (
                                    trendingTags.map((item) => (
                                        <button
                                            key={item.tag}
                                            onClick={() => handleHashtagClick(item.tag)}
                                            className="bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 rounded-2xl flex flex-col items-start active:scale-95 transition-all hover:border-[#007AFF]/30"
                                        >
                                            <span className="text-[15px] font-bold text-[var(--foreground)]">{item.tag}</span>
                                            <span className="text-[11px] text-[var(--foreground-muted)] font-medium">{item.count}</span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-[13px] text-[var(--foreground-muted)]">No trending tags today.</p>
                                )}
                            </div>
                        </section>

                        {/* Suggested Communities */}
                        <section className="mb-8">
                            <div className="px-5 mb-3">
                                <h4 className="text-[13px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                    <Compass size={16} className="text-[#34C759]" /> Suggested Communities
                                </h4>
                            </div>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar px-5 pb-2">
                                {SUGGESTED_COMMUNITIES.map((comm) => (
                                    <div
                                        key={comm.name}
                                        className="shrink-0 w-40 bg-[var(--surface)] p-4 rounded-[24px] border border-[var(--border)] flex flex-col items-center text-center shadow-sm"
                                    >
                                        <div className="text-3xl mb-2">{comm.icon}</div>
                                        <h5 className="text-[14px] font-bold text-[var(--foreground)] line-clamp-1">{comm.name}</h5>
                                        <p className="text-[11px] text-[var(--foreground-muted)] mb-3">{comm.members} members</p>
                                        <button className="w-full py-1.5 bg-[#007AFF]/10 text-[#007AFF] text-[12px] font-bold rounded-xl active:bg-[#007AFF]/20 transition-all">
                                            Join
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Hot Discussions (Recent Posts) */}
                        <section>
                            <div className="px-5 mb-3 flex items-center justify-between">
                                <h4 className="text-[13px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                    <TrendingUp size={16} className="text-[#FF3B30]" /> Hot Discussions
                                </h4>
                            </div>
                            <div className="px-5 space-y-3">
                                {recentPosts.map((post) => (
                                    <button
                                        key={post.id}
                                        onClick={() => navigate(`/app/campus/post/${post.id}`)}
                                        className="w-full bg-[var(--surface)] p-4 rounded-[20px] border border-[var(--border)] flex items-start gap-3 hover:bg-[var(--background)] transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[var(--background)] overflow-hidden shrink-0">
                                            <img
                                                src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.display_name}`}
                                                className="w-full h-full object-cover"
                                                alt=""
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h6 className="text-[14px] font-bold text-[var(--foreground)] truncate">
                                                {post.author?.display_name}
                                            </h6>
                                            <p className="text-[13px] text-[var(--foreground-muted)] line-clamp-2 leading-snug mt-0.5">
                                                {post.content}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--foreground-muted)] font-medium">
                                                <span className="flex items-center gap-1"><Flame size={12} className="text-[#FF9500]" /> {post.likes_count || 0}</span>
                                                <span>{post.comments_count || 0} comments</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-[var(--border)] group-hover:text-[var(--foreground-muted)] transition-colors self-center" />
                                    </button>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );

    function renderPostCard(post: any) {
        return (
            <button
                key={post.id}
                onClick={() => navigate(`/app/campus/post/${post.id}`)}
                className="w-full bg-[var(--surface)] p-4 rounded-[20px] border border-[var(--border)] flex items-start gap-3 hover:bg-[var(--background)] transition-all text-left group"
            >
                <div className="w-10 h-10 rounded-full bg-[var(--background)] overflow-hidden shrink-0">
                    <img
                        src={post.author?.avatar_url || `https://ui-avatars.com/api/?name=${post.author?.display_name}`}
                        className="w-full h-full object-cover"
                        alt=""
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h6 className="text-[14px] font-bold text-[var(--foreground)] truncate">
                        {post.author?.display_name}
                    </h6>
                    <p className="text-[13px] text-[var(--foreground-muted)] line-clamp-2 leading-snug mt-0.5">
                        {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--foreground-muted)] font-medium">
                        <span className="flex items-center gap-1"><Flame size={12} className="text-[#FF9500]" /> {post.likes_count || 0}</span>
                        <span>{post.comments_count || 0} comments</span>
                    </div>
                </div>
                <ChevronRight size={16} className="text-[var(--border)] group-hover:text-[var(--foreground-muted)] transition-colors self-center" />
            </button>
        );
    }

    function renderUserCard(u: any) {
        return (
            <button
                key={u.id}
                onClick={() => navigate(`/app/profile/${u.id}`)}
                className="w-full bg-[var(--surface)] p-4 rounded-[20px] border border-[var(--border)] flex items-center gap-4 hover:bg-[var(--background)] transition-all group shadow-sm"
            >
                <div className="w-12 h-12 rounded-[18px] bg-brand-500 overflow-hidden shrink-0 shadow-glow-sm">
                    {u.avatar_url ? (
                        <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-black text-xl">
                            {u.display_name?.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h6 className="text-[16px] font-bold text-[var(--foreground)] truncate flex items-center gap-2">
                        {u.display_name}
                    </h6>
                    <p className="text-[12px] text-[var(--foreground-muted)] font-medium">
                        {u.branch} • Sem {u.semester}
                    </p>
                </div>
                <ChevronRight size={18} className="text-[var(--border)] group-hover:text-[#007AFF] transition-colors" />
            </button>
        );
    }
}
