import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ShieldCheck, Zap } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { notificationService } from '../services/NotificationService';

export default function NotificationPrompt() {
    const { notificationPermission, setNotificationPermission } = useAppStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (Notification.permission === 'default' && !notificationPermission) {
            const timer = setTimeout(() => setIsVisible(true), 5000);
            return () => clearTimeout(timer);
        }
    }, [notificationPermission]);

    const handleRequest = async () => {
        const permission = await notificationService.requestPermission();
        setNotificationPermission(permission);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 100, opacity: 0, scale: 0.9 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[2000] glass-card overflow-hidden shadow-2xl border border-white/10"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-brand-500 animate-gradient-x" />

                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30 shrink-0 shadow-glow">
                                <Bell size={24} className="animate-bounce" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-black uppercase tracking-widest text-[14px] text-white">Enable Notifications</h3>
                                    <button onClick={handleDismiss} className="text-campus-muted hover:text-white transition-colors p-1">
                                        <X size={18} />
                                    </button>
                                </div>
                                <p className="text-[12px] text-campus-muted font-bold leading-relaxed pr-4">
                                    Never miss a message. Get instant push alerts even when the tab is closed.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 border border-white/5"
                            >
                                Not Now
                            </button>
                            <button
                                onClick={handleRequest}
                                className="px-4 py-3 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-elevation-2 flex items-center justify-center gap-2 group"
                            >
                                <Zap size={12} className="group-hover:animate-pulse" />
                                Allow Access
                            </button>
                        </div>

                        <div className="mt-4 flex items-center gap-2 px-1">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-campus-muted opacity-50">Secure & End-to-end Encrypted alerts</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
