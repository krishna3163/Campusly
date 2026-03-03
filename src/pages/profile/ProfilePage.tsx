import { useState, useEffect } from 'react';
import { useUser } from '@insforge/react';
import { useNavigate } from 'react-router-dom';
import {
    Settings,
    Shield,
    Bell,
    Palette,
    LogOut,
    ChevronRight,
    MessageCircle,
    Zap,
    Heart,
    Star,
    Edit3,
    Camera,
    CheckCircle,
    X,
    User as UserIcon,
    Moon,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile } from '../../types';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { useAppStore } from '../../stores/appStore';
import { insforge } from '../../lib/insforge';

export default function ProfilePage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { uploadFile } = useMediaUpload();
    const { showToast } = useAppStore();

    const [profile, setProfile] = useState<UserProfile | null>((user?.profile as any) || null);
    const [loading, setLoading] = useState(!user?.profile);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        display_name: '',
        bio: '',
        department: ''
    });

    useEffect(() => {
        if (user?.id && !profile) {
            loadProfile();
        } else if (profile) {
            setEditData({
                display_name: profile.display_name || '',
                bio: profile.bio || '',
                department: (profile as any).metadata?.department || ''
            });
        }
    }, [user?.id, profile]);

    const loadProfile = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await insforge.database
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (data) {
                setProfile(data as UserProfile);
                setEditData({
                    display_name: data.display_name || '',
                    bio: data.bio || '',
                    department: (data as any).metadata?.department || ''
                });
            }
        } catch (err) {
            console.error('Profile load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { label: 'Posts', count: '1.2K', icon: Zap, color: 'text-[#007AFF]' },
        { label: 'Friends', count: '480', icon: MessageCircle, color: 'text-[#5856D6]' },
        { label: 'Karma', count: '98%', icon: Heart, color: 'text-[#FF2D55]' },
        { label: 'Rank', count: '#4', icon: Star, color: 'text-[#FF9500]' },
    ];

    const menuSections = [
        {
            title: 'Account',
            items: [
                { icon: UserIcon, label: 'Edit Profile', color: 'bg-[#007AFF]', onClick: () => setShowEditModal(true) },
                { icon: Shield, label: 'Privacy & Security', color: 'bg-[#34C759]', onClick: () => navigate('/app/settings') },
                { icon: Bell, label: 'Notifications', color: 'bg-[#FF3B30]', onClick: () => navigate('/app/settings') },
            ]
        },
        {
            title: 'Appearance',
            items: [
                { icon: Palette, label: 'Themes', color: 'bg-[#AF52DE]', onClick: () => navigate('/app/settings') },
                { icon: Moon, label: 'Dark Mode', color: 'bg-[#1C1C1E]', onClick: () => navigate('/app/settings') },
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: Info, label: 'About Campusly', color: 'bg-[#8E8E93]', onClick: () => navigate('/app/settings') },
            ]
        }
    ];

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        try {
            const url = await uploadFile(file, 'avatars');
            if (url) {
                const { error } = await insforge.database
                    .from('profiles')
                    .update({ avatar_url: url })
                    .eq('id', user.id);

                if (error) throw error;
                showToast('Avatar updated', 'success');
                window.location.reload();
            }
        } catch (err: any) {
            showToast('Update failed: ' + err.message, 'error');
        }
    };

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        try {
            const { error } = await insforge.database
                .from('profiles')
                .update({
                    display_name: editData.display_name,
                    bio: editData.bio,
                    branch: editData.department || undefined
                })
                .eq('id', user.id);

            if (error) throw error;
            showToast('Profile updated', 'success');
            setShowEditModal(false);
            window.location.reload();
        } catch (err: any) {
            showToast('Update failed: ' + err.message, 'error');
        }
    };

    return (
        <div className="h-full bg-[#F2F2F7] flex flex-col overflow-hidden font-sans">
            {/* iOS Styled Profile Header */}
            <div className="bg-white px-4 pt-12 pb-6 border-b border-[#E5E5EA] flex flex-col items-center">
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full bg-[#F2F2F7] overflow-hidden border border-black/5 shadow-sm">
                        {user?.profile?.avatar_url ? (
                            <img src={user.profile.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-[#E5E5EA] text-[#8E8E93]">
                                {(user as any)?.display_name?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-[#E5E5EA] active:scale-90 transition-all cursor-pointer">
                        <Camera size={18} className="text-[#007AFF]" />
                        <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                    </label>
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                        <h2 className="text-[22px] font-bold text-black tracking-tight leading-tight">
                            {((user?.profile as any)?.display_name || (user as any)?.display_name || 'Anonymous User') as string}
                        </h2>
                        {(user?.profile as any)?.is_verified && (
                            <CheckCircle size={18} fill="#007AFF" className="text-white" />
                        )}
                    </div>
                    <p className="text-[15px] text-[#8E8E93] mt-0.5">
                        @{((user as any)?.username || 'user') as string} • {((user?.profile as any)?.metadata?.department || 'Student') as string}
                    </p>
                    {(user?.profile as any)?.bio && (
                        <p className="text-[14px] text-black mt-2 max-w-[280px] mx-auto leading-tight">
                            {(user?.profile as any).bio as string}
                        </p>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Stats Section */}
                <div className="px-4 py-6">
                    <div className="bg-white rounded-[12px] p-4 flex justify-between shadow-sm border border-black/5">
                        {stats.map((stat: any) => (
                            <div key={stat.label} className="flex flex-col items-center px-2">
                                <span className="text-[17px] font-bold text-black">{stat.count}</span>
                                <span className="text-[12px] text-[#8E8E93] uppercase font-semibold mt-0.5 tracking-tight">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Menu Sections */}
                <div className="space-y-8 pb-32">
                    {menuSections.map((section: any) => (
                        <div key={section.title}>
                            <h3 className="px-5 text-[13px] text-[#6E6E73] font-medium uppercase tracking-tight mb-2 ml-1">{section.title}</h3>
                            <div className="bg-white border-y border-[#E5E5EA] divide-y divide-[#E5E5EA]">
                                {section.items.map((item: any) => (
                                    <button
                                        key={item.label}
                                        onClick={item.onClick}
                                        className="w-full flex items-center justify-between py-3 px-4 active:bg-[#F2F2F7] transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-[7px] ${item.color} flex items-center justify-center text-white`}>
                                                <item.icon size={16} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[17px] text-black">{item.label}</span>
                                        </div>
                                        <ChevronRight size={18} className="text-[#C4C4C6]" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="px-4">
                        <button
                            onClick={() => navigate('/logout')}
                            className="w-full bg-white border-y border-[#E5E5EA] py-3 text-[#FF3B30] text-[17px] font-bold active:bg-[#F2F2F7] transition-colors"
                        >
                            Log Out
                        </button>
                    </div>

                    <div className="text-center opacity-40 py-8">
                        <p className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-[0.2em]">Campusly v2.0</p>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal Sheet */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowEditModal(false)}>
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-[430px] bg-[#F2F2F7] rounded-t-[20px] overflow-hidden flex flex-col h-[70vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1.5 bg-[#BCBCC0] rounded-full mx-auto my-3" />

                            <div className="px-5 py-4 flex justify-between items-center bg-white border-b border-[#E5E5EA]">
                                <button onClick={() => setShowEditModal(false)} className="text-[#007AFF] text-[17px]">Cancel</button>
                                <h3 className="text-[17px] font-bold">Edit Profile</h3>
                                <button
                                    onClick={handleSaveProfile}
                                    className="text-[#007AFF] text-[17px] font-bold"
                                >
                                    Done
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pt-6 space-y-6">
                                <section>
                                    <div className="bg-white border-y border-[#E5E5EA] divide-y divide-[#E5E5EA]">
                                        <div className="px-4 py-3 flex gap-4 items-center">
                                            <label className="text-[15px] font-medium text-[#8E8E93] w-24">Name</label>
                                            <input
                                                type="text"
                                                value={editData.display_name}
                                                onChange={e => setEditData({ ...editData, display_name: e.target.value })}
                                                className="flex-1 text-[15px] text-black outline-none"
                                                placeholder="Display Name"
                                            />
                                        </div>
                                        <div className="px-4 py-3 flex gap-4 items-center">
                                            <label className="text-[15px] font-medium text-[#8E8E93] w-24">Department</label>
                                            <input
                                                type="text"
                                                value={editData.department}
                                                onChange={e => setEditData({ ...editData, department: e.target.value })}
                                                className="flex-1 text-[15px] text-black outline-none"
                                                placeholder="e.g. Computer Science"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="bg-white border-y border-[#E5E5EA] px-4 py-3">
                                        <label className="text-[13px] text-[#8E8E93] uppercase font-medium mb-2 block">About You</label>
                                        <textarea
                                            value={editData.bio}
                                            onChange={e => setEditData({ ...editData, bio: e.target.value })}
                                            rows={4}
                                            className="w-full text-[15px] text-black outline-none resize-none pt-1"
                                            placeholder="Write a short bio..."
                                        />
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
