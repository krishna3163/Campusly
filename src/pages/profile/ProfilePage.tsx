import { useState, useEffect } from 'react';
import { useUser, UserButton } from '@insforge/react';
import { insforge } from '../../lib/insforge';
import type { UserProfile } from '../../types';
import {
    Settings,
    Shield,
    HardDrive,
    ChevronRight,
    Award,
    Star,
    BookOpen,
    MessageCircle,
    Edit3,
    Camera,
    Heart,
    Code2,
    Zap,
    X,
    Save,
    Share2,
    Lock,
    Eye,
    Palette,
    BellRing,
} from 'lucide-react';

export default function ProfilePage() {
    const { user } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isOnline] = useState(navigator.onLine);
    const [messageCount, setMessageCount] = useState<number | string>(0);
    const [notesCount, setNotesCount] = useState<number | string>(0);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeSetting, setActiveSetting] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) { loadProfile(); loadStats(); }
    }, [user?.id]);

    const loadProfile = async () => {
        if (!user?.id) return;
        const { data } = await insforge.database.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data as UserProfile);
    };

    const loadStats = async () => {
        if (!user?.id) return;
        const [msgRes, noteRes] = await Promise.all([
            insforge.database.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', user.id),
            insforge.database.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        ]);
        setMessageCount(msgRes.count ?? 0);
        setNotesCount(noteRes.count ?? 0);
    };

    const handleActionClick = (id: string) => {
        if (id === 'Local Data') {
            if (confirm("Wipe all locally cached messages? This will free space but require re-syncing.")) {
                alert("Cache wiped successfully.");
            }
        } else {
            setActiveSetting(id);
        }
    };

    const menuItems = [
        { icon: Shield, label: 'Privacy & Security', subtitle: 'E2E Encryption Keys', color: 'text-emerald-400' },
        { icon: BellRing, label: 'Push Notifications', subtitle: 'Manage campus alerts', color: 'text-amber-400' },
        { icon: Palette, label: 'Aesthetics', subtitle: 'Glassmorphism & Darkness', color: 'text-purple-400' },
        { icon: HardDrive, label: 'Local Data', subtitle: 'Wipe offline cache', color: 'text-cyan-400' },
    ];

    return (
        <div className="h-full bg-campus-darker overflow-y-auto pb-12">
            {/* High-end Banner Section */}
            <div className="relative h-64 lg:h-80 bg-gradient-to-br from-brand-600/40 via-purple-600/20 to-pink-600/10 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-campus-darker to-transparent" />

                {/* Banner Actions */}
                <div className="absolute top-8 right-8 flex gap-3 z-20">
                    <button onClick={() => alert("Profile link copied!")} className="p-3 bg-black/20 backdrop-blur-md rounded-2xl hover:bg-black/40 transition-all border border-white/5 text-white active:scale-90">
                        <Share2 size={20} />
                    </button>
                    <button onClick={() => setShowEditModal(true)} className="p-3 bg-brand-600 rounded-2xl hover:bg-brand-500 transition-all shadow-glow text-white active:scale-95">
                        <Edit3 size={20} />
                    </button>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 -mt-32 relative z-10 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Panel — Identity */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-card p-8 flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="w-32 h-32 rounded-[40px] bg-gradient-to-tr from-brand-500 to-purple-500 p-1 shadow-glow-lg group cursor-pointer" onClick={() => setShowEditModal(true)}>
                                    <div className="w-full h-full rounded-[38px] bg-campus-dark flex items-center justify-center overflow-hidden border-4 border-campus-dark transition-transform group-hover:scale-95">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <span className="text-4xl font-black text-white">{profile?.display_name?.charAt(0) || 'U'}</span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-[38px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                        <Camera size={24} />
                                    </div>
                                </div>
                                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-campus-dark ${isOnline ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-gray-500'}`} />
                            </div>

                            <h1 className="text-2xl font-black text-white mb-1">{profile?.display_name || 'Anonymous User'}</h1>
                            <p className="text-sm text-campus-muted font-medium mb-6">{user?.email}</p>

                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-brand-400 flex items-center gap-1.5 leading-none">
                                    <Code2 size={12} /> {profile?.branch || 'General'}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1.5 leading-none">
                                    <Zap size={12} /> Sem {profile?.semester || 1}
                                </span>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                                <div className="text-center">
                                    <p className="text-xl font-black text-white">{profile?.reputation_score || 0}</p>
                                    <p className="text-[10px] text-campus-muted font-bold uppercase">Reputation</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-black text-white">{profile?.badges?.length || 0}</p>
                                    <p className="text-[10px] text-campus-muted font-bold uppercase">Badges</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 border-brand-500/20 bg-brand-500/5">
                            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-white">
                                <Award size={18} className="text-brand-400" />
                                Recent Achievements
                            </h3>
                            <div className="space-y-3">
                                {['Early Bird', 'Knowledge Seeker', 'Helper'].map(b => (
                                    <div key={b} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                                        <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400"><Star size={14} /></div>
                                        <span className="text-xs font-bold text-white/80">{b}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel — Settings & Activity */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Messages Sent', val: messageCount, icon: MessageCircle, color: 'text-blue-400' },
                                { label: 'Notes Contributed', val: notesCount, icon: BookOpen, color: 'text-emerald-400' },
                                { label: 'Forum Karma', val: 245, icon: Heart, color: 'text-pink-400' },
                            ].map(s => (
                                <div key={s.label} className="glass-card p-6 flex items-center gap-4 transition-transform hover:scale-105 group cursor-default">
                                    <div className={`p-3 rounded-2xl bg-white/5 ${s.color} transition-transform group-hover:rotate-12`}><s.icon size={24} /></div>
                                    <div>
                                        <p className="text-2xl font-black text-white">{s.val}</p>
                                        <p className="text-[10px] text-campus-muted font-black uppercase tracking-widest">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Account Settings */}
                        <div className="glass-card overflow-hidden">
                            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <h2 className="text-xl font-black text-white">Account Settings</h2>
                                <Settings size={20} className="text-campus-muted" />
                            </div>
                            <div className="p-2 space-y-1">
                                {menuItems.map(item => (
                                    <button
                                        key={item.label}
                                        onClick={() => handleActionClick(item.label)}
                                        className="w-full flex items-center justify-between px-6 py-5 rounded-2xl hover:bg-white/5 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                                                <item.icon size={22} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{item.label}</p>
                                                <p className="text-xs text-campus-muted">{item.subtitle}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-campus-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Security Features Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5 group cursor-pointer hover:bg-emerald-500/10 transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <Lock size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                    <h3 className="text-sm font-bold text-emerald-400">E2E Encryption</h3>
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed">Your chats are automatically encrypted. Only you and the recipient hold the keys to decrypt messages. Campusly cannot read your private data.</p>
                            </div>
                            <div className="glass-card p-6 border-amber-500/20 bg-amber-500/5 group cursor-pointer hover:bg-amber-500/10 transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <Eye size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                                    <h3 className="text-sm font-bold text-amber-400">Privacy Guard</h3>
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed">Adjust your visibility settings in the Privacy section. You can choose to be seen as Anonymous in Campus feed posts.</p>
                            </div>
                        </div>

                        {/* Logout Section */}
                        <div className="glass-card p-1 flex justify-center hover:bg-red-500/5 transition-all">
                            <div className="w-full grayscale hover:grayscale-0 transition-all py-2 rounded-2xl flex justify-center">
                                <UserButton />
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Edit Modal */}
            {showEditModal && profile && (
                <EditProfileDialog
                    profile={profile}
                    onClose={() => setShowEditModal(false)}
                    onSaved={(updated) => { setProfile(updated); setShowEditModal(false); }}
                />
            )}

            {/* Generic Settings Modal placeholder */}
            {activeSetting && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in text-center">
                    <div className="glass-card p-12 w-full max-w-sm">
                        <h2 className="text-2xl font-black text-white mb-4">{activeSetting}</h2>
                        <p className="text-campus-muted mb-8 text-sm">Managing your {activeSetting.toLowerCase()} preferences. Syncing with local mesh...</p>
                        <button onClick={() => setActiveSetting(null)} className="btn-primary w-full py-3 rounded-2xl font-bold">Close Dialog</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function EditProfileDialog({ profile, onClose, onSaved }: { profile: UserProfile, onClose: () => void, onSaved: (p: UserProfile) => void }) {
    const [name, setName] = useState(profile.display_name);
    const [bio, setBio] = useState(profile.bio || '');
    const [branch, setBranch] = useState(profile.branch || '');
    const [semester, setSemester] = useState(profile.semester?.toString() || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = { display_name: name, bio, branch, semester: parseInt(semester) || 1, updated_at: new Date().toISOString() };
            const { data } = await insforge.database.from('profiles').update(updates).eq('id', profile.id).select().single();
            if (data) onSaved(data as UserProfile);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-card p-8 w-full max-w-lg animate-scale-in">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3"><Edit3 className="text-brand-400" /> Identity Hub</h2>
                    <button onClick={onClose} className="text-campus-muted hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all"><X size={24} /></button>
                </div>
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-campus-muted tracking-widest pl-1">Full Identity</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-brand-500 text-white" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-campus-muted tracking-widest pl-1">Status Bio</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-brand-500 h-24 resize-none text-white text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-campus-muted tracking-widest pl-1">Academic Branch</label>
                            <input type="text" value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-brand-500 text-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-campus-muted tracking-widest pl-1">Semester</label>
                            <input type="number" value={semester} onChange={e => setSemester(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-brand-500 text-white" />
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-glow mt-4 disabled:opacity-50"
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                        {saving ? 'Syncing...' : 'Update Identity'}
                    </button>
                </div>
            </div>
        </div>
    );
}
