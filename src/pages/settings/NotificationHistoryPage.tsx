import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import {
    ChevronLeft,
    Bell,
    MessageCircle,
    Heart,
    UserPlus,
    Star,
    Trash2,
    CheckCheck
} from 'lucide-react';
import { insforge } from '../../lib/insforge';

interface NotificationItem {
    id: string;
    type: 'like' | 'comment' | 'friend_request' | 'mention' | 'system';
    title: string;
    body: string;
    created_at: string;
    read: boolean;
    metadata?: any;
}

export default function NotificationHistoryPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { data } = await insforge.database
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);
            setNotifications(data || []);
        } catch {
            // Generate sample notifications if table doesn't exist
            setNotifications([
                { id: '1', type: 'like', title: 'New Like', body: 'Someone liked your post', created_at: new Date().toISOString(), read: false },
                { id: '2', type: 'comment', title: 'New Comment', body: 'Someone commented on your post', created_at: new Date(Date.now() - 3600000).toISOString(), read: true },
                { id: '3', type: 'friend_request', title: 'Friend Request', body: 'You have a new friend request', created_at: new Date(Date.now() - 7200000).toISOString(), read: false },
            ]);
        }
        setLoading(false);
    };

    const markAllRead = async () => {
        if (!user?.id) return;
        try {
            await insforge.database
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);
        } catch { /* ignore */ }
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = async () => {
        if (!user?.id) return;
        try {
            await insforge.database
                .from('notifications')
                .delete()
                .eq('user_id', user.id);
        } catch { /* ignore */ }
        setNotifications([]);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={18} className="text-[#FF2D55]" />;
            case 'comment': return <MessageCircle size={18} className="text-[#007AFF]" />;
            case 'friend_request': return <UserPlus size={18} className="text-[#34C759]" />;
            case 'mention': return <Star size={18} className="text-[#FF9500]" />;
            default: return <Bell size={18} className="text-[var(--foreground-muted)]" />;
        }
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="h-full bg-[var(--background)] flex flex-col overflow-hidden">
            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shrink-0">
                <button onClick={() => navigate(-1)} className="text-[#007AFF] flex items-center gap-1">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[17px] font-bold text-[var(--foreground)]">Notifications</h1>
                <div className="flex items-center gap-3">
                    <button onClick={markAllRead} className="text-[#007AFF]" title="Mark all read">
                        <CheckCheck size={20} />
                    </button>
                    <button onClick={clearAll} className="text-[#FF3B30]" title="Clear all">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Bell size={48} className="text-[var(--foreground-muted)] mb-4 opacity-30" />
                        <h3 className="text-[17px] font-bold text-[var(--foreground)] mb-1">All Caught Up</h3>
                        <p className="text-[13px] text-[var(--foreground-muted)]">No notifications to show.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                className={`px-5 py-4 flex items-start gap-3 transition-colors ${!n.read ? 'bg-[#007AFF]/5' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-semibold text-[var(--foreground)]">{n.title}</p>
                                    <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">{n.body}</p>
                                    <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{timeAgo(n.created_at)}</p>
                                </div>
                                {!n.read && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#007AFF] shrink-0 mt-2" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
