import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { insforge } from '../../lib/insforge';
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
    Settings,
    LogOut,
    Plus,
    Search,
    Hexagon,
    Bell,
    X,
    MessageCircle,
    FileText,
} from 'lucide-react';

export default function MainLayout() {
    const { user } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const { isExamMode, setExamMode } = useAppStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Navigation configuration
    const navItems = [
        { id: 'chats', label: 'Messages', icon: MessageSquare, path: '/app/chats' },
        { id: 'feed', label: 'Campus Feed', icon: LayoutDashboard, path: '/app/feed', hideInExam: true },
        { id: 'study', label: 'Study Hub', icon: BookOpen, path: '/app/study' },
        { id: 'placement', label: 'Placement', icon: Briefcase, path: '/app/placement' },
        { id: 'profile', label: 'Identity', icon: User, path: '/app/profile' },
    ];

    const isChatPath = location.pathname.startsWith('/app/chats/');

    return (
        <div className="flex h-screen bg-campus-darker text-white overflow-hidden font-sans">

            {/* Desktop Side Rail — High-end Native Experience */}
            <aside className="hidden md:flex flex-col items-center w-20 lg:w-64 bg-campus-dark border-r border-white/[0.05] z-50 py-6 transition-all duration-300 overflow-y-auto shrink-0 shadow-premium">

                {/* Logo Section */}
                <div className="mb-10 lg:px-6 w-full flex justify-center lg:justify-start items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow shrink-0">
                        <Hexagon className="text-white fill-current" size={24} />
                    </div>
                    <span className="hidden lg:block text-xl font-black tracking-tighter text-white">Campusly</span>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 w-full space-y-1 lg:px-3">
                    {navItems.map((item) => (
                        (!item.hideInExam || !isExamMode) && (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative ${location.pathname.startsWith(item.path)
                                        ? 'bg-brand-500/10 text-brand-400 font-bold'
                                        : 'text-campus-muted hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={22} className={`shrink-0 transition-transform group-hover:scale-110 ${location.pathname.startsWith(item.path) ? 'text-brand-400' : ''}`} />
                                <span className="hidden lg:block text-sm tracking-tight">{item.label}</span>

                                {location.pathname.startsWith(item.path) && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full lg:hidden" />
                                )}
                            </Link>
                        )
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="w-full space-y-2 lg:px-3 mt-6 pt-6 border-t border-white/5">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-glow active:scale-95 group"
                    >
                        <Plus size={22} className="shrink-0 transition-transform group-hover:rotate-90" />
                        <span className="hidden lg:block text-sm font-bold">Create New</span>
                    </button>

                    <button
                        onClick={() => navigate('/app/profile')}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${location.pathname === '/app/profile' ? 'bg-white/10 text-white' : 'text-campus-muted hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Settings size={22} className="shrink-0" />
                        <span className="hidden lg:block text-sm font-medium">Settings</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">

                {/* Global Desktop Header Widgets */}
                <div className="hidden md:flex absolute top-6 right-8 z-40 items-center gap-3">
                    <SyncStatusBadge />
                    <ExamModeWidget />
                    <button className="p-2.5 rounded-xl bg-campus-dark/50 backdrop-blur-md border border-white/5 hover:bg-white/5 text-campus-muted hover:text-white transition-all">
                        <Bell size={18} />
                    </button>
                    <Toast />
                </div>

                <main className="flex-1 overflow-hidden relative">
                    <Outlet />
                </main>

                {/* Mobile Navigation (Bottom Bar) */}
                <nav className={`md:hidden flex safe-bottom bg-campus-dark/80 backdrop-blur-3xl border-t border-white/[0.05] z-50 transition-all duration-300 ${isChatPath ? 'h-0 opacity-0 overflow-hidden' : 'h-16 opacity-100'}`}>
                    {navItems.map((item) => (
                        (!item.hideInExam || !isExamMode) && (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${location.pathname.startsWith(item.path) ? 'text-brand-400' : 'text-campus-muted'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label.split(' ')[0]}</span>
                            </Link>
                        )
                    ))}
                </nav>
            </div>

            {/* Global Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsCreateOpen(false)}>
                    <div className="glass-card p-10 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-black">Quick Compose</h2>
                            <button onClick={() => setIsCreateOpen(false)} className="text-campus-muted hover:text-white transition-all"><X size={24} /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => { setIsCreateOpen(false); navigate('/app/chats'); }}
                                className="flex items-center gap-5 p-5 rounded-2xl bg-white/5 hover:bg-brand-500/10 border border-white/10 hover:border-brand-500/50 transition-all text-left group"
                            >
                                <div className="p-3 rounded-xl bg-brand-500/20 text-brand-400 group-hover:scale-110 transition-transform"><MessageCircle size={24} /></div>
                                <div>
                                    <p className="font-bold text-white">New Message</p>
                                    <p className="text-xs text-campus-muted">Start local-first E2E chat</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { setIsCreateOpen(false); navigate('/app/study'); }}
                                className="flex items-center gap-5 p-5 rounded-2xl bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/50 transition-all text-left group"
                            >
                                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                                <div>
                                    <p className="font-bold text-white">Study Milestone</p>
                                    <p className="text-xs text-campus-muted">Add exam or assignment</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { setIsCreateOpen(false); navigate('/app/feed'); }}
                                className="flex items-center gap-5 p-5 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/50 transition-all text-left group"
                            >
                                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform"><LayoutDashboard size={24} /></div>
                                <div>
                                    <p className="font-bold text-white">Community Post</p>
                                    <p className="text-xs text-campus-muted">Share with the campus</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
