import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Users,
    Shield,
    Lock,
    Trash2,
    Image as ImageIcon,
    Clock,
    Share2,
    LogOut,
    UserMinus,
    Camera,
    ChevronRight,
    UserPlus,
    CheckCircle
} from 'lucide-react';
import { insforge } from '../../lib/insforge';
import { useUser } from '@insforge/react';
import type { Conversation } from '../../types';
import { GroupService } from '../../services/GroupService';
import { ActivityLogService } from '../../services/ActivityLogService';
import { motion, AnimatePresence } from 'framer-motion';

export default function GroupSettingsPage() {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const { user } = useUser();

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member'>('member');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!chatId) return;
        loadData();
    }, [chatId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: conv } = await insforge.database
                .from('conversations')
                .select('*')
                .eq('id', chatId)
                .single();

            if (conv) setConversation(conv as Conversation);

            const { data: mems } = await insforge.database
                .from('conversation_members')
                .select('*, profile:profiles(*)')
                .eq('conversation_id', chatId);

            if (mems) {
                setMembers(mems);
                const me = mems.find(m => m.user_id === user?.id);
                if (me) setCurrentUserRole(me.role);
            }

            const activeLogs = await ActivityLogService.getLogs(chatId!);
            if (activeLogs) setLogs(activeLogs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVisibilityChange = async (newVisibility: 'public' | 'private') => {
        if (!chatId || !user?.id) return;
        setIsUpdating(true);
        try {
            await GroupService.setVisibility(chatId, newVisibility, user.id);
            setConversation(prev => prev ? { ...prev, visibility: newVisibility as any, is_public: newVisibility === 'public' } : null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRoleUpdate = async (targetUserId: string, action: 'promote' | 'demote') => {
        if (!chatId || !user?.id) return;
        setIsUpdating(true);
        try {
            if (action === 'promote') {
                await GroupService.assignAdmin(chatId, targetUserId, user.id);
            } else {
                await GroupService.removeAdmin(chatId, targetUserId, user.id);
            }
            await loadData();
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !chatId || !user?.id) return;
        setIsUpdating(true);
        try {
            const url = await GroupService.updatePhoto(chatId, file, user.id);
            setConversation(prev => prev ? { ...prev, avatar_url: url } : null);
            await loadData();
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleExit = async () => {
        if (!chatId || !user?.id) return;
        if (!window.confirm('Leave group?')) return;
        try {
            await GroupService.exitGroup(chatId, user.id);
            navigate('/app/chats');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!chatId || !user?.id) return;
        if (!window.confirm('Permanently delete this group?')) return;
        try {
            await GroupService.deleteGroup(chatId, user.id);
            navigate('/app/chats');
        } catch (err) {
            console.error(err);
        }
    };

    const canManageAdmins = currentUserRole === 'owner';
    const canManageInfo = currentUserRole === 'owner' || currentUserRole === 'admin';

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#F2F2F7]">
                <div className="w-8 h-8 border-3 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#F2F2F7] text-black">
                Group not found
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F2F2F7] overflow-hidden font-sans">
            {/* Header */}
            <header className="ios-header">
                <button onClick={() => navigate(-1)} className="ios-btn-blue">
                    <ChevronLeft size={24} />
                    <span>Back</span>
                </button>
                <div className="text-center flex-1 pr-12">
                    <h1 className="ios-title">Group Details</h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                {/* Avatar & Info */}
                <div className="bg-white flex flex-col items-center py-8 border-b border-[#E5E5EA]">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-[24px] bg-[#F2F2F7] overflow-hidden border border-black/5 flex items-center justify-center shadow-sm">
                            {conversation.avatar_url ? (
                                <img src={conversation.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-3xl font-bold text-white uppercase">
                                    {conversation.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        {canManageInfo && (
                            <label className="absolute bottom-[-8px] right-[-8px] p-2 bg-white rounded-full shadow-md border border-[#E5E5EA] cursor-pointer active:scale-90 transition-all">
                                <Camera size={18} className="text-[#007AFF]" />
                                <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                            </label>
                        )}
                    </div>
                    <div className="text-center px-6">
                        <h2 className="text-[22px] font-bold text-black flex items-center justify-center gap-1.5 px-4 mb-1">
                            {conversation.name}
                            {conversation.visibility === 'private' && <Lock size={16} className="text-[#8E8E93]" />}
                        </h2>
                        <p className="text-[15px] text-[#8E8E93] leading-tight max-w-[300px] mx-auto">
                            {conversation.description || 'Public communication group.'}
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex justify-around py-4 bg-white border-b border-[#E5E5EA]">
                    <button className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#007AFF] group-active:bg-[#E5E5EA] transition-colors">
                            <Share2 size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-[#007AFF]">Share</span>
                    </button>
                    <button
                        onClick={() => navigate(`/app/chats/${chatId}`)}
                        className="flex flex-col items-center gap-1 group"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#007AFF] group-active:bg-[#E5E5EA] transition-colors">
                            <ImageIcon size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-[#007AFF]">Media</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#007AFF] group-active:bg-[#E5E5EA] transition-colors">
                            <Search size={20} />
                        </div>
                        <span className="text-[11px] font-medium text-[#007AFF]">Search</span>
                    </button>
                </div>

                {/* Main Settings List */}
                <div className="mt-8 space-y-8">
                    {/* General Section */}
                    <section>
                        <h3 className="px-5 text-[13px] text-[#6E6E73] font-medium uppercase tracking-tight mb-2 ml-1">Settings</h3>
                        <div className="bg-white border-y border-[#E5E5EA] divide-y divide-[#E5E5EA]">
                            <div className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-[7px] bg-[#34C759] flex items-center justify-center text-white">
                                        <Lock size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[17px] text-black">Private Group</span>
                                </div>
                                <div
                                    onClick={() => canManageInfo && handleVisibilityChange(conversation.visibility === 'public' ? 'private' : 'public')}
                                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${conversation.visibility === 'private' ? 'bg-[#34C759]' : 'bg-[#C6C6C8]'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${conversation.visibility === 'private' ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <button className="w-full px-4 py-3 flex items-center justify-between active:bg-[#F2F2F7]">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-[7px] bg-[#007AFF] flex items-center justify-center text-white">
                                        <Shield size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[17px] text-black">Permissions</span>
                                </div>
                                <ChevronRight size={18} className="text-[#C4C4C6]" />
                            </button>
                            <button className="w-full px-4 py-3 flex items-center justify-between active:bg-[#F2F2F7]">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-[7px] bg-[#FF9500] flex items-center justify-center text-white">
                                        <Clock size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[17px] text-black">Action Logs</span>
                                </div>
                                <ChevronRight size={18} className="text-[#C4C4C6]" />
                            </button>
                        </div>
                    </section>

                    {/* Members Section */}
                    <section>
                        <div className="px-5 mb-2 ml-1 flex justify-between items-end">
                            <h3 className="text-[13px] text-[#6E6E73] font-medium uppercase tracking-tight">Members • {members.length}</h3>
                            {canManageInfo && (
                                <button className="text-[13px] text-[#007AFF] font-semibold">Add People</button>
                            )}
                        </div>
                        <div className="bg-white border-y border-[#E5E5EA] divide-y divide-[#E5E5EA]">
                            {members.map((member) => (
                                <div key={member.id} className="p-4 flex items-center justify-between active:bg-[#F2F2F7] transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#F2F2F7] overflow-hidden border border-black/5 flex items-center justify-center">
                                            {member.profile?.avatar_url ? (
                                                <img src={member.profile.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-[#E5E5EA] flex items-center justify-center text-lg font-bold text-[#8E8E93]">
                                                    {member.profile?.display_name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[17px] font-semibold text-black flex items-center gap-1.5">
                                                {member.profile?.display_name}
                                                {member.role !== 'member' && (
                                                    <span className="text-[11px] bg-[#E5E5EA] text-[#8E8E93] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-tight">
                                                        {member.role}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[13px] text-[#8E8E93]">{member.profile?.branch || 'Student'}</p>
                                        </div>
                                    </div>

                                    {canManageAdmins && member.user_id !== user?.id && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {member.role === 'member' ? (
                                                <button onClick={() => handleRoleUpdate(member.user_id, 'promote')} className="p-2 text-[#007AFF]">
                                                    <Shield size={18} />
                                                </button>
                                            ) : (
                                                <button onClick={() => handleRoleUpdate(member.user_id, 'demote')} className="p-2 text-[#FF9500]">
                                                    <UserMinus size={18} />
                                                </button>
                                            )}
                                            <button className="p-2 text-[#FF3B30]">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section>
                        <div className="bg-white border-y border-[#E5E5EA] divide-y divide-[#E5E5EA]">
                            <button
                                onClick={handleExit}
                                className="w-full px-4 py-3 flex items-center gap-3 active:bg-[#F2F2F7] text-[#FF3B30] font-semibold"
                            >
                                <LogOut size={20} strokeWidth={2.5} />
                                <span className="text-[17px]">Leave Group</span>
                            </button>
                            {currentUserRole === 'owner' && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-4 py-3 flex items-center gap-3 active:bg-[#F2F2F7] text-[#FF3B30] font-bold"
                                >
                                    <Trash2 size={20} strokeWidth={2.5} />
                                    <span className="text-[17px]">Dissolve Group</span>
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function Search({ size, className }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
    );
}
