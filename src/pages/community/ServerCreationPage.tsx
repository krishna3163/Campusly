import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import {
    ChevronLeft,
    Camera,
    Globe,
    Lock,
    Users,
    Hash,
    Plus,
    X
} from 'lucide-react';
import { insforge } from '../../lib/insforge';
import { useAppStore } from '../../stores/appStore';

export default function ServerCreationPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { showToast } = useAppStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [channels, setChannels] = useState<string[]>(['general', 'announcements']);
    const [newChannel, setNewChannel] = useState('');
    const [creating, setCreating] = useState(false);

    const handleAddChannel = () => {
        if (newChannel.trim() && !channels.includes(newChannel.trim().toLowerCase())) {
            setChannels([...channels, newChannel.trim().toLowerCase()]);
            setNewChannel('');
        }
    };

    const handleCreate = async () => {
        if (!name.trim() || !user?.id) return;
        setCreating(true);
        try {
            const campusId = (user.profile as any)?.campus_id || 'befcc309-623b-47eb-b3f3-83911eae09c7';

            // Create the server/community
            const { data: server, error } = await insforge.database
                .from('conversations')
                .insert({
                    name: name.trim(),
                    type: 'subject_channel',
                    created_by: user.id,
                    campus_id: campusId,
                    is_public: visibility === 'public',
                    visibility,
                    metadata: {
                        description: description.trim(),
                        channels,
                        member_count: 1
                    }
                })
                .select()
                .single();

            if (error) throw error;

            // Add creator as owner/member
            await insforge.database.from('conversation_members').insert({
                conversation_id: server.id,
                user_id: user.id,
                role: 'owner'
            });

            showToast('Community created!', 'success');
            navigate(`/app/chats/${server.id}`);
        } catch (err: any) {
            showToast(err?.message || 'Failed to create community.', 'error');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="h-full bg-[var(--background)] flex flex-col overflow-hidden">
            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shrink-0">
                <button onClick={() => navigate(-1)} className="text-[#007AFF] flex items-center gap-1">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[17px] font-bold text-[var(--foreground)]">Create Community</h1>
                <button
                    onClick={handleCreate}
                    disabled={!name.trim() || creating}
                    className="text-[#007AFF] text-[17px] font-bold disabled:opacity-30"
                >
                    {creating ? 'Creating...' : 'Create'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-6">
                {/* Icon + Name */}
                <div className="flex flex-col items-center gap-4 px-5">
                    <div className="w-24 h-24 rounded-[28px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                        <Camera size={32} className="text-[var(--foreground-muted)]" />
                    </div>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Community Name"
                        className="w-full text-center text-2xl font-bold bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none"
                        maxLength={50}
                    />
                </div>

                {/* Description */}
                <div className="px-5">
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe your community..."
                        rows={3}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-[15px] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none resize-none focus:border-[#007AFF]/30"
                    />
                </div>

                {/* Visibility */}
                <div className="px-5">
                    <h3 className="text-[13px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-3 px-1">Visibility</h3>
                    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
                        <button
                            onClick={() => setVisibility('public')}
                            className="w-full px-4 py-3.5 flex items-center gap-3"
                        >
                            <Globe size={20} className="text-[#34C759]" />
                            <div className="flex-1 text-left">
                                <p className="text-[16px] font-semibold text-[var(--foreground)]">Public</p>
                                <p className="text-[12px] text-[var(--foreground-muted)]">Anyone can find and join</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${visibility === 'public' ? 'border-[#007AFF] bg-[#007AFF]' : 'border-[var(--border)]'} flex items-center justify-center`}>
                                {visibility === 'public' && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                        </button>
                        <button
                            onClick={() => setVisibility('private')}
                            className="w-full px-4 py-3.5 flex items-center gap-3"
                        >
                            <Lock size={20} className="text-[#FF9500]" />
                            <div className="flex-1 text-left">
                                <p className="text-[16px] font-semibold text-[var(--foreground)]">Private</p>
                                <p className="text-[12px] text-[var(--foreground-muted)]">Invite only</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${visibility === 'private' ? 'border-[#007AFF] bg-[#007AFF]' : 'border-[var(--border)]'} flex items-center justify-center`}>
                                {visibility === 'private' && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Channels */}
                <div className="px-5">
                    <h3 className="text-[13px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-3 px-1">Channels</h3>
                    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
                        {channels.map((ch, i) => (
                            <div key={ch} className="px-4 py-3 flex items-center gap-3">
                                <Hash size={16} className="text-[var(--foreground-muted)]" />
                                <span className="text-[15px] text-[var(--foreground)] flex-1">{ch}</span>
                                {i > 0 && (
                                    <button onClick={() => setChannels(channels.filter((_, idx) => idx !== i))} className="text-[#FF3B30]">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <div className="px-4 py-3 flex items-center gap-3">
                            <Plus size={16} className="text-[#007AFF]" />
                            <input
                                value={newChannel}
                                onChange={e => setNewChannel(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddChannel()}
                                placeholder="Add channel..."
                                className="flex-1 bg-transparent text-[15px] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
