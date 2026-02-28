import { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import SyncStatusBadge from '../ui/SyncStatusBadge';
import ExamModeWidget from '../ui/ExamModeWidget';
import Toast from '../ui/Toast';
import {
    MessageSquare,
    BookOpen,
    LayoutDashboard,
    Briefcase,
    User,
    Plus,
    Hexagon,
    Bell,
    X,
    MessageCircle,
    FileText,
    Users,
    Radio,
    Code2,
} from 'lucide-react';

export default function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { examMode } = useAppStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New system update', time: 'Just now', read: false },
        { id: 2, title: 'Assignment Reminder', time: '2 hours ago', read: false }
    ]);

    const clearNotifications = () => {
        setNotifications([]);
    };

    // Navigation configuration - MAXIMUM 5 TABS
    const navItems = [
        { id: 'chats', label: 'Chats', icon: MessageSquare, path: '/app/chats' },
        { id: 'feed', label: 'Campus', icon: LayoutDashboard, path: '/app/feed', hideInExam: true },
        { id: 'study', label: 'Study', icon: BookOpen, path: '/app/study' },
        { id: 'placement', label: 'Placement', icon: Briefcase, path: '/app/placement' },
        { id: 'profile', label: 'Profile', icon: User, path: '/app/profile' },
    ];

    const isChatPath = location.pathname.startsWith('/app/chats/');

    return (
        <div className="flex h-[100dvh] bg-campus-darker text-white overflow-hidden font-sans">

            {/* Desktop Side Rail — Refined minimalist design */}
            <aside className="hidden md:flex flex-col items-center w-20 lg:w-64 bg-campus-dark border-r border-campus-border/30 z-50 py-8 transition-all duration-300 overflow-y-auto shrink-0 shadow-elevation-2">

                {/* Logo Section */}
                <div className="mb-10 lg:px-6 w-full flex justify-center lg:justify-start items-center gap-3 relative animate-fade-in">
                    <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-elevation-3 shrink-0">
                        <Hexagon className="text-white fill-current" size={24} />
                    </div>
                    <span className="hidden lg:block text-[18px] font-bold tracking-tight text-white">Campusly</span>

                    {/* Notification Bell */}
                    <div className="relative ml-auto lg:ml-0">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className={`p-2.5 rounded-[10px] transition-all duration-300 ${isNotificationsOpen ? 'bg-brand-500/20 text-brand-400' : 'hover:bg-white/[0.08] text-campus-muted hover:text-white'}`}
                        >
                            <Bell size={20} strokeWidth={1.5} />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>

                        {/* Notifications Dropdown - Simplified */}
                        {isNotificationsOpen && (
                            <>
                                <div className="fixed inset-0 z-[100]" onClick={() => setIsNotificationsOpen(false)}></div>
                                <div className="absolute top-full left-0 mt-2 w-80 bg-campus-card/90 backdrop-blur-xl border border-campus-border/50 rounded-[16px] shadow-elevation-3 z-[101] overflow-hidden flex flex-col animate-slide-down">
                                    <div className="p-4 border-b border-campus-border/30 flex justify-between items-center">
                                        <h3 className="font-bold text-[16px]">Notifications</h3>
                                        <button onClick={clearNotifications} className="p-1 hover:bg-white/[0.1] rounded-[8px] text-red-400 transition-all text-[12px]">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-campus-muted text-[13px]">No notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} className={`p-4 border-b border-campus-border/20 hover:bg-white/[0.03] cursor-pointer transition-all ${!n.read ? 'bg-brand-500/5' : ''}`}>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className={`text-[14px] ${!n.read ? 'font-semibold text-white' : 'text-campus-muted'}`}>{n.title}</span>
                                                        {!n.read && <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0"></div>}
                                                    </div>
                                                    <span className="text-[12px] text-campus-muted/60">{n.time}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Navigation — Clean 5-tab structure */}
                <nav className="flex-1 w-full space-y-1 lg:space-y-2 lg:px-3 pt-8">
                    {navItems.map((item) => (
                        (!item.hideInExam || !examMode) && (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-[12px] transition-all duration-300 group relative nav-item-smooth ${location.pathname.startsWith(item.path)
                                    ? 'bg-brand-500/15 text-brand-400 font-semibold border border-brand-500/20'
                                    : 'text-campus-muted hover:text-white hover:bg-white/[0.05]'
                                    }`}
                            >
                                <item.icon size={22} strokeWidth={1.5} className={`shrink-0 transition-all duration-300 group-hover:scale-110`} />
                                <span className="hidden lg:block text-[15px] leading-tight">{item.label}</span>

                                {/* Mobile indicator - left accent bar */}
                                {location.pathname.startsWith(item.path) && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full lg:hidden animate-slide-right" />
                                )}
                            </Link>
                        )
                    ))}
                </nav>

                {/* Bottom Action - Create New only */}
                <div className="w-full lg:px-3 pt-8 border-t border-campus-border/20">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 rounded-[12px] bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold transition-all duration-300 shadow-elevation-2 hover:shadow-elevation-3 active:scale-95 group animate-fade-in"
                    >
                        <Plus size={22} strokeWidth={2} className="shrink-0 transition-transform duration-300 group-hover:rotate-90" />
                        <span className="hidden lg:block text-[14px]">Create</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">

                {/* Global Desktop Header Widgets — Sync, Exam, Group, Status, Developer, Toast */}
                <div className="hidden md:flex absolute top-6 right-8 z-40 items-center gap-3">
                    <SyncStatusBadge />
                    <ExamModeWidget />
                    <Link to="/app/chats" state={{ tab: 'groups' }} className="p-2.5 rounded-[10px] hover:bg-white/[0.08] text-campus-muted hover:text-white transition-all" title="Groups">
                        <Users size={20} strokeWidth={1.5} />
                    </Link>
                    <Link to="/app/status" className="p-2.5 rounded-[10px] hover:bg-white/[0.08] text-campus-muted hover:text-white transition-all" title="Status">
                        <Radio size={20} strokeWidth={1.5} />
                    </Link>
                    <Link to="/app/settings/developer" className="p-2.5 rounded-[10px] hover:bg-white/[0.08] text-campus-muted hover:text-brand-400 transition-all" title="Developer">
                        <Code2 size={20} strokeWidth={1.5} />
                    </Link>
                    <Toast />
                </div>

                <main className="flex-1 overflow-hidden relative">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation — Clean 5-tab design */}
                <nav className={`md:hidden flex safe-bottom bg-campus-darker/95 backdrop-blur-xl border-t border-campus-border/30 z-50 transition-all duration-300 ${isChatPath ? 'h-0 opacity-0 overflow-hidden' : 'h-[76px] opacity-100'}`}>
                    {navItems.map((item) => (
                        (!item.hideInExam || !examMode) && (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 py-2 nav-item-smooth ${location.pathname.startsWith(item.path) ? 'text-brand-400 scale-105' : 'text-campus-muted hover:text-white'
                                    }`}
                            >
                                <item.icon size={24} strokeWidth={1.5} />
                                <span className={`text-[10px] font-medium leading-tight tracking-wide ${location.pathname.startsWith(item.path) ? 'font-semibold' : ''}`}>{item.label}</span>
                            </Link>
                        )
                    ))}
                </nav>
            </div>

            {/* Global Create Modal — Simplified */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsCreateOpen(false)}>
                    <div className="glass-card p-8 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-[20px] font-bold">Quick Create</h2>
                            <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-[10px] hover:bg-white/[0.1] text-campus-muted hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => { setIsCreateOpen(false); navigate('/app/chats'); }}
                                className="flex items-center gap-4 p-4 rounded-[12px] bg-white/[0.05] hover:bg-brand-500/10 border border-campus-border/50 hover:border-brand-500/40 transition-all duration-300 text-left group active:scale-95"
                            >
                                <div className="p-3 rounded-[10px] bg-brand-500/15 text-brand-400 group-hover:scale-110 transition-all duration-300">
                                    <MessageCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-white">New Chat</p>
                                    <p className="text-[12px] text-campus-muted">Encrypted messaging</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { setIsCreateOpen(false); navigate('/app/study'); }}
                                className="flex items-center gap-4 p-4 rounded-[12px] bg-white/[0.05] hover:bg-campus-accent/10 border border-campus-border/50 hover:border-campus-accent/40 transition-all duration-300 text-left group active:scale-95"
                            >
                                <div className="p-3 rounded-[10px] bg-campus-accent/15 text-campus-accent group-hover:scale-110 transition-all duration-300">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-white">Study Task</p>
                                    <p className="text-[12px] text-campus-muted">Add exam or assignment</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { setIsCreateOpen(false); navigate('/app/feed'); }}
                                className="flex items-center gap-4 p-4 rounded-[12px] bg-white/[0.05] hover:bg-emerald-500/10 border border-campus-border/50 hover:border-emerald-500/40 transition-all duration-300 text-left group active:scale-95"
                            >
                                <div className="p-3 rounded-[10px] bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-all duration-300">
                                    <LayoutDashboard size={20} />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-white">Campus Post</p>
                                    <p className="text-[12px] text-campus-muted">Share with community</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
