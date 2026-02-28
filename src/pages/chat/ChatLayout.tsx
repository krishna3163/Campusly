import { Outlet, useParams } from 'react-router-dom';
import ChatListPage from './ChatListPage';
import { MessageSquare } from 'lucide-react';

export default function ChatLayout() {
    const { chatId } = useParams<{ chatId: string }>();

    return (
        <div className="h-full flex overflow-hidden">
            {/* Left Sidebar (List) — Visible on desktop/tablet, hidden on mobile when a chat is open */}
            <div className={`w-full md:w-80 lg:w-[350px] shrink-0 ${chatId ? 'hidden md:block' : 'block'}`}>
                <ChatListPage />
            </div>

            {/* Right Pane (Messages) — Visible on mobile when chat is open, always visible on desktop */}
            <div className={`flex-1 h-full min-w-0 ${!chatId ? 'hidden md:flex' : 'flex'} flex-col bg-campus-darker`}>
                {chatId ? (
                    <Outlet />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-campus-darker/50">
                        <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6 animate-pulse">
                            <MessageSquare size={48} className="text-white/[0.1]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Campusly Web</h2>
                        <p className="text-campus-muted max-w-xs mx-auto text-sm leading-relaxed">
                            Select a conversation to start messaging. Your chats are end-to-end encrypted and synced across all your devices.
                        </p>

                        <div className="mt-12 flex items-center gap-2 text-[10px] text-campus-muted font-medium uppercase tracking-widest opacity-30">
                            <span className="w-8 h-[1px] bg-current"></span>
                            <span>Secure Messaging</span>
                            <span className="w-8 h-[1px] bg-current"></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
