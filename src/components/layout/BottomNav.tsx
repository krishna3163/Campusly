import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    MessageCircle,
    Globe,
    BookOpen,
    Sparkles,
    User
} from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: <MessageCircle size={24} />, label: 'Chats', path: '/app/chats' },
        { icon: <Globe size={24} />, label: 'Campus', path: '/app/campus' },
        { icon: <BookOpen size={24} />, label: 'Study', path: '/app/study' },
        { icon: <Sparkles size={24} />, label: 'Feed', path: '/app/feed' },
        { icon: <User size={24} />, label: 'Profile', path: '/app/profile' },
    ];

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-campus-dark/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-[50] safe-bottom shadow-[0_-8px_30px_rgb(0,0,0,0.4)]">
            {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={`relative flex flex-col items-center justify-center gap-1 group transition-all duration-300 min-w-[64px] ${active ? 'text-brand-400' : 'text-campus-muted hover:text-white'}`}
                    >
                        {active && (
                            <motion.div
                                layoutId="nav-active"
                                className="absolute -top-3 w-10 h-1 bg-brand-500 rounded-full shadow-glow-brand"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                        )}
                        <div className={`relative transition-transform duration-300 ${active ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                            {item.icon}
                            {active && item.label === 'Chats' && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-campus-dark animate-pulse" />
                            )}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
