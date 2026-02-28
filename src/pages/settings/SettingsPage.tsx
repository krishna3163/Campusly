import { useState } from 'react';
import { useAuth, useUser } from '@insforge/react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Shield,
    Bell,
    Palette,
    Database,
    LogOut,
    ChevronRight,
    Key,
    Smartphone,
    Moon,
    Trash2,
    Check,
} from 'lucide-react';
import { deleteCookie } from '../../utils/cookie';
import { insforge } from '../../lib/insforge';

export default function SettingsPage() {
    const { user } = useUser();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'notifications' | 'aesthetics' | 'data'>('account');
    const [isSaving, setIsSaving] = useState(false);
    const [showKey, setShowKey] = useState(false);

    // Profile State
    const [displayName, setDisplayName] = useState(user?.profile?.display_name || '');
    const [bio, setBio] = useState(user?.profile?.bio || '');

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await signOut();
            deleteCookie('campusly_user_id');
            deleteCookie('campusly_user_name');
            deleteCookie('campusly_user_avatar');
            navigate('/login');
        }
    };

    const handleUpdateProfile = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            await insforge.database.from('profiles').update({
                display_name: displayName,
                bio: bio
            }).eq('id', user.id);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const wipeData = () => {
        if (window.confirm('This will wipe all local offline cache. Continue?')) {
            localStorage.clear();
            alert('Local cache wiped successfully.');
        }
    };

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'privacy', label: 'Privacy & Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'aesthetics', label: 'Aesthetics', icon: Palette },
        { id: 'data', label: 'Local Data', icon: Database },
    ];

    return (
        <div className="flex-1 h-full bg-campus-darker flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 border-r border-white/5 bg-campus-dark/50 flex flex-col">
                <div className="p-8">
                    <h1 className="text-2xl font-black text-white mb-2">Settings</h1>
                    <p className="text-xs text-campus-muted">Manage your Campusly experience</p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-brand-500 text-white shadow-glow' : 'text-campus-muted hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <tab.icon size={20} />
                                <span className="font-bold text-sm">{tab.label}</span>
                            </div>
                            <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-30'} />
                        </button>
                    ))}
                </nav>

                <div className="p-6">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition-colors font-bold text-sm"
                    >
                        <LogOut size={20} />
                        Logout Session
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-campus-darker relative">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-600/5 blur-[100px] pointer-events-none" />

                <div className="max-w-3xl mx-auto p-12 relative z-10">
                    {activeTab === 'account' && (
                        <div className="space-y-10 animate-fade-in">
                            <section>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <User className="text-brand-400" size={24} /> Profile Settings
                                </h2>
                                <div className="flex items-center gap-8 mb-8 p-6 bg-white/5 border border-white/10 rounded-3xl">
                                    <div className="w-24 h-24 rounded-3xl bg-brand-500 overflow-hidden shrink-0">
                                        {user?.profile?.avatar_url ? (
                                            <img src={String(user.profile.avatar_url)} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                                                {String(user?.profile?.display_name || 'U').charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <h3 className="font-bold text-lg">{String(user?.profile?.display_name || 'Student')}</h3>
                                        <p className="text-xs text-campus-muted">{String(user?.email || '')}</p>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-bold uppercase tracking-wider">Verified Student</span>
                                            <span className="px-3 py-1 rounded-full bg-white/5 text-campus-muted text-[10px] font-bold uppercase tracking-wider">{String(user?.profile?.branch || 'General')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-campus-muted ml-1 uppercase tracking-widest">Display Name</label>
                                        <input
                                            type="text"
                                            value={String(displayName)}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-brand-500 outline-none transition-all"
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-campus-muted ml-1 uppercase tracking-widest">Bio / Status</label>
                                        <textarea
                                            value={String(bio)}
                                            onChange={(e) => setBio(e.target.value)}
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-brand-500 outline-none transition-all resize-none"
                                            placeholder="Write something about yourself..."
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={isSaving}
                                        className="btn-primary px-8 py-3 rounded-2xl font-bold disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="space-y-10 animate-fade-in">
                            <section>
                                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <Shield className="text-brand-400" size={24} /> Privacy & Security
                                </h2>
                                <p className="text-sm text-campus-muted mb-8 text-balance">Campusly uses state-of-the-art encryption to keep your data private.</p>

                                <div className="space-y-4">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold flex items-center gap-2">
                                                <Key size={18} className="text-brand-400" /> E2E Encryption Keys
                                            </h3>
                                            <p className="text-xs text-campus-muted mt-1">Manage your private keys used for secure messaging.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors"
                                        >
                                            {showKey ? 'Hide Key' : 'Reveal Key'}
                                        </button>
                                    </div>

                                    {showKey && (
                                        <div className="p-4 bg-black/40 rounded-2xl font-mono text-[10px] break-all border border-white/5 animate-slide-down">
                                            {btoa(user?.id || 'campusly_master_key_v1').slice(0, 32)}...[HIDDEN_PARTS]...{btoa(user?.id || '').slice(-8)}
                                        </div>
                                    )}

                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between opacity-50">
                                        <div>
                                            <h3 className="font-bold flex items-center gap-2">
                                                <Smartphone size={18} className="text-emerald-400" /> Trusted Devices
                                            </h3>
                                            <p className="text-xs text-campus-muted mt-1">Currently active only on this terminal.</p>
                                        </div>
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold">Active</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-10 animate-fade-in">
                            <section>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Bell className="text-brand-400" size={24} /> Push Notifications
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Campus Alerts', desc: 'Emergency alerts and campus-wide announcements.' },
                                        { label: 'New Messages', desc: 'Alerts for direct messages and group mentions.' },
                                        { label: 'Study Reminders', desc: 'Notifications for upcoming assignments and exams.' },
                                        { label: 'Placement Updates', desc: 'Notifications for new job postings and interview shorts.' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group">
                                            <div>
                                                <h3 className="font-bold">{item.label}</h3>
                                                <p className="text-xs text-campus-muted mt-1">{item.desc}</p>
                                            </div>
                                            <div className="w-12 h-6 bg-brand-500 rounded-full relative cursor-pointer p-1">
                                                <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'aesthetics' && (
                        <div className="space-y-10 animate-fade-in">
                            <section>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Palette className="text-brand-400" size={24} /> Aesthetics & UI
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 bg-white/5 border-2 border-brand-500/50 rounded-3xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/20 blur-2xl" />
                                        <Moon size={24} className="text-brand-400 mb-4" />
                                        <h3 className="font-bold">Campusly Dark</h3>
                                        <p className="text-xs text-campus-muted mt-1">Deep obsidian tones with brand accents.</p>
                                        <div className="mt-4 flex items-center gap-2 text-[10px] text-brand-400 font-bold">
                                            <Check size={14} /> ACTIVE THEME
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl opacity-40">
                                        <div className="w-6 h-6 rounded-full bg-white mb-4" />
                                        <h3 className="font-bold">Paper Light</h3>
                                        <p className="text-xs text-campus-muted mt-1">Coming soon for daylight usage.</p>
                                    </div>
                                    <div className="col-span-full p-6 bg-white/5 border border-white/10 rounded-3xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold">Glassmorphism Level</h3>
                                                <p className="text-xs text-campus-muted mt-1">Control the transparency and blur of UI panels.</p>
                                            </div>
                                            <span className="text-brand-400 font-bold">85%</span>
                                        </div>
                                        <input type="range" className="w-full mt-6 accent-brand-500" />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-10 animate-fade-in">
                            <section>
                                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <Database className="text-brand-400" size={24} /> Local Data Management
                                </h2>
                                <p className="text-sm text-campus-muted mb-8">Optimize your storage and manage offline data.</p>
                                <div className="space-y-4">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:border-red-500/30 transition-colors">
                                        <div>
                                            <h3 className="font-bold flex items-center gap-2">
                                                <Trash2 size={18} className="text-red-400" /> Wipe Offline Cache
                                            </h3>
                                            <p className="text-xs text-campus-muted mt-1">Clears local database and temporary images.</p>
                                        </div>
                                        <button
                                            onClick={wipeData}
                                            className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-600/10 to-purple-600/10 border border-brand-500/20">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Total Usage</p>
                                                <h4 className="text-3xl font-black text-white">12.4 MB</h4>
                                            </div>
                                            <p className="text-xs text-campus-muted">Database: 2.1MB | Images: 10.3MB</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
