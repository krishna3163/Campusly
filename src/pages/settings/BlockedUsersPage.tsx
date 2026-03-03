import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import {
    ChevronLeft,
    UserX,
    Trash2,
    Search
} from 'lucide-react';
import { insforge } from '../../lib/insforge';
import { useAppStore } from '../../stores/appStore';

interface BlockedUser {
    id: string;
    blocked_id: string;
    profile: {
        display_name: string;
        avatar_url: string;
        branch: string;
    };
}

export default function BlockedUsersPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { showToast } = useAppStore();
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadBlockedUsers();
    }, []);

    const loadBlockedUsers = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { data } = await insforge.database
                .from('blocked_users')
                .select('*, profile:profiles!blocked_users_blocked_id_fkey(*)')
                .eq('user_id', user.id);
            setBlockedUsers(data || []);
        } catch {
            // Table may not exist yet
            setBlockedUsers([]);
        }
        setLoading(false);
    };

    const handleUnblock = async (blockedId: string) => {
        if (!user?.id) return;
        try {
            await insforge.database
                .from('blocked_users')
                .delete()
                .eq('user_id', user.id)
                .eq('blocked_id', blockedId);
            setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));
            showToast('User unblocked.', 'success');
        } catch {
            showToast('Failed to unblock user.', 'error');
        }
    };

    const filtered = blockedUsers.filter(b =>
        b.profile?.display_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="h-full bg-[var(--background)] flex flex-col overflow-hidden">
            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 flex items-center gap-3 shrink-0">
                <button onClick={() => navigate(-1)} className="text-[#007AFF] flex items-center gap-1">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[17px] font-bold text-[var(--foreground)]">Blocked Users</h1>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search blocked users..."
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-[15px] text-[var(--foreground)] outline-none focus:border-[#007AFF]/30"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <UserX size={48} className="text-[var(--foreground-muted)] mb-4 opacity-30" />
                        <h3 className="text-[17px] font-bold text-[var(--foreground)] mb-1">No Blocked Users</h3>
                        <p className="text-[13px] text-[var(--foreground-muted)]">You haven't blocked anyone.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(b => (
                            <div key={b.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[var(--background)] overflow-hidden shrink-0">
                                    {b.profile?.avatar_url ? (
                                        <img src={b.profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[var(--foreground-muted)]">
                                            {b.profile?.display_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[16px] font-semibold text-[var(--foreground)] truncate">{b.profile?.display_name}</p>
                                    <p className="text-[12px] text-[var(--foreground-muted)]">{b.profile?.branch}</p>
                                </div>
                                <button
                                    onClick={() => handleUnblock(b.blocked_id)}
                                    className="px-4 py-2 bg-[#FF3B30]/10 text-[#FF3B30] rounded-xl text-[13px] font-bold flex items-center gap-1.5"
                                >
                                    <Trash2 size={14} /> Unblock
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
