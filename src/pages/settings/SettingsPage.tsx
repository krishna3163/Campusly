import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@insforge/react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Shield,
    Lock,
    MessageSquare,
    Rss,
    BookOpen,
    Briefcase,
    FileUser,
    Bell,
    Palette,
    Accessibility,
    Database,
    Zap,
    ShieldAlert,
    FileText,
    Search,
    ChevronRight,
    LogOut,
    ExternalLink,
    ChevronLeft,
    RotateCcw
} from 'lucide-react';
import { SettingItemRow } from '../../components/settings/SettingItemRow';
import { useSettingsStore } from '../../stores/settingsStore';
import { deleteCookie } from '../../utils/cookie';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap: Record<string, React.ComponentType<any>> = {
    User, Shield, Lock, MessageSquare, Rss, BookOpen, Briefcase, FileUser, Bell, Palette, Accessibility, Database, Zap, ShieldAlert, FileText
};

export default function SettingsPage() {
    const { user } = useUser();
    const { signOut } = useAuth();
    const { categories, searchQuery, setSearchQuery, init, isInitialized } = useSettingsStore();
    const navigate = useNavigate();
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        if (user?.id) init(user.id);
    }, [user?.id, init]);

    // Simulate mesh sync when items are updated (or on load)
    useEffect(() => {
        if (isInitialized) {
            setSyncing(true);
            const timer = setTimeout(() => setSyncing(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isInitialized]);

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await signOut();
            deleteCookie('campusly_user_id');
            deleteCookie('campusly_user_name');
            deleteCookie('campusly_user_avatar');
            navigate('/login');
        }
    };

    if (!isInitialized) {
        return (
            <div className="flex-1 h-full bg-[var(--background)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const filteredCategories = categories.filter(cat =>
        cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.items.some(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const currentCategory = categories.find(c => c.id === activeCategoryId);

    return (
        <div className="flex-1 h-full bg-[var(--background)] flex flex-col overflow-hidden relative">
            {/* iOS Status Bar Placeholder / Header Area */}
            <div className="pt-12 pb-4 px-6 sticky top-0 bg-[var(--background)]/80 backdrop-blur-xl z-20 border-b border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                    {activeCategoryId ? (
                        <button
                            onClick={() => setActiveCategoryId(null)}
                            className="flex items-center gap-1 text-[var(--brand)] font-semibold active:opacity-50 transition-opacity"
                        >
                            <ChevronLeft size={24} />
                            <span>Settings</span>
                        </button>
                    ) : (
                        <h1 className="text-[34px] font-bold text-[var(--foreground)] tracking-tight">Settings</h1>
                    )}
                    <div className="flex items-center gap-3">
                        <AnimatePresence>
                            {syncing && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-2 px-3 py-1 bg-[var(--brand)]/10 border border-[var(--brand)]/20 rounded-full"
                                >
                                    <RotateCcw size={12} className="text-[var(--brand)] animate-spin" />
                                    <span className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-widest">Mesh Syncing...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {!activeCategoryId && (
                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 overflow-hidden shadow-inner flex items-center justify-center">
                                {user?.profile?.avatar_url ? (
                                    <img src={user.profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <User size={18} className="text-campus-muted" />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {!activeCategoryId && (
                    <div className="relative group/search">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] group-focus-within/search:text-[var(--brand)] transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--border)]/60 border-none rounded-[10px] pl-10 pr-4 py-2.5 text-[17px] focus:ring-2 focus:ring-[var(--brand)]/50 outline-none transition-all placeholder:text-[var(--foreground-muted)] text-[var(--foreground)]"
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pt-4 pb-20 custom-scrollbar px-4 space-y-8">
                <AnimatePresence mode="wait">
                    {!activeCategoryId ? (
                        <motion.div
                            key="category-list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Profile Preview Row - iOS style */}
                            <button
                                onClick={() => setActiveCategoryId('account')}
                                className="w-full h-[88px] flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl hover:bg-white/[0.06] transition-all group"
                            >
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex-shrink-0 items-center justify-center flex text-2xl font-black text-white shadow-glow">
                                    {String((user?.profile as any)?.display_name || 'U').charAt(0)}
                                </div>
                                <div className="flex-1 text-left">
                                    <h2 className="text-[20px] font-semibold text-white tracking-tight">{(user?.profile as any)?.display_name || 'Campus Student'}</h2>
                                    <p className="text-[13px] text-gray-500 truncate">Account, Cloud Mesh, Media</p>
                                </div>
                                <ChevronRight size={20} className="text-gray-600" />
                            </button>

                            {/* Settings Groups */}
                            <div className="space-y-[1px] bg-white/[0.03] rounded-2xl overflow-hidden border border-white/5">
                                {filteredCategories.map(cat => {
                                    if (cat.id === 'account') return null; // Already shown above
                                    const Icon = iconMap[cat.icon] || Shield;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategoryId(cat.id)}
                                            className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/[0.08] transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${getIconBg(cat.id)}`}>
                                                    <Icon size={18} />
                                                </div>
                                                <span className="text-[17px] text-white/95 font-medium">{cat.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {cat.id === 'performance' && <span className="text-[14px] text-gray-500 font-medium">Hyper</span>}
                                                <ChevronRight size={18} className="text-gray-600/40" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-[1px] bg-white/[0.03] rounded-2xl overflow-hidden border border-white/5">
                                <button
                                    onClick={() => navigate('/app/settings/developer')}
                                    className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/[0.08] transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-600 flex items-center justify-center text-white">
                                            <Zap size={18} />
                                        </div>
                                        <span className="text-[17px] text-white/95 font-medium">Developer Mode</span>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-600/40" />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center p-4 bg-transparent hover:bg-white/5 active:bg-white/[0.08] transition-all text-red-500 font-medium text-[17px]"
                                >
                                    Sign Out
                                </button>
                            </div>

                            <div className="text-center pb-12">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Campusly v4.0.2-mesh</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="category-content"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-10"
                        >
                            <div className="pt-2 px-2">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[32px] font-bold text-white mb-2 leading-tight">{currentCategory?.title}</h2>
                                    <button
                                        onClick={() => setActiveCategoryId(null)}
                                        className="text-[15px] font-semibold text-brand-500 active:opacity-50"
                                    >
                                        Close Dialog
                                    </button>
                                </div>
                                <p className="text-[15px] text-gray-400 font-medium">
                                    {getCategoryDescription(currentCategory?.id)}
                                </p>
                            </div>

                            <div className="space-y-0.5">
                                <div className="bg-white/[0.03] rounded-3xl overflow-hidden border border-white/5">
                                    {currentCategory?.items.map((item, idx) => (
                                        <SettingItemRow
                                            key={item.id}
                                            categoryId={activeCategoryId!}
                                            item={item}
                                            isLast={idx === (currentCategory!.items.length - 1)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {activeCategoryId === 'account' && (
                                <div className="mt-12 space-y-4 px-2">
                                    <p className="text-[13px] text-gray-500 px-4 uppercase tracking-[0.2em] font-black">Digital Signature</p>
                                    <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/5 text-center shadow-xl backdrop-blur-sm">
                                        <div className="w-24 h-24 rounded-full mx-auto mb-6 bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-glow-lg border-4 border-white/10">
                                            {String((user?.profile as any)?.display_name || 'U').charAt(0)}
                                        </div>
                                        <h4 className="text-2xl font-black mb-1 text-white tracking-tight">{(user?.profile as any)?.display_name || 'Campus Student'}</h4>
                                        <p className="text-[14px] text-campus-muted mb-8 font-medium">{user?.email}</p>
                                        <button className="w-full py-4 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-glow hover:shadow-glow-lg">Update Profile Identity</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function getCategoryDescription(id: string | undefined) {
    switch (id) {
        case 'privacy':
        case 'security':
            return 'Managing your privacy & security preferences. Syncing with local mesh...';
        case 'notifications':
            return 'Managing your push notifications preferences. Syncing with local mesh...';
        case 'appearance':
            return 'Managing your aesthetics preferences. Syncing with local mesh...';
        default:
            return 'Manage your preferences and sync them across your devices via local mesh.';
    }
}

function getIconBg(id: string) {
    const map: Record<string, string> = {
        account: 'bg-blue-500',
        privacy: 'bg-emerald-500',
        security: 'bg-amber-500',
        chat: 'bg-indigo-500',
        feed: 'bg-orange-500',
        study: 'bg-purple-500',
        placement: 'bg-rose-500',
        resume: 'bg-sky-500',
        notifications: 'bg-red-500',
        appearance: 'bg-pink-500',
        accessibility: 'bg-blue-600',
        data: 'bg-gray-600',
        performance: 'bg-cyan-500',
        moderation: 'bg-indigo-700',
        legal: 'bg-neutral-500'
    };
    return map[id] || 'bg-brand-500';
}
