import React, { useState } from 'react';
import {
    Globe,
    Users,
    Star,
    Lock,
    ChevronRight,
    Shield,
    EyeOff,
    MessageCircle,
    Camera,
    Search,
    Check,
    X,
    UserPlus,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StoryPrivacySettingsProps {
    onClose: () => void;
}

export const StoryPrivacySettings: React.FC<StoryPrivacySettingsProps> = ({ onClose }) => {
    const [visibility, setVisibility] = useState<'everyone' | 'contacts' | 'close_friends' | 'private'>('contacts');
    const [allowReplies, setAllowReplies] = useState(true);
    const [screenshotAlerts, setScreenshotAlerts] = useState(true);
    const [showCloseFriends, setShowCloseFriends] = useState(false);

    const privacyOptions = [
        { id: 'everyone', icon: <Globe size={24} />, label: 'Everyone', desc: 'Anyone on campus can see your stories.', color: 'text-brand-400' },
        { id: 'contacts', icon: <Users size={24} />, label: 'My Contacts', desc: 'Only your mutual contacts can see your stories.', color: 'text-blue-400' },
        { id: 'close_friends', icon: <Star size={24} />, label: 'Close Friends', desc: 'Share moments only with your inner circle.', color: 'text-green-400' },
        { id: 'private', icon: <Lock size={24} />, label: 'Private', desc: 'Only specified people can see your stories.', color: 'text-purple-400' },
    ];

    return (
        <div className="flex flex-col h-[90vh] bg-campus-dark/95 backdrop-blur-3xl rounded-t-[40px] border-t border-white/10 p-8 overflow-hidden text-white shadow-2xl">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" onClick={onClose}></div>

            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <Shield className="text-brand-400" /> Story Privacy
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pb-12 custom-scrollbar">
                {/* Visibility Selection */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-campus-muted px-2">Who can see my story?</h4>
                    <div className="space-y-3">
                        {privacyOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setVisibility(opt.id as any)}
                                className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all border ${visibility === opt.id ? 'bg-brand-500/10 border-brand-500/30' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                            >
                                <div className={`p-3 rounded-2xl bg-white/5 ${opt.color}`}>
                                    {opt.icon}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-white uppercase tracking-tight">{opt.label}</p>
                                    <p className="text-[10px] text-campus-muted font-medium">{opt.desc}</p>
                                </div>
                                {visibility === opt.id && <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white"><Check size={14} strokeWidth={3} /></div>}
                                {opt.id === 'close_friends' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowCloseFriends(true); }}
                                        className="ml-2 text-[10px] font-black text-brand-400 underline underline-offset-4 hover:text-brand-300"
                                    >
                                        Manage
                                    </button>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Additional Settings */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-campus-muted px-2">Advanced Controls</h4>
                    <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400"><MessageCircle size={20} /></div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">Allow Replies</p>
                                    <p className="text-[10px] text-campus-muted">Toggle whether people can reply to your status.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAllowReplies(!allowReplies)}
                                className={`w-12 h-6 rounded-full relative transition-all ${allowReplies ? 'bg-brand-500 shadow-glow' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${allowReplies ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400"><Camera size={20} /></div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">Screenshot Alerts</p>
                                    <p className="text-[10px] text-campus-muted">Get notified if someone takes a screenshot.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setScreenshotAlerts(!screenshotAlerts)}
                                className={`w-12 h-6 rounded-full relative transition-all ${screenshotAlerts ? 'bg-brand-500 shadow-glow' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${screenshotAlerts ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-red-500/20 text-red-400"><EyeOff size={20} /></div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">Hide Story From...</p>
                                    <p className="text-[10px] text-campus-muted">Select specific people who shouldn't see your updates.</p>
                                </div>
                            </div>
                            <button className="text-campus-muted hover:text-white transition-all"><ChevronRight size={20} /></button>
                        </div>
                    </div>
                </section>

                <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-brand-500/10 border border-brand-500/20 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Zap size={24} className="text-brand-400 animate-pulse" />
                        <div className="text-left">
                            <p className="text-sm font-black uppercase tracking-widest text-white italic">Campus Sync</p>
                            <p className="text-[10px] text-campus-muted uppercase font-bold">Privacy is automatically synced across devices.</p>
                        </div>
                    </div>
                    <Check className="text-brand-400" />
                </div>
            </div>

            {/* Close Friends Manager Layer */}
            <AnimatePresence>
                {showCloseFriends && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="absolute inset-x-0 top-16 bottom-0 z-[140] bg-campus-dark border-t border-white/10 flex flex-col p-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={() => setShowCloseFriends(false)} className="flex items-center gap-2 text-brand-400 font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-transform">
                                <ArrowLeft size={16} /> Back to Settings
                            </button>
                            <h3 className="text-lg font-black italic uppercase tracking-tighter">Close Friends</h3>
                        </div>

                        <div className="relative mb-6">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-campus-muted" />
                            <input
                                type="text"
                                placeholder="Search friends..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">A</div>
                                        <div>
                                            <p className="text-sm font-bold">Alex Johnson</p>
                                            <p className="text-[10px] text-campus-muted font-bold uppercase">CSE • Sem 6</p>
                                        </div>
                                    </div>
                                    <button className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-all">
                                        <Check size={16} />
                                    </button>
                                </div>
                            ))}
                            <button className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-campus-muted hover:text-white transition-all text-sm font-bold">
                                <UserPlus size={18} /> Add More Friends
                            </button>
                        </div>

                        <button
                            onClick={() => setShowCloseFriends(false)}
                            className="btn-primary w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm mt-8 shadow-glow"
                        >
                            Save Changes
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ArrowLeft = ({ size }: { size: number }) => <ChevronRight size={size} className="rotate-180" />;
