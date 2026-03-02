import { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import Toast from '../ui/Toast';
import {
    MessageSquare,
    BookOpen,
    LayoutDashboard,
    Briefcase,
    User,
    Hexagon,
    Bell,
    X,
} from 'lucide-react';

export default function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { examMode } = useAppStore();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Mesh update synced', time: 'Just now', read: false },
        { id: 2, title: 'Assignment Node Active', time: '2 hours ago', read: false }
    ]);

    const navItems = [
        { id: 'chats', label: 'Messages', icon: MessageSquare, path: '/app/chats' },
        { id: 'feed', label: 'Campus', icon: LayoutDashboard, path: '/app/feed', hideInExam: true },
        { id: 'study', label: 'Study', icon: BookOpen, path: '/app/study' },
        { id: 'placement', label: 'Placement', icon: Briefcase, path: '/app/placement' },
        { id: 'profile', label: 'Profile', icon: User, path: '/app/profile' },
    ];

    const isChatScreen = location.pathname.startsWith('/app/chats/') && location.pathname !== '/app/chats' && location.pathname !== '/app/chats/';

    return (
        <div className="flex flex-col h-screen bg-[#F2F2F7] text-black overflow-hidden font-sans select-none">
            {/* Header */}
            {!isChatScreen && (
                <header className="ios-header safe-top">
                    <div className="flex items-center gap-2">
                        <Hexagon className="text-[#007AFF] fill-current" size={20} />
                        <h1 className="ios-title">Campusly</h1>
                    </div>
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="p-2 relative active:opacity-50 transition-opacity"
                    >
                        <Bell size={22} strokeWidth={1.5} className="text-[#000000]" />
                        {notifications.length > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF3B30] border-2 border-white rounded-full"></span>
                        )}
                    </button>
                </header>
            )}

            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto custom-scrollbar relative bg-white ${!isChatScreen ? 'pb-20' : ''}`}>
                <Outlet />
                <Toast />
            </main>

            {/* iOS Bottom Tab Bar */}
            {!isChatScreen && (
                <nav className="ios-tab-bar safe-bottom">
                    {navItems.map((item) => (
                        (!item.hideInExam || !examMode) && (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex flex-col items-center justify-center py-1 flex-1 transition-all ${location.pathname.startsWith(item.path)
                                    ? 'text-[#007AFF]'
                                    : 'text-[#8E8E93]'
                                    }`}
                            >
                                <item.icon size={26} strokeWidth={location.pathname.startsWith(item.path) ? 2.5 : 1.5} />
                            </Link>
                        )
                    ))}
                </nav>
            )}

            {/* iOS Style Sheet (Modal) */}
            {isNotificationsOpen && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in flex items-end justify-center" onClick={() => setIsNotificationsOpen(false)}>
                    <div
                        className="w-full max-w-[430px] bg-[#F2F2F7] rounded-t-[20px] pb-10 animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1.5 bg-[#BCBCC0] rounded-full mx-auto my-3" />
                        <div className="px-5 py-4 flex justify-between items-center bg-white border-b border-[#E5E5EA]">
                            <h3 className="text-[17px] font-bold">Notifications</h3>
                            <button onClick={() => setIsNotificationsOpen(false)} className="ios-btn-blue text-[17px] font-semibold">Done</button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto space-y-0.5 mt-4 px-4">
                            {notifications.length === 0 ? (
                                <div className="py-20 text-center text-[#8E8E93] text-[15px]">No new notifications</div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className="ios-card rounded-2xl mb-2 border-none">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="ios-headline text-[#000000]">{n.title}</p>
                                                <p className="ios-caption mt-1">{n.time}</p>
                                            </div>
                                            {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-[#007AFF]"></div>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <div className="p-6 flex justify-center">
                                <button onClick={() => setNotifications([])} className="text-[#FF3B30] text-[15px] font-semibold">Clear All</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
