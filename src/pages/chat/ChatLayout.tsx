import { Outlet, useParams, useLocation } from 'react-router-dom';
import ChatListPage from './ChatListPage';
import { MessageSquare, Hash, Megaphone, Settings, Archive } from 'lucide-react';

export default function ChatLayout() {
    const { chatId } = useParams<{ chatId: string }>();
    const location = useLocation();

    // Show outlet if we have a chatId or if we're on a sub-route like /discover
    const showOutlet = !!chatId || location.pathname.includes('/discover');

    return (
        <div className="h-full flex overflow-hidden">
            {/* Left Sidebar (List) — Visible on desktop/tablet, hidden on mobile when a chat is open */}
            <div className={`w-full md:w-80 lg:w-[350px] shrink-0 ${showOutlet ? 'hidden md:block' : 'block'}`}>
                <ChatListPage />
            </div>

            {/* Right Pane (Messages) — Visible on mobile when chat is open, always visible on desktop */}
            <div className={`flex-1 h-full min-w-0 ${!showOutlet ? 'hidden md:flex' : 'flex'} flex-col bg-campus-darker`}>
                {showOutlet ? (
                    <Outlet />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-b from-[#F2F2F7] to-white dark:from-black dark:to-[#1C1C1E]">
                        <div className="w-28 h-28 rounded-[24px] bg-white dark:bg-zinc-900 shadow-elevation-2 flex items-center justify-center mb-10 relative group">
                            <div className="absolute inset-0 bg-[#007AFF] opacity-5 rounded-[24px] group-hover:opacity-10 transition-opacity" />
                            <MessageSquare size={48} className="text-[#007AFF]" strokeWidth={1.5} />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#34C759] rounded-full border-4 border-white dark:border-black shadow-sm" />
                        </div>

                        <h2 className="text-3xl font-black text-black dark:text-white mb-3 tracking-tight">Campusly Web</h2>
                        <p className="text-[#8E8E93] max-w-sm mx-auto text-[16px] leading-relaxed mb-12">
                            Select a conversation to start messaging. Your chats are encrypted and synced across all your devices.
                        </p>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            {[
                                { label: 'Discover', icon: Hash, path: '/app/campus', color: 'text-purple-500' },
                                { label: 'Broadcast', icon: Megaphone, path: '#', color: 'text-orange-500' },
                                { label: 'Settings', icon: Settings, path: '/app/settings', color: 'text-zinc-500' },
                                { label: 'Archived', icon: Archive, path: '#', color: 'text-blue-500' }
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    className="bg-white dark:bg-zinc-900 border border-[#E5E5EA] dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-4 hover:shadow-elevation-1 transition-all active:scale-95 text-left group"
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                                        <action.icon size={20} strokeWidth={2} />
                                    </div>
                                    <span className="font-bold text-[15px] text-black dark:text-white">{action.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-16 flex items-center gap-3 text-[11px] text-[#C6C6C8] font-bold uppercase tracking-[0.2em]">
                            <span className="w-12 h-[1px] bg-[#E5E5EA]"></span>
                            <span>E2E Encrypted</span>
                            <span className="w-12 h-[1px] bg-[#E5E5EA]"></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
