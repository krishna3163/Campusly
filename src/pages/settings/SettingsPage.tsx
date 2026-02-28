import { useState } from 'react';
import { useAuth, useUser } from '@insforge/react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User,
    Shield,
    Bell,
    Palette,
    Database,
    LogOut,
    ChevronRight,
    Key,
    Moon,
    Code2,
} from 'lucide-react';
import { deleteCookie } from '../../utils/cookie';
import { insforge } from '../../lib/insforge';
import { useAppStore } from '../../stores/appStore';

export default function SettingsPage() {
    const { user } = useUser();
    const { signOut } = useAuth();
    const { showToast } = useAppStore();
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
            const { data, error } = await insforge.database.from('profiles').update({
                display_name: displayName,
                bio: bio,
                updated_at: new Date().toISOString()
            }).eq('id', user.id).select().single();
            if (error) throw error;
            if (data) {
                showToast('Profile updated successfully!', 'success');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to update profile. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const wipeData = () => {
        if (window.confirm('This will wipe all local offline cache. Continue?')) {
            localStorage.clear();
            indexedDB.databases?.().then(dbs => dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name)));
            showToast('Local cache wiped successfully.', 'success');
        }
    };

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'privacy', label: 'Privacy & Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'aesthetics', label: 'Aesthetics', icon: Palette },
        { id: 'data', label: 'Local Data', icon: Database },
    ];
    const devTab = { id: 'developer', label: 'Developer', path: '/app/settings/developer' };

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

                <div className="p-6 space-y-2">
                    <Link to={devTab.path} className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl text-campus-muted hover:bg-white/5 hover:text-brand-400 transition-colors font-bold text-sm">
                        <div className="flex items-center gap-3">
                            <Code2 size={20} />
                            <span>Developer</span>
                        </div>
                        <ChevronRight size={16} />
                    </Link>
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
                                <p className="text-sm text-campus-muted mb-8">Control who sees your activity and manage security.</p>
                                <div className="space-y-4">
                                    {['Last seen', 'Profile visibility', 'Read receipts', '2FA', 'Active sessions'].map((label, i) => (
                                        <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                            <span className="font-medium text-sm">{label}</span>
                                            <button onClick={() => showToast(`${label} toggled`, 'info')} className="w-11 h-6 rounded-full bg-brand-500/30 p-0.5 cursor-pointer border border-brand-500/40"><div className="w-4 h-4 bg-white rounded-full ml-3.5 transition-transform" /></button>
                                        </div>
                                    ))}
                                    <div className="p-5 bg-brand-500/5 border border-brand-500/20 rounded-2xl space-y-4">
                                        <h3 className="font-bold flex items-center gap-2"><Key size={18} className="text-brand-400" /> E2E Encryption</h3>
                                        <p className="text-xs text-campus-muted">Your chats use end-to-end encryption. Only you and the recipient hold the keys.</p>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => setShowKey(!showKey)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors">{showKey ? 'Hide Key' : 'Reveal Key'}</button>
                                            <button onClick={() => showToast('Key exported securely', 'success')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors">Export Key</button>
                                            <button onClick={() => showToast('New key pair generated', 'success')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors">Rotate Keys</button>
                                        </div>
                                        {showKey && <div className="p-4 bg-black/40 rounded-xl font-mono text-[10px] break-all border border-white/5">{btoa(user?.id || '').slice(0, 32)}...</div>}
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                        <span className="font-medium text-sm">Blocked users</span>
                                        <button onClick={() => showToast('Blocked users list', 'info')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold">Manage</button>
                                    </div>
                                    <button onClick={() => showToast('Password reset email sent', 'info')} className="w-full py-3 rounded-2xl border border-white/10 hover:bg-white/5 text-sm font-bold">Change password</button>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-10 animate-fade-in">
                            <section>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Bell className="text-brand-400" size={24} /> Notifications
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Messages', desc: 'Direct and group alerts' },
                                        { label: 'Groups', desc: 'Group activity & mentions' },
                                        { label: 'Campus Feed', desc: 'Replies and mentions' },
                                        { label: 'Placement', desc: 'Jobs & interview tips' },
                                        { label: 'Exam reminders', desc: 'Assignments & exams' },
                                        { label: 'Quiet hours', desc: 'Mute during study' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-sm">{item.label}</h3>
                                                <p className="text-xs text-campus-muted mt-1">{item.desc}</p>
                                            </div>
                                            <button onClick={() => showToast(`${item.label} toggled`, 'info')} className="w-11 h-6 rounded-full bg-brand-500/30 p-0.5 cursor-pointer border border-brand-500/40"><div className="w-4 h-4 bg-white rounded-full ml-3.5" /></button>
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
                                    <Palette className="text-brand-400" size={24} /> Aesthetics
                                </h2>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 border-2 border-brand-500/50 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Moon size={20} className="text-brand-400" />
                                            <div><h3 className="font-bold text-sm">Dark mode</h3><p className="text-xs text-campus-muted">Currently active</p></div>
                                        </div>
                                        <span className="text-[10px] bg-brand-500/20 text-brand-400 px-2 py-1 rounded-full font-bold">ON</span>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <h3 className="font-bold text-sm mb-2">Accent color</h3>
                                        <div className="flex gap-2">
                                            {['#0ea5e9','#8b5cf6','#10b981','#f59e0b'].map(c => <button key={c} onClick={() => showToast(`Accent: ${c}`,'info')} className="w-8 h-8 rounded-full ring-2 ring-white/20 hover:scale-110 transition-transform" style={{background:c}} />)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <h3 className="font-bold text-sm mb-2">Glassmorphism & Darkness</h3>
                                        <p className="text-xs text-campus-muted mb-3">Blur and transparency level for UI panels.</p>
                                        <div className="flex items-center gap-3">
                                            <input type="range" min="0" max="100" defaultValue="85" className="flex-1 accent-brand-500" onChange={() => showToast('Glass level updated','success')} />
                                            <span className="text-xs font-bold text-brand-400">85%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-sm">Font size</h3><span className="text-brand-400 text-xs">16px</span></div>
                                        <input type="range" min="12" max="20" defaultValue="16" className="w-full accent-brand-500" />
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                        <span className="font-medium text-sm">Compact mode</span>
                                        <div className="w-11 h-6 bg-white/10 rounded-full p-0.5 cursor-pointer"><div className="w-4 h-4 bg-campus-muted rounded-full" /></div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                        <div className="flex items-center justify-between mb-2"><h3 className="font-bold text-sm">Animation intensity</h3><span className="text-campus-muted text-xs">Normal</span></div>
                                        <input type="range" min="0" max="2" defaultValue="1" className="w-full accent-brand-500" />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-10 animate-fade-in">
                            <section>
                                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <Database className="text-brand-400" size={24} /> Local Data
                                </h2>
                                <p className="text-sm text-campus-muted mb-8">Cache, offline sync, and data export.</p>
                                <div className="space-y-4">
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-600/10 to-purple-600/10 border border-brand-500/20">
                                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Cache Size</p>
                                        <h4 className="text-2xl font-black text-white">12.4 MB</h4>
                                        <p className="text-xs text-campus-muted mt-1">Database: 2.1MB | Media: 10.3MB</p>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                        <div><h3 className="font-bold text-sm">Wipe offline cache</h3><p className="text-xs text-campus-muted">Clears local DB & media</p></div>
                                        <button onClick={wipeData} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors">Clear</button>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                        <div><h3 className="font-bold text-sm">Offline sync status</h3><p className="text-xs text-emerald-400">Synced</p></div>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                        <div><h3 className="font-bold text-sm">Export data</h3><p className="text-xs text-campus-muted">Download your data</p></div>
                                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold">Export</button>
                                    </div>
                                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center justify-between">
                                        <div><h3 className="font-bold text-sm text-red-400">Reset app data</h3><p className="text-xs text-campus-muted">Wipe all local data</p></div>
                                        <button onClick={wipeData} className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold">Reset</button>
                                    </div>
                                    <button onClick={() => { if (window.confirm('Delete account permanently? This cannot be undone.')) showToast('Account deletion requested. Contact support.', 'info'); }} className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-sm">Delete account</button>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
